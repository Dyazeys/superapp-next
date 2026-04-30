import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  await requireApiPermission(PERMISSIONS.CHANNEL_MASTER_VIEW);

  const channels = await prisma.m_channel.findMany({
    orderBy: { channel_name: "asc" },
    select: {
      channel_id: true,
      channel_name: true,
      slug: true,
      is_marketplace: true,
    },
  });

  return NextResponse.json(toJsonValue(channels));
}
