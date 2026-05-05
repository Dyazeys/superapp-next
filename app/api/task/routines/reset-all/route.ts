import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.user.id;

    await prisma.routines.updateMany({
      where: { user_id: userId, is_completed: true },
      data: { is_completed: false, completed_at: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, "Failed to reset routines.");
  }
}
