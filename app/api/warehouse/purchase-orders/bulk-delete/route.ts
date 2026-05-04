import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_PURCHASE_ORDER_DELETE);

    const body = await request.json();
    const { ids } = bulkDeleteSchema.parse(body);

    const result = await prisma.$transaction(
      ids.map((id) => prisma.purchase_orders.delete({ where: { id } }))
    );

    return NextResponse.json({ ok: true, deleted: result.length });
  } catch (error) {
    return jsonError(error, "Failed to bulk delete purchase orders.");
  }
}
