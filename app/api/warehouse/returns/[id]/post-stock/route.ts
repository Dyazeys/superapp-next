import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Warehouse returns feature is currently unavailable due to schema changes." }, { status: 501 });
}
