import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { channelSchema } from "@/schemas/channel-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const payload = channelSchema.partial().parse(await request.json());

    const channel = await prisma.m_channel.update({
      where: { channel_id: Number(channelId) },
      data: {
        category_id: payload.category_id,
        channel_name: payload.channel_name,
        slug: payload.slug === undefined ? undefined : payload.slug || null,
        is_marketplace: payload.is_marketplace,
      },
    });

    return NextResponse.json(toJsonValue(channel));
  } catch (error) {
    return jsonError(error, "Failed to update channel.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    await prisma.m_channel.delete({
      where: { channel_id: Number(channelId) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete channel.");
  }
}
