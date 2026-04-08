import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { channelSchema } from "@/schemas/channel-module";

export async function GET() {
  try {
    const channels = await prisma.m_channel.findMany({
      orderBy: [{ channel_name: "asc" }, { channel_id: "asc" }],
      include: {
        m_channel_category: {
          include: {
            m_channel_group: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(channels));
  } catch (error) {
    return jsonError(error, "Failed to load channels.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = channelSchema.parse(await request.json());

    const channel = await prisma.m_channel.create({
      data: {
        category_id: payload.category_id,
        piutang_account_id: payload.piutang_account_id,
        revenue_account_id: payload.revenue_account_id,
        saldo_account_id: payload.saldo_account_id,
        channel_name: payload.channel_name,
        slug: payload.slug || null,
        is_marketplace: payload.is_marketplace,
      },
    });

    return NextResponse.json(toJsonValue(channel), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create channel.");
  }
}
