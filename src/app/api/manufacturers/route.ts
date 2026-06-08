import { NextRequest, NextResponse } from "next/server";
import {
  createManufacturer,
  listManufacturers,
} from "@/lib/productRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json({ manufacturers: await listManufacturers() });
  } catch (error) {
    console.error("Failed to fetch manufacturers", error);
    return jsonError("Failed to fetch manufacturers.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name !== "string" || !body.name.trim()) {
      return jsonError("Manufacturer name is required.");
    }

    const id = await createManufacturer(body.name);
    return NextResponse.json(
      { manufacturer: { id, name: body.name.trim() } },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create manufacturer.";
    console.error("Failed to create manufacturer", error);
    return jsonError(message, message.includes("Duplicate") ? 409 : 500);
  }
}
