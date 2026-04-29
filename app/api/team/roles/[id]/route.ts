import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { roleInputSchema } from "@/schemas/team-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_ROLE_UPDATE);
    const { id } = await params;
    const payload = roleInputSchema.parse(await request.json());

    const updated = await prisma.roles.update({
      where: { id: Number(id) },
      data: {
        role_name: payload.role_name,
        permissions: payload.permissions,
      },
      select: {
        id: true,
        role_name: true,
        permissions: true,
        created_at: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to update team role.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_ROLE_DELETE);
    const { id } = await params;
    const roleId = Number(id);

    const userCount = await prisma.users.count({
      where: { role_id: roleId },
    });
    invariant(userCount === 0, "Role cannot be deleted because it is still assigned to users.", 409);

    await prisma.roles.delete({
      where: { id: roleId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return jsonError(error, "Failed to delete team role.");
  }
}
