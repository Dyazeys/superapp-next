import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Warehouse returns feature is currently unavailable due to schema changes." }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Warehouse returns feature is currently unavailable due to schema changes." }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Warehouse returns feature is currently unavailable due to schema changes." }, { status: 501 });
}
