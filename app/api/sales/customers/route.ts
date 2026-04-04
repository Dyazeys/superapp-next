import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { salesCustomerSchema } from "@/schemas/sales-module";

export async function GET() {
  try {
    const [customers, metrics] = await Promise.all([
      prisma.master_customer.findMany({
        orderBy: [{ customer_name: "asc" }, { customer_id: "asc" }],
        include: {
          _count: {
            select: {
              t_order: true,
            },
          },
        },
      }),
      prisma.t_order.groupBy({
        by: ["customer_id"],
        where: {
          customer_id: {
            not: null,
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
    ]);

    const metricsByCustomerId = new Map(
      metrics
        .filter((row) => row.customer_id != null)
        .map((row) => [row.customer_id as number, row._sum.total_amount ?? 0])
    );

    const payload = customers.map((customer) => ({
      ...customer,
      metrics: {
        total_revenue: metricsByCustomerId.get(customer.customer_id) ?? 0,
      },
    }));

    return NextResponse.json(toJsonValue(payload));
  } catch (error) {
    return jsonError(error, "Failed to load customers.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = salesCustomerSchema.parse(await request.json());

    const customer = await prisma.master_customer.create({
      data: {
        customer_name: payload.customer_name,
        phone: payload.phone,
        email: payload.email,
        is_active: payload.is_active,
      },
    });

    return NextResponse.json(toJsonValue(customer), { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create customer.");
  }
}
