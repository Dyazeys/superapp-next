import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { salesCustomerSchema } from "@/schemas/sales-module";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.SALES_CUSTOMER_UPDATE);

    const { customerId } = await params;
    const payload = salesCustomerSchema.partial().parse(await request.json());

    const customer = await prisma.master_customer.update({
      where: { customer_id: Number(customerId) },
      data: {
        customer_name: payload.customer_name,
        phone: payload.phone,
        email: payload.email,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(toJsonValue(customer));
  } catch (error) {
    return jsonError(error, "Failed to update customer.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.SALES_CUSTOMER_DELETE);

    const { customerId } = await params;
    const id = Number(customerId);

    invariant(Number.isInteger(id), "Customer id is invalid.");

    const linkedOrders = await prisma.t_order.count({
      where: { customer_id: id },
    });

    invariant(linkedOrders === 0, "Customer cannot be deleted while referenced by sales orders.", 409);

    await prisma.master_customer.delete({
      where: { customer_id: id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Failed to delete customer.");
  }
}
