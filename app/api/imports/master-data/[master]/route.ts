import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { importMasterDataCsv, MASTER_IMPORT_DEFINITIONS, type MasterImportKey } from "@/lib/master-data-import";
import { PERMISSIONS, type Permission } from "@/lib/rbac";

function isMaster(value: string): value is MasterImportKey {
  return value in MASTER_IMPORT_DEFINITIONS;
}

function viewPermissionForMaster(master: MasterImportKey): Permission {
  switch (master) {
    case "channel":
      return PERMISSIONS.CHANNEL_MASTER_VIEW;
    case "customer":
      return PERMISSIONS.SALES_CUSTOMER_VIEW;
    case "product_category":
      return PERMISSIONS.PRODUCT_CATEGORY_VIEW;
    case "product":
      return PERMISSIONS.PRODUCT_MASTER_VIEW;
    case "product_bom":
      return PERMISSIONS.PRODUCT_BOM_VIEW;
    case "inventory":
      return PERMISSIONS.PRODUCT_INVENTORY_VIEW;
    case "vendor":
      return PERMISSIONS.WAREHOUSE_VENDOR_VIEW;
  }
}

function writePermissionForMaster(master: MasterImportKey): Permission {
  switch (master) {
    case "channel":
      return PERMISSIONS.CHANNEL_MASTER_CREATE;
    case "customer":
      return PERMISSIONS.SALES_CUSTOMER_CREATE;
    case "product_category":
      return PERMISSIONS.PRODUCT_CATEGORY_CREATE;
    case "product":
      return PERMISSIONS.PRODUCT_MASTER_CREATE;
    case "product_bom":
      return PERMISSIONS.PRODUCT_BOM_CREATE;
    case "inventory":
      return PERMISSIONS.PRODUCT_INVENTORY_CREATE;
    case "vendor":
      return PERMISSIONS.WAREHOUSE_VENDOR_CREATE;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ master: string }> }
) {
  try {
    const { master } = await params;
    invariant(isMaster(master), "Unsupported master import target.");
    await requireApiPermission(viewPermissionForMaster(master));

    return NextResponse.json({
      master,
      definition: MASTER_IMPORT_DEFINITIONS[master],
    });
  } catch (error) {
    return jsonError(error, "Failed to load master import format.");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ master: string }> }
) {
  try {
    const { master } = await params;
    invariant(isMaster(master), "Unsupported master import target.");
    await requireApiPermission(writePermissionForMaster(master));

    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode");

    invariant(file instanceof File, "CSV file is required.");
    invariant(file.name.toLowerCase().endsWith(".csv"), "Only .csv files are supported.");
    invariant(file.size > 0, "CSV file is empty.");

    const csvText = await file.text();
    const result = await importMasterDataCsv({
      master,
      csvText,
      mode: typeof mode === "string" ? mode : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to import master CSV.");
  }
}
