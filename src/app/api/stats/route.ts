import { NextResponse } from "next/server";
import {
  db,
  products,
  sales,
  saleItems,
  cashShifts,
  customers,
  masaProductionLogs,
} from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { ensureSeeded, ensureOpenShift } from "@/lib/seed-data";

export async function GET() {
  try {
    await ensureSeeded();
    await ensureOpenShift(); // Siempre garantiza que haya caja abierta

    const allProducts = await db.select().from(products);
    const allSales = await db.select().from(sales).orderBy(desc(sales.createdAt));
    const allSaleItems = await db.select().from(saleItems);
    const allCustomers = await db.select().from(customers);
    const shifts = await db.select().from(cashShifts).orderBy(desc(cashShifts.openedAt));
    const openShift = shifts.find((s) => s.status === "open") || null;
    const prodLogs = await db
      .select()
      .from(masaProductionLogs)
      .orderBy(desc(masaProductionLogs.createdAt));

    // Calculate Today stats
    const today = new Date();
    const isTodayDate = (dateObj: Date | null) => {
      if (!dateObj) return false;
      const d = new Date(dateObj);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    const salesToday = allSales.filter((s) => isTodayDate(s.createdAt));
    const totalSalesToday = salesToday.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const ticketsCountToday = salesToday.length;
    const averageTicketToday =
      ticketsCountToday > 0 ? totalSalesToday / ticketsCountToday : 0;

    // Calculate Kilos of masa & tortillas sold today
    const salesTodayIds = new Set(salesToday.map((s) => s.id));
    let kilosMasaSoldToday = 0;
    allSaleItems.forEach((item) => {
      if (salesTodayIds.has(item.saleId)) {
        if (
          item.productName.toLowerCase().includes("masa") ||
          item.productName.toLowerCase().includes("tortilla")
        ) {
          if (item.unit === "kg") {
            kilosMasaSoldToday += Number(item.quantity || 0);
          }
        }
      }
    });

    // Payment methods breakdown
    const paymentBreakdown: Record<string, number> = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      credito: 0,
    };

    allSales.forEach((s) => {
      const pm = s.paymentMethod || "efectivo";
      const val = Number(s.total || 0);
      if (paymentBreakdown[pm] !== undefined) {
        paymentBreakdown[pm] += val;
      } else {
        paymentBreakdown.efectivo += val;
      }
    });

    // Top selling items
    const productStats: Record<number, { name: string; category: string; qty: number; revenue: number }> = {};
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    allSaleItems.forEach((item) => {
      const prod = productMap.get(item.productId);
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          name: item.productName,
          category: prod ? prod.category : "abarrotes",
          qty: 0,
          revenue: 0,
        };
      }
      productStats[item.productId].qty += Number(item.quantity || 0);
      productStats[item.productId].revenue += Number(item.subtotal || 0);
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Low stock alerts
    const lowStockItems = allProducts.filter(
      (p) => Number(p.stock) <= Number(p.minStockAlert)
    );

    // Total credit pending
    const totalCreditPending = allCustomers.reduce(
      (sum, c) => sum + Number(c.balance || 0),
      0
    );

    // Masa production today
    const masaProductionToday = prodLogs
      .filter((l) => isTodayDate(l.createdAt))
      .reduce((sum, l) => sum + Number(l.kilosProduced || 0), 0);

    return NextResponse.json({
      stats: {
        totalSalesToday,
        ticketsCountToday,
        averageTicketToday,
        kilosMasaSoldToday,
        masaProductionToday,
        totalCreditPending,
        paymentBreakdown,
        topProducts,
        lowStockCount: lowStockItems.length,
        openShiftId: openShift ? openShift.id : null,
      },
      lowStockItems,
      recentSales: allSales.slice(0, 7),
    });
  } catch (error: any) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Error fetching stats", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
