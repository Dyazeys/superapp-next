import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { channelGroupSchema } from "@/schemas/channel-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CHANNEL_GROUP_UPDATE);

    const { groupId } = await params;
    const payload = channelGroupSchema.partial().parse(await request.json());

    const group = await prisma.m_channel_group.update({
      where: { group_id: Number(groupId) },
      data: {
        group_name: payload.group_name,
      },
    });

    return NextResponse.json(toJsonValue(group));
  } catch (error) {
    return jsonError(error, "Failed to update channel group.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CHANNEL_GROUP_DELETE);

    const { groupId } = await params;
    await prisma.m_channel_group.delete({
      where: { group_id: Number(groupId) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete channel group.");
  }
}
