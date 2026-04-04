import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { channelCategorySchema } from "@/schemas/channel-module";

export async function GET() {
  try {
    const categories = await prisma.m_channel_category.findMany({
      orderBy: [{ category_name: "asc" }, { category_id: "asc" }],
      include: {
        m_channel_group: true,
        _count: {
          select: {
            m_channel: true,
          },
        },
      },
    });

    return NextResponse.json(toJsonValue(categories));
  } catch (error) {
    return jsonError(error, "Failed to load channel categories.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = channelCategorySchema.parse(await request.json());

    const category = await prisma.m_channel_category.create({
      data: {
        group_id: payload.group_id,
        category_name: payload.category_name,
      },
    });

    return NextResponse.json(toJsonValue(category), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create channel category.");
  }
}
