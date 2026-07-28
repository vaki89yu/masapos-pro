export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, sales, saleItems, products, cashShifts, customers } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ensureSeeded, ensureOpenShift } from "@/lib/seed-data";

export async function GET(request: Request) {
  try {
    // Modo demo sin DB
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ sales: [] });
    }

    await ensureSeeded();
    await ensureOpenShift();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "50");
    const paymentMethod = searchParams.get("paymentMethod");

    let allSales = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit);

    if (paymentMethod && paymentMethod !== "all") {
      allSales = allSales.filter((s) => s.paymentMethod === paymentMethod);
    }

    const saleIds = allSales.map((s) => s.id);
    let itemsMap: Record<number, any[]> = {};

    if (saleIds.length > 0) {
      const allItems = await db.select().from(saleItems);
      allItems.forEach((item) => {
        if (!itemsMap[item.saleId]) {
          itemsMap[item.saleId] = [];
        }
        itemsMap[item.saleId].push(item);
      });
    }

    const enrichedSales = allSales.map((sale) => ({
      ...sale,
      items: itemsMap[sale.id] || [],
    }));

    return NextResponse.json({ sales: enrichedSales });
  } catch (error: any) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json(
      { error: "Error fetching sales", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "El carrito no contiene productos para cobrar." },
        { status: 400 }
      );
    }

    // ✅ MODO DEMO - Sin DATABASE_URL
    if (!process.env.DATABASE_URL) {
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const ticketNumber = `TICK-${ts}-${rand}`;

      const saleItemsList = body.items.map((item: any, idx: number) => ({
        id: idx + 1,
        saleId: 1,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit || "kg",
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        subtotal: String(item.subtotal),
      }));

      return NextResponse.json({
        sale: {
          id: Math.floor(Math.random() * 10000),
          ticketNumber,
          shiftId: body.shiftId || 1,
          customerName: body.customerName || "Público en General",
          paymentMethod: body.paymentMethod || "efectivo",
          subtotal: String(body.subtotal || "0.00"),
          tax: "0.00",
          discount: String(body.discount || "0.00"),
          total: String(body.total || "0.00"),
          cashReceived: String(body.cashReceived || "0.00"),
          changeReturned: String(body.changeReturned || "0.00"),
          status: "completed",
          notes: body.notes || null,
          createdAt: now.toISOString(),
          items: saleItemsList,
        },
      }, { status: 201 });
    }

    // ✅ MODO REAL - Con DATABASE_URL
    await ensureOpenShift();

    let activeShiftId = body.shiftId;
    if (!activeShiftId) {
      const openShifts = await db
        .select()
        .from(cashShifts)
        .where(eq(cashShifts.status, "open"));
      if (openShifts.length > 0) {
        activeShiftId = openShifts[0].id;
      }
    }

    const now = new Date();
    const timestampStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TICK-${timestampStr}-${randomSuffix}`;

    const [newSale] = await db
      .insert(sales)
      .values({
        ticketNumber,
        shiftId: activeShiftId ? Number(activeShiftId) : null,
        customerName: body.customerName || "Público en General",
        paymentMethod: body.paymentMethod || "efectivo",
        subtotal: String(body.subtotal || "0.00"),
        tax: String(body.tax || "0.00"),
        discount: String(body.discount || "0.00"),
        total: String(body.total || "0.00"),
        cashReceived: String(body.cashReceived || "0.00"),
        changeReturned: String(body.changeReturned || "0.00"),
        status: "completed",
        notes: body.notes || null,
      })
      .returning();

    const insertedItems = [];
    for (const item of body.items) {
      const [newSaleItem] = await db
        .insert(saleItems)
        .values({
          saleId: newSale.id,
          productId: Number(item.productId),
          productName: item.productName,
          unit: item.unit || "kg",
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          subtotal: String(item.subtotal),
        })
        .returning();

      insertedItems.push(newSaleItem);

      const [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(item.productId)));

      if (existingProduct) {
        const currStock = Number(existingProduct.stock || 0);
        const qty = Number(item.quantity || 0);
        const updatedStock = Math.max(0, currStock - qty).toFixed(3);

        await db
          .update(products)
          .set({ stock: updatedStock })
          .where(eq(products.id, existingProduct.id));
      }
    }

    if (body.paymentMethod === "credito" && body.customerName && body.customerName !== "Público en General") {
      const existingCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.name, body.customerName));
      if (existingCustomers.length > 0) {
        const cust = existingCustomers[0];
        const newBalance = (Number(cust.balance || 0) + Number(body.total || 0)).toFixed(2);
        await db
          .update(customers)
          .set({ balance: newBalance })
          .where(eq(customers.id, cust.id));
      }
    }

    return NextResponse.json(
      {
        sale: {
          ...newSale,
          items: insertedItems,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json(
      { error: "Error processing checkout", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
