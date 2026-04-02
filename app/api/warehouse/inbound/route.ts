import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { toJsonValue } from "@/lib/json";
import { inboundDeliverySchema } from "@/schemas/warehouse-module";

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET() {
  const inbound = await prisma.inbound_deliveries.findMany({
    orderBy: [{ receive_date: "desc" }, { created_at: "desc" }],
    include: {
      purchase_orders: {
        include: {
          master_vendor: true,
        },
      },
      _count: {
        select: {
          inbound_items: true,
          returns: true,
        },
      },
    },
  });

  return NextResponse.json(toJsonValue(inbound));
}

export async function POST(request: NextRequest) {
  const payload = inboundDeliverySchema.parse(await request.json());

  const inbound = await prisma.inbound_deliveries.create({
    data: {
      po_id: payload.po_id || null,
      receive_date: asDateOnly(payload.receive_date),
      surat_jalan_vendor: payload.surat_jalan_vendor || null,
      qc_status: payload.qc_status,
      received_by: payload.received_by,
      notes: payload.notes || null,
    },
  });

  return NextResponse.json(toJsonValue(inbound), { status: 201 });
}
