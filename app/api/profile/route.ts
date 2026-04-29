import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiAuth } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  DEFAULT_PROFILE_LOCALE,
  DEFAULT_PROFILE_TIMEZONE,
  profileUpdateSchema,
} from "@/schemas/profile";

async function loadProfile(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
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

  invariant(user, "Authenticated user was not found.", 404);

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

export async function GET() {
  try {
    const session = await requireApiAuth();
    const payload = await loadProfile(session.user.id);

    return NextResponse.json(toJsonValue(payload));
  } catch (error) {
    return jsonError(error, "Failed to load profile.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireApiAuth();
    const payload = profileUpdateSchema.parse(await request.json());

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password_hash: true,
      },
    });
    invariant(user, "Authenticated user was not found.", 404);

    const currentPassword = payload.current_password?.trim() ?? "";
    const nextPassword = payload.new_password?.trim() ?? "";

    if (nextPassword) {
      const passwordMatched = await verifyPassword(currentPassword, user.password_hash);
      invariant(passwordMatched, "Current password is not valid.", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: {
          full_name: payload.full_name,
          password_hash: nextPassword ? await hashPassword(nextPassword) : undefined,
          updated_at: new Date(),
        },
      });

      await tx.user_profiles.upsert({
        where: { user_id: user.id },
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
          user_id: user.id,
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

    const nextState = await loadProfile(session.user.id);
    return NextResponse.json(toJsonValue(nextState));
  } catch (error) {
    return jsonError(error, "Failed to update profile.");
  }
}
