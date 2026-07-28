import { NextResponse } from "next/server";
import { db, cashShifts, cashMovements, sales } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed-data";

export async function GET() {
  try {
    await ensureSeeded();

    const shifts = await db.select().from(cashShifts).orderBy(desc(cashShifts.openedAt));
    const openShift = shifts.find((s) => s.status === "open") || null;

    let movements: any[] = [];
    let shiftSales: any[] = [];
    let shiftSummary = {
      initialCash: 0,
      cashInMovements: 0,
      cashOutMovements: 0,
      cashSalesTotal: 0,
      cardSalesTotal: 0,
      transferSalesTotal: 0,
      creditSalesTotal: 0,
      totalSalesAmount: 0,
      expectedCashInDrawer: 0,
    };

    if (openShift) {
      movements = await db
        .select()
        .from(cashMovements)
        .where(eq(cashMovements.shiftId, openShift.id))
        .orderBy(desc(cashMovements.createdAt));

      shiftSales = await db
        .select()
        .from(sales)
        .where(eq(sales.shiftId, openShift.id))
        .orderBy(desc(sales.createdAt));

      shiftSummary.initialCash = Number(openShift.initialCash || 0);

      movements.forEach((m) => {
        const amt = Number(m.amount || 0);
        if (m.type === "in") shiftSummary.cashInMovements += amt;
        if (m.type === "out") shiftSummary.cashOutMovements += amt;
      });

      shiftSales.forEach((sale) => {
        if (sale.status === "completed") {
          const total = Number(sale.total || 0);
          shiftSummary.totalSalesAmount += total;

          if (sale.paymentMethod === "efectivo") {
            shiftSummary.cashSalesTotal += total;
          } else if (sale.paymentMethod === "tarjeta") {
            shiftSummary.cardSalesTotal += total;
          } else if (sale.paymentMethod === "transferencia") {
            shiftSummary.transferSalesTotal += total;
          } else if (sale.paymentMethod === "credito") {
            shiftSummary.creditSalesTotal += total;
          }
        }
      });

      shiftSummary.expectedCashInDrawer =
        shiftSummary.initialCash +
        shiftSummary.cashInMovements -
        shiftSummary.cashOutMovements +
        shiftSummary.cashSalesTotal;
    }

    return NextResponse.json({
      openShift,
      recentShifts: shifts.slice(0, 10),
      movements,
      shiftSummary,
    });
  } catch (error: any) {
    console.error("GET /api/shifts error:", error);
    return NextResponse.json(
      { error: "Error fetching shifts", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "open_shift") {
      const { cashierName, initialCash, notes } = body;
      // Cerrar si hay uno abierto por precaución
      const openShifts = await db.select().from(cashShifts).where(eq(cashShifts.status, "open"));
      if (openShifts.length > 0) {
        return NextResponse.json(
          { error: "Ya existe un turno de caja abierto. Por favor realiza el corte y cierre primero." },
          { status: 400 }
        );
      }

      const [newShift] = await db
        .insert(cashShifts)
        .values({
          cashierName: cashierName || "Caja 1 - Principal",
          initialCash: String(initialCash || "1000.00"),
          status: "open",
          notes: notes || "Apertura de caja del día",
        })
        .returning();

      await db.insert(cashMovements).values({
        shiftId: newShift.id,
        type: "in",
        amount: String(initialCash || "1000.00"),
        reason: "Fondo inicial de apertura de caja",
      });

      return NextResponse.json({ shift: newShift }, { status: 201 });
    }

    if (action === "close_shift") {
      const { shiftId, finalCash, notes } = body;
      if (!shiftId) {
        return NextResponse.json({ error: "Falta shiftId para cerrar turno." }, { status: 400 });
      }

      const [closedShift] = await db
        .update(cashShifts)
        .set({
          status: "closed",
          finalCash: String(finalCash || "0.00"),
          closedAt: new Date(),
          notes: notes || "Corte de caja finalizado",
        })
        .where(eq(cashShifts.id, Number(shiftId)))
        .returning();

      return NextResponse.json({ shift: closedShift });
    }

    if (action === "cash_movement") {
      const { shiftId, type, amount, reason } = body;
      if (!shiftId || !type || !amount || !reason) {
        return NextResponse.json(
          { error: "Datos incompletos para el movimiento de caja." },
          { status: 400 }
        );
      }

      const [newMovement] = await db
        .insert(cashMovements)
        .values({
          shiftId: Number(shiftId),
          type: type === "out" ? "out" : "in",
          amount: String(amount),
          reason: String(reason),
        })
        .returning();

      return NextResponse.json({ movement: newMovement }, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/shifts error:", error);
    return NextResponse.json(
      { error: "Error in shift operation", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
