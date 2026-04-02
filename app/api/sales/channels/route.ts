import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";

export async function GET() {
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
