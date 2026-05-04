import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.departments.findUnique({ where: { id } });
    invariant(existing, "Department not found.", 404);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.parent_id !== undefined) data.parent_id = body.parent_id?.toString() ?? null;
    if (body.head_user_id !== undefined) data.head_user_id = body.head_user_id ?? null;

    const department = await prisma.departments.update({ where: { id }, data });

    return NextResponse.json(toJsonValue(department));
  } catch (error) {
    return jsonError(error, "Failed to update department.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id } = await params;

    const existing = await prisma.departments.findUnique({ where: { id } });
    invariant(existing, "Department not found.", 404);

    const children = await prisma.departments.count({ where: { parent_id: id } });
    invariant(children === 0, "Cannot delete department with sub-departments.", 400);

    await prisma.department_members.deleteMany({ where: { department_id: id } });
    await prisma.departments.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to delete department.");
  }
}
