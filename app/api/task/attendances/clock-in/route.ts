import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiAuth } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiAuth();
    const userId = session.user.id;
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendances.findFirst({
      where: { user_id: userId, date: today },
    });

    if (existing) {
      return NextResponse.json(toJsonValue(existing));
    }

    const hours = now.getHours();
    const status = hours >= 9 ? "late" : "present";

    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      const body = await request.json();
      if (typeof body.latitude === "number" && typeof body.longitude === "number") {
        latitude = body.latitude;
        longitude = body.longitude;
      }
    } catch {}

    const attendance = await prisma.attendances.create({
      data: {
        user_id: userId,
        date: today,
        clock_in: now,
        status,
        clock_in_lat: latitude,
        clock_in_lng: longitude,
      },
    });

    return NextResponse.json(toJsonValue(attendance), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to clock in.");
  }
}
