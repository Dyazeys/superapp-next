import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiAuth } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiAuth();
    const userId = session.user.id;
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendances.findFirst({
      where: { user_id: userId, date: today, clock_out: null },
    });
    invariant(attendance, "No active clock-in found for today.", 400);

    const clockInTime = attendance.clock_in ? new Date(attendance.clock_in).getTime() : 0;
    const durationHours = (now.getTime() - clockInTime) / (1000 * 60 * 60);
    let status = attendance.status;
    if (durationHours < 8 && status !== "late") {
      status = "early_leave";
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      const body = await request.json();
      if (typeof body.latitude === "number" && typeof body.longitude === "number") {
        latitude = body.latitude;
        longitude = body.longitude;
      }
    } catch {}

    const updated = await prisma.attendances.update({
      where: { id: attendance.id },
      data: { clock_out: now, status, note: "", clock_out_lat: latitude, clock_out_lng: longitude },
    });

    return NextResponse.json(toJsonValue(updated));
  } catch (error) {
    return jsonError(error, "Failed to clock out.");
  }
}
