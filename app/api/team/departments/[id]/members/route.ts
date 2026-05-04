import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id: departmentId } = await params;
    const body = await request.json();

    const member = await prisma.department_members.create({
      data: {
        department_id: departmentId,
        user_id: body.user_id,
        role_title: body.role_title ?? null,
      },
    });

    return NextResponse.json(toJsonValue(member), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to add department member.");
  }
}
