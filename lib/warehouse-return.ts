import "server-only";
import { prisma } from "@/db/prisma";
import { invariant } from "@/lib/api-error";

/**
 * Generate a return reference number: WR-YYYYMMDD-XXX
 */
export async function generateReturnRefNo(): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `WR-${yyyy}${mm}${dd}-`;

  const lastReturn = await prisma.warehouse_returns.findFirst({
    where: { ref_no: { startsWith: prefix } },
    orderBy: { ref_no: "desc" },
    select: { ref_no: true },
  });

  let nextSeq = 1;
  if (lastReturn) {
    const lastSeq = parseInt(lastReturn.ref_no.slice(prefix.length), 10);
    if (!Number.isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

/**
 * Convert a t_order item to warehouse_return_items input.
 * Returns items with quantities from order items (qty_returned = order qty initially).
 */
export async function buildReturnItemsFromOrder(refNo: string) {
  const order = await prisma.t_order.findUnique({
    where: { ref_no: refNo },
    include: {
      t_order_item: {
        include: {
          master_product: {
            select: {
              sku: true,
              sku_name: true,
              inv_main: true,
              inv_acc: true,
              master_inventory_master_product_inv_mainTomaster_inventory: {
                select: { inv_code: true, inv_name: true },
              },
            },
          },
        },
      },
    },
  });

  invariant(order, `Order with ref_no ${refNo} not found.`);

  return order.t_order_item
    .filter((item) => item.sku && item.master_product)
    .map((item) => {
      const invCode =
        item.master_product!.inv_main ?? item.master_product!.inv_acc ?? "";
      return {
        sku: item.sku!,
        inv_code: invCode,
        qty_returned: item.qty,
        unit_cost: item.unit_price,
        master_product_sku: item.sku!,
        master_inventory_inv_code: invCode,
      };
    });
}