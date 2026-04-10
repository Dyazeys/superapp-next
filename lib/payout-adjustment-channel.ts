import type { Prisma } from "@prisma/client";
import { invariant } from "@/lib/api-error";

type Tx = Prisma.TransactionClient;

type ResolveInput = {
  channelId?: number | null;
  ref?: string | null;
  marketplace?: string | null;
  post?: string | null;
};

const PHRASE_NORMALIZATION: Array<[RegExp, string]> = [
  [/\btik[\s-]*tok[\s-]*shop\b/g, "tiktokshop"],
  [/\bshopee[\s-]*food\b/g, "shopeefood"],
  [/\btop[\s-]*ed\b/g, "tokopedia"],
];

const TOKEN_NORMALIZATION: Record<string, string> = {
  tokped: "tokopedia",
  tokpedi: "tokopedia",
  toped: "tokopedia",
  topedia: "tokopedia",
  tiktok: "tiktokshop",
  tiktop: "tiktokshop",
  tts: "tiktokshop",
  "tiktok-shop": "tiktokshop",
  shope: "shopee",
  shp: "shopee",
  shoppe: "shopee",
  shopefood: "shopeefood",
  shopeefood: "shopeefood",
  bl: "bukalapak",
  bkla: "bukalapak",
  buka: "bukalapak",
  buklapak: "bukalapak",
  laz: "lazada",
  lazad: "lazada",
  lazda: "lazada",
};

function sanitize(value: string | null | undefined) {
  let normalized = (value ?? "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[().,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of PHRASE_NORMALIZATION) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalize(value: string | null | undefined) {
  const normalized = sanitize(value);
  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((token) => TOKEN_NORMALIZATION[token] ?? token)
    .join(" ")
    .trim();
}

function compact(value: string) {
  return value.replace(/\s+/g, "");
}

function expandSearchTerms(value: string | null | undefined) {
  const canonical = canonicalize(value);
  if (!canonical) return [];

  const terms = new Set<string>();
  terms.add(canonical);
  terms.add(slugify(canonical));
  terms.add(compact(canonical));

  const tokenJoined = canonical.split(" ").join("-");
  if (tokenJoined) terms.add(tokenJoined);

  return [...terms].filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hasRowChannel(marketplace: string | null | undefined, post: string | null | undefined) {
  return Boolean(canonicalize(marketplace) || canonicalize(post));
}

export async function resolvePayoutAdjustmentChannelId(tx: Tx, input: ResolveInput) {
  const marketplace = canonicalize(input.marketplace);
  const post = canonicalize(input.post);

  if (hasRowChannel(input.marketplace, input.post)) {
    const marketplaceTerms = expandSearchTerms(marketplace);
    const postTerms = expandSearchTerms(post);
    const slugParts = [marketplaceTerms[0], postTerms[0]].filter(Boolean);
    const combinedSlug = slugParts.length > 0 ? slugify(slugParts.join("-")) : "";
    const combinedLabel = [marketplaceTerms[0], postTerms[0]].filter(Boolean).join(" ");

    const candidates = await tx.m_channel.findMany({
      where: {
        OR: [
          ...(combinedSlug
            ? [{ slug: { equals: combinedSlug, mode: "insensitive" as const } }]
            : []),
          ...(combinedLabel
            ? [{ channel_name: { equals: combinedLabel, mode: "insensitive" as const } }]
            : []),
          ...marketplaceTerms.flatMap((term) => [
            { channel_name: { contains: term, mode: "insensitive" as const } },
            { slug: { contains: term, mode: "insensitive" as const } },
          ]),
          ...postTerms.flatMap((term) => [
            { channel_name: { contains: term, mode: "insensitive" as const } },
            { slug: { contains: term, mode: "insensitive" as const } },
          ]),
        ],
      },
      select: {
        channel_id: true,
        channel_name: true,
        slug: true,
      },
    });

    const scored = candidates
      .map((channel) => {
        const channelName = canonicalize(channel.channel_name);
        const slug = canonicalize(channel.slug);
        const channelCompact = compact(channelName);
        const slugCompact = compact(slug);
        let score = 0;

        if (combinedSlug && slug === combinedSlug) score += 100;
        if (combinedLabel && channelName === combinedLabel) score += 90;

        for (const term of marketplaceTerms) {
          const termCanonical = canonicalize(term);
          const termCompact = compact(termCanonical);
          if (channelName.includes(termCanonical)) score += 24;
          if (slug.includes(termCanonical)) score += 20;
          if (channelCompact.includes(termCompact)) score += 16;
          if (slugCompact.includes(termCompact)) score += 14;
        }

        for (const term of postTerms) {
          const termCanonical = canonicalize(term);
          const termCompact = compact(termCanonical);
          if (channelName.includes(termCanonical)) score += 24;
          if (slug.includes(termCanonical)) score += 20;
          if (channelCompact.includes(termCompact)) score += 16;
          if (slugCompact.includes(termCompact)) score += 14;
        }

        if (marketplace && post && channelName.includes(marketplace) && channelName.includes(post)) score += 20;
        if (marketplace && post && slug.includes(marketplace) && slug.includes(post)) score += 20;

        return { channel, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.channel.channel_id - right.channel.channel_id);

    invariant(
      scored.length > 0,
      `Channel resolve failed for row. marketplace="${input.marketplace ?? "-"}", post="${input.post ?? "-"}", ref="${input.ref ?? "-"}". Row should be skipped or corrected.`
    );

    return scored[0].channel.channel_id;
  }

  if (input.ref) {
    const order = await tx.t_order.findFirst({
      where: { ref_no: input.ref },
      select: { channel_id: true },
    });
    invariant(order, `Channel resolve fallback failed: sales reference "${input.ref}" was not found.`);
    invariant(
      order.channel_id != null,
      `Channel resolve fallback failed: no channel mapped on sales reference "${input.ref}". Row should be skipped or corrected.`
    );
    return order.channel_id;
  }

  if (input.channelId != null) {
    const channel = await tx.m_channel.findUnique({
      where: { channel_id: input.channelId },
      select: { channel_id: true },
    });
    invariant(channel, `Provided channel_id "${input.channelId}" was not found.`);
    return channel.channel_id;
  }

  return null;
}
