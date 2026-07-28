export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, masaProductionLogs, products } from "@/db";
import { desc, eq, ilike } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed-data";

export async function GET() {
  try {
    await ensureSeeded();
    const logs = await db
      .select()
      .from(masaProductionLogs)
      .orderBy(desc(masaProductionLogs.createdAt));

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("GET /api/production error:", error);
    return NextResponse.json(
      { error: "Error fetching production logs", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productType, kilosProduced, cornUsedKg, costTotal, notes, updateStock, productId } =
      body;

    if (!productType || !kilosProduced || !cornUsedKg) {
      return NextResponse.json(
        {
          error: "Falta información: Tipo de masa/producto, kilos producidos o kilos de maíz consumidos.",
        },
        { status: 400 }
      );
    }

    const [newLog] = await db
      .insert(masaProductionLogs)
      .values({
        productType: String(productType),
        kilosProduced: String(kilosProduced),
        cornUsedKg: String(cornUsedKg),
        costTotal: String(costTotal || "0.00"),
        notes: notes || null,
      })
      .returning();

    // Si el usuario solicitó aumentar el inventario de masa al registrar molienda
    if (updateStock && productId) {
      const [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(productId)));

      if (existingProduct) {
        const newStock = (
          Number(existingProduct.stock || 0) + Number(kilosProduced || 0)
        ).toFixed(3);
        await db
          .update(products)
          .set({ stock: newStock })
          .where(eq(products.id, existingProduct.id));
      }
    }

    return NextResponse.json({ log: newLog }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/production error:", error);
    return NextResponse.json(
      { error: "Error logging production", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
