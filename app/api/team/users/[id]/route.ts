import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { userUpdateSchema } from "@/schemas/team-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiPermission(PERMISSIONS.AUTH_USER_UPDATE);
    const { id } = await params;
    const payload = userUpdateSchema.parse(await request.json());

    const role = await prisma.roles.findUnique({
      where: { id: payload.role_id },
      select: { id: true },
    });
    invariant(role, "Role was not found.");
    invariant(
      !(session.user.id === id && payload.is_active === false),
      "You cannot deactivate your own active session."
    );

    const updated = await prisma.users.update({
      where: { id },
      data: {
        username: payload.username,
        full_name: payload.full_name,
        role_id: payload.role_id,
        password_hash: payload.password?.trim() ? await hashPassword(payload.password) : undefined,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: {
            id: true,
            role_name: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to update team user.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiPermission(PERMISSIONS.AUTH_USER_DELETE);
    const { id } = await params;

    invariant(session.user.id !== id, "You cannot delete your own active session.");

    await prisma.users.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return jsonError(error, "Failed to delete team user.");
  }
}
