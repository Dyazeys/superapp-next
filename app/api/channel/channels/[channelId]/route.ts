import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { channelSchema } from "@/schemas/channel-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CHANNEL_MASTER_UPDATE);

    const { channelId } = await params;
    const payload = channelSchema.partial().parse(await request.json());

    const channel = await prisma.m_channel.update({
      where: { channel_id: Number(channelId) },
      data: {
        category_id: payload.category_id,
        piutang_account_id: payload.piutang_account_id,
        revenue_account_id: payload.revenue_account_id,
        saldo_account_id: payload.saldo_account_id,
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
    await requireApiPermission(PERMISSIONS.CHANNEL_MASTER_DELETE);

    const { channelId } = await params;
    await prisma.m_channel.delete({
      where: { channel_id: Number(channelId) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete channel.");
  }
}
