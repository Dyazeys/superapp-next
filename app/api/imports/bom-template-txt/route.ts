import { NextRequest, NextResponse } from "next/server";
import { importBomTemplateText } from "@/lib/bom-template-import";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { PERMISSIONS } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(PERMISSIONS.PRODUCT_BOM_CREATE);

    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode");

    invariant(file instanceof File, "TXT file is required.");
    const lowerName = file.name.toLowerCase();
    invariant(lowerName.endsWith(".txt") || lowerName.endsWith(".json"), "Only .txt or .json files are supported.");
    invariant(file.size > 0, "TXT file is empty.");

    const txtText = await file.text();
    const result = await importBomTemplateText({
      txtText,
      mode: typeof mode === "string" ? mode : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to import BOM TXT template.");
  }
}
