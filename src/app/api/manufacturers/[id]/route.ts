import { NextRequest, NextResponse } from "next/server";
import { updateManufacturer } from "@/lib/productRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name !== "string" || !body.name.trim()) {
      return jsonError("Manufacturer name is required.");
    }

    await updateManufacturer(id, body.name);
    return NextResponse.json({
      manufacturer: { id, name: body.name.trim() },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update manufacturer.";
    console.error("Failed to update manufacturer", error);
    return jsonError(message, message.includes("Duplicate") ? 409 : 500);
  }
}
