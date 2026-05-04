import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { departmentInputSchema } from "@/schemas/task-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);

    const [departments, members] = await Promise.all([
      prisma.departments.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.department_members.findMany(),
    ]);

    return NextResponse.json(toJsonValue({ departments, members }));
  } catch (error) {
    return jsonError(error, "Failed to load departments.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_WORKSPACE_VIEW);
    const body = departmentInputSchema.parse(await request.json());

    const department = await prisma.departments.create({
      data: {
        name: body.name,
        parent_id: body.parent_id?.toString() ?? null,
        head_user_id: body.head_user_id ?? null,
      },
    });

    return NextResponse.json(toJsonValue(department), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create department.");
  }
}
