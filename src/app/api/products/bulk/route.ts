import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { bulkUpsertProducts, ProductInput } from "@/lib/productRepository";
import { ProductStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses: ProductStatus[] = ["active", "draft", "archived"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function getCell(row: Record<string, unknown>, keys: string[]) {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );
  for (const key of keys) {
    const value = normalized.get(normalizeHeader(key));
    if (value !== undefined && value !== null) return String(value).trim();
  }
  return "";
}

function toNumber(value: string, fallback = 0) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseRows(rows: Record<string, unknown>[], manufacturerId: string) {
  const products: ProductInput[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const name = getCell(row, ["name", "product name", "product"]);
    const sku = getCell(row, ["sku", "product sku"]).toUpperCase();
    const category = getCell(row, ["category"]) || "Other";
    const statusValue = (getCell(row, ["status"]) || "active") as ProductStatus;

    if (!name || !sku) {
      errors.push(`Row ${line}: name and sku are required.`);
      return;
    }

    if (!statuses.includes(statusValue)) {
      errors.push(`Row ${line}: status must be active, draft, or archived.`);
      return;
    }

    products.push({
      manufacturerId,
      name,
      sku,
      category,
      description: getCell(row, ["description", "details"]),
      price: toNumber(getCell(row, ["price", "selling price", "selling_price"])),
      cost: toNumber(getCell(row, ["cost", "unit cost", "unit_cost"])),
      quantity: Math.floor(toNumber(getCell(row, ["quantity", "qty", "stock"]))),
      reorderLevel: Math.floor(
        toNumber(getCell(row, ["reorder level", "reorder_level", "reorder"]))
      ),
      status: statusValue,
    });
  });

  return { products, errors };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const manufacturerId = formData.get("manufacturerId");
    const file = formData.get("file");

    if (typeof manufacturerId !== "string" || !manufacturerId) {
      return jsonError("Manufacturer is required for bulk upload.");
    }

    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Please upload a CSV or Excel file.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return jsonError("The uploaded file has no sheets.");

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: "" }
    );
    const { products, errors } = parseRows(rows, manufacturerId);

    if (products.length === 0) {
      return jsonError(
        errors[0] ?? "No valid product rows were found in the file."
      );
    }

    const result = await bulkUpsertProducts(products);
    return NextResponse.json({
      imported: result.imported,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Failed to bulk upload products", error);
    return jsonError("Failed to bulk upload products.", 500);
  }
}
