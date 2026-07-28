export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, customers, cashMovements, cashShifts } from "@/db";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed-data";

export async function GET() {
  try {
    await ensureSeeded();
    const allCustomers = await db.select().from(customers).orderBy(customers.name);
    return NextResponse.json({ customers: allCustomers });
  } catch (error: any) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Error fetching customers", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "pay_credit") {
      const { customerId, amount, shiftId, notes } = body;
      if (!customerId || !amount || Number(amount) <= 0) {
        return NextResponse.json(
          { error: "Monto inválido o falta ID de cliente." },
          { status: 400 }
        );
      }

      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, Number(customerId)));

      if (!existingCustomer) {
        return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
      }

      const currentBalance = Number(existingCustomer.balance || 0);
      const paymentAmount = Number(amount);
      const newBalance = Math.max(0, currentBalance - paymentAmount).toFixed(2);

      const [updatedCustomer] = await db
        .update(customers)
        .set({ balance: newBalance })
        .where(eq(customers.id, Number(customerId)))
        .returning();

      // Encontrar turno abierto para registrar ingreso de efectivo de cobro
      let targetShiftId = shiftId;
      if (!targetShiftId) {
        const openShifts = await db
          .select()
          .from(cashShifts)
          .where(eq(cashShifts.status, "open"));
        if (openShifts.length > 0) {
          targetShiftId = openShifts[0].id;
        }
      }

      if (targetShiftId) {
        await db.insert(cashMovements).values({
          shiftId: Number(targetShiftId),
          type: "in",
          amount: String(paymentAmount.toFixed(2)),
          reason: `Abono de cuenta crédito: ${existingCustomer.name} (${notes || "Sin nota"})`,
        });
      }

      return NextResponse.json({ customer: updatedCustomer });
    }

    // Default: create new customer
    const { name, phone, balance, creditLimit } = body;
    if (!name) {
      return NextResponse.json({ error: "El nombre del cliente es requerido." }, { status: 400 });
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: String(name).trim(),
        phone: phone || null,
        balance: String(balance || "0.00"),
        creditLimit: String(creditLimit || "1000.00"),
      })
      .returning();

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json(
      { error: "Error handling customer request", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
