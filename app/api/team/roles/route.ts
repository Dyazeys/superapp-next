import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { roleInputSchema } from "@/schemas/team-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_ROLE_VIEW);

    const roles = await prisma.roles.findMany({
      orderBy: [{ role_name: "asc" }],
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

    return NextResponse.json(toJsonValue(roles));
  } catch (error) {
    return jsonError(error, "Failed to load team roles.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_ROLE_CREATE);
    const payload = roleInputSchema.parse(await request.json());

    const created = await prisma.roles.create({
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

    return NextResponse.json(toJsonValue(created), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create team role.");
  }
}
