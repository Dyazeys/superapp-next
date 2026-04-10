import { NextRequest, NextResponse } from "next/server";
import { invariant, jsonError } from "@/lib/api-error";
import { importMasterDataCsv, MASTER_IMPORT_DEFINITIONS, type MasterImportKey } from "@/lib/master-data-import";

function isMaster(value: string): value is MasterImportKey {
  return value in MASTER_IMPORT_DEFINITIONS;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ master: string }> }
) {
  try {
    const { master } = await params;
    invariant(isMaster(master), "Unsupported master import target.");

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
