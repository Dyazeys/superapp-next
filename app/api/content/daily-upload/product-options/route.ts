import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    await requireApiPermission(PERMISSIONS.CONTENT_DAILY_REPORT_VIEW);

    const products = await prisma.master_product.findMany({
      where: { is_active: true },
      orderBy: { product_name: "asc" },
      select: {
        sku: true,
        product_name: true,
      },
    });

    const options = products.map((product) => ({
      value: product.product_name,
      label: product.product_name,
    }));

    return NextResponse.json(toJsonValue(options));
  } catch (error) {
    return jsonError(error, "Gagal memuat opsi produk.");
  }
}
