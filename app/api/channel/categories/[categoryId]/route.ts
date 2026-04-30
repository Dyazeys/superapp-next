import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { channelCategorySchema } from "@/schemas/channel-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CHANNEL_CATEGORY_UPDATE);

    const { categoryId } = await params;
    const payload = channelCategorySchema.partial().parse(await request.json());

    const category = await prisma.m_channel_category.update({
      where: { category_id: Number(categoryId) },
      data: {
        group_id: payload.group_id,
        category_name: payload.category_name,
      },
    });

    return NextResponse.json(toJsonValue(category));
  } catch (error) {
    return jsonError(error, "Failed to update channel category.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.CHANNEL_CATEGORY_DELETE);

    const { categoryId } = await params;
    await prisma.m_channel_category.delete({
      where: { category_id: Number(categoryId) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete channel category.");
  }
}
