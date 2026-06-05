import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { ok: false, error: "Database connection failed." },
      { status: 500 }
    );
  }
}
