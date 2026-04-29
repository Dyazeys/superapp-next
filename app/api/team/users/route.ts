import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { userCreateSchema } from "@/schemas/team-module";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_USER_VIEW);

    const [users, roles] = await Promise.all([
      prisma.users.findMany({
        orderBy: [{ is_active: "desc" }, { created_at: "asc" }],
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
      }),
      prisma.roles.findMany({
        orderBy: [{ role_name: "asc" }],
        select: {
          id: true,
          role_name: true,
        },
      }),
    ]);

    return NextResponse.json(toJsonValue({ users, roles }));
  } catch (error) {
    return jsonError(error, "Failed to load team users.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_USER_CREATE);
    const payload = userCreateSchema.parse(await request.json());

    const role = await prisma.roles.findUnique({
      where: { id: payload.role_id },
      select: { id: true },
    });
    invariant(role, "Role was not found.");

    const created = await prisma.users.create({
      data: {
        username: payload.username,
        full_name: payload.full_name,
        role_id: payload.role_id,
        password_hash: await hashPassword(payload.password),
        is_active: payload.is_active,
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

    return NextResponse.json(toJsonValue(created), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create team user.");
  }
}
