import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function invariant(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw new AppError(message, status);
  }
}

export function jsonError(error: unknown, fallback = "Unexpected server error") {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid request" }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A record with the same unique value already exists." }, { status: 409 });
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "This action is blocked because the referenced data is missing or still in use." },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "The requested record was not found." }, { status: 404 });
    }
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status: 500 });
}
