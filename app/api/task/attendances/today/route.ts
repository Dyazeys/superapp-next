import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireApiPermission(PERMISSIONS.TASK_WORKSPACE_VIEW);
    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendances.findFirst({
      where: { user_id: userId, date: today },
    });

    return NextResponse.json(toJsonValue(attendance));
  } catch (error) {
    return jsonError(error, "Failed to load today's attendance.");
  }
}
