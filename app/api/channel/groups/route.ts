import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { channelGroupSchema } from "@/schemas/channel-module";

export async function GET() {
  try {
    const groups = await prisma.m_channel_group.findMany({
      orderBy: [{ group_name: "asc" }, { group_id: "asc" }],
      include: {
        _count: {
          select: {
            m_channel_category: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(groups));
  } catch (error) {
    return jsonError(error, "Failed to load channel groups.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = channelGroupSchema.parse(await request.json());
    const group = await prisma.m_channel_group.create({
      data: {
        group_name: payload.group_name,
      },
    });

    return NextResponse.json(toJsonValue(group), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create channel group.");
  }
}
