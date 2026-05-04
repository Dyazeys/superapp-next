import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const { id: departmentId, userId } = await params;

    await prisma.department_members.deleteMany({
      where: { department_id: departmentId, user_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to remove department member.");
  }
}
