import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { invariant, jsonError } from "@/lib/api-error";
import { requireApiPermission } from "@/lib/authz";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import {
  DEFAULT_PROFILE_LOCALE,
  DEFAULT_PROFILE_TIMEZONE,
  teamUserProfileUpdateSchema,
} from "@/schemas/profile";

async function loadTeamUserProfile(id: string) {
  const user = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      full_name: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      roles: {
        select: {
          role_name: true,
        },
      },
      profile: true,
    },
  });

  invariant(user, "User was not found.", 404);

  return {
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role_name: user.roles?.role_name ?? null,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    profile: user.profile,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_USER_VIEW);
    const { id } = await params;
    const payload = await loadTeamUserProfile(id);

    return NextResponse.json(toJsonValue(payload));
  } catch (error) {
    return jsonError(error, "Failed to load team user profile.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.AUTH_USER_UPDATE);
    const { id } = await params;
    const payload = teamUserProfileUpdateSchema.parse(await request.json());

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { id },
        select: { id: true },
      });
      invariant(user, "User was not found.", 404);

      await tx.users.update({
        where: { id },
        data: {
          full_name: payload.full_name,
          updated_at: new Date(),
        },
      });

      await tx.user_profiles.upsert({
        where: { user_id: id },
        update: {
          display_name: payload.display_name ?? null,
          phone: payload.phone ?? null,
          avatar_url: payload.avatar_url ?? null,
          job_title: payload.job_title ?? null,
          department: payload.department ?? null,
          timezone: payload.timezone ?? DEFAULT_PROFILE_TIMEZONE,
          locale: payload.locale ?? DEFAULT_PROFILE_LOCALE,
          bio: payload.bio ?? null,
          updated_at: new Date(),
        },
        create: {
          user_id: id,
          display_name: payload.display_name ?? null,
          phone: payload.phone ?? null,
          avatar_url: payload.avatar_url ?? null,
          job_title: payload.job_title ?? null,
          department: payload.department ?? null,
          timezone: payload.timezone ?? DEFAULT_PROFILE_TIMEZONE,
          locale: payload.locale ?? DEFAULT_PROFILE_LOCALE,
          bio: payload.bio ?? null,
        },
      });
    });

    const nextState = await loadTeamUserProfile(id);
    return NextResponse.json(toJsonValue(nextState));
  } catch (error) {
    return jsonError(error, "Failed to update team user profile.");
  }
}
