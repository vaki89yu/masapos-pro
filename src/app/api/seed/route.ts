export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed-data";

export async function POST() {
  try {
    const result = await ensureSeeded();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error seeding database", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await ensureSeeded();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error seeding database", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
