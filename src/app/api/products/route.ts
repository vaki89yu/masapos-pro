export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, products } from "@/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed-data";

export async function GET(request: Request) {
  try {
    // Modo demo sin DB
    if (!process.env.DATABASE_URL) {
      const demoProducts = [
        { id: 1, barcode: "MASA-TIENDA-001", name: "Masa de Maíz • Venta en Tienda ($10/kg)", description: "Masa fresca nixtamalizada del molino", category: "tienda", unit: "kg", price: "10.00", costPrice: "6.50", stock: "450.000", minStockAlert: "50.000", isBulk: true, active: true, createdAt: new Date().toISOString() },
        { id: 2, barcode: "MASA-MOTO-002", name: "Masa de Maíz • Reparto en Moto ($11/kg)", description: "Masa fresca enviada a domicilio", category: "reparto_moto", unit: "kg", price: "11.00", costPrice: "7.00", stock: "350.000", minStockAlert: "50.000", isBulk: true, active: true, createdAt: new Date().toISOString() },
      ];
      return NextResponse.json({ products: demoProducts });
    }

    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const barcode = searchParams.get("barcode");

    let allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.active), products.category, products.name);

    if (barcode) {
      allProducts = allProducts.filter((p) => p.barcode === barcode);
    }
    if (category && category !== "all") {
      allProducts = allProducts.filter((p) => p.category === category);
    }
    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      allProducts = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ products: allProducts });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Error fetching products", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      barcode,
      name,
      description,
      category,
      unit,
      price,
      costPrice,
      stock,
      minStockAlert,
      isBulk,
      imageUrl,
    } = body;

    if (!barcode || !name || !price || !category) {
      return NextResponse.json(
        { error: "Campos requeridos: código de barras, nombre, precio y categoría." },
        { status: 400 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        barcode: String(barcode).trim(),
        name: String(name).trim(),
        description: description || "",
        category: category || "abarrotes",
        unit: unit || "kg",
        price: String(price),
        costPrice: String(costPrice || price),
        stock: String(stock || "0"),
        minStockAlert: String(minStockAlert || "5"),
        isBulk: Boolean(isBulk ?? true),
        imageUrl: imageUrl || null,
        active: true,
      })
      .returning();

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Error creating product", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.price !== undefined) updateData.price = String(updates.price);
    if (updates.costPrice !== undefined) updateData.costPrice = String(updates.costPrice);
    if (updates.stock !== undefined) updateData.stock = String(updates.stock);
    if (updates.minStockAlert !== undefined)
      updateData.minStockAlert = String(updates.minStockAlert);
    if (updates.isBulk !== undefined) updateData.isBulk = Boolean(updates.isBulk);
    if (updates.active !== undefined) updateData.active = Boolean(updates.active);

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, Number(id)))
      .returning();

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error("PATCH /api/products error:", error);
    return NextResponse.json(
      { error: "Error updating product", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
