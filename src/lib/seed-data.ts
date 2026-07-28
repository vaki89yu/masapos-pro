import {
  db,
  products,
  cashShifts,
  cashMovements,
  sales,
  saleItems,
  masaProductionLogs,
  customers,
} from "@/db";
import { count } from "drizzle-orm";

export async function ensureSeeded() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ DATABASE_URL no configurada. No se puede sembrar la base de datos.");
      return { seeded: false, message: "DATABASE_URL not configured" };
    }
    const existingProducts = await db.select({ count: count() }).from(products);
    if (existingProducts[0] && Number(existingProducts[0].count) > 0) {
      return { seeded: false, message: "Database already seeded" };
    }

    console.log("Seeding simplified Masa catalog ($10 Tienda / $11 Moto)...");

    // 1. Catálogo de Masa: Solo 1 tipo de Masa con 2 modalidades de venta (Tienda $10 vs Moto $11)
    const insertedProducts = await db
      .insert(products)
      .values([
        {
          barcode: "MASA-TIENDA-001",
          name: "Masa de Maíz • Venta en Tienda ($10/kg)",
          description: "Masa fresca nixtamalizada del molino comprada directamente en mostrador",
          category: "tienda",
          unit: "kg",
          price: "10.00",
          costPrice: "6.50",
          stock: "450.000",
          minStockAlert: "50.000",
          isBulk: true,
        },
        {
          barcode: "MASA-MOTO-002",
          name: "Masa de Maíz • Reparto en Moto ($11/kg)",
          description: "Masa fresca nixtamalizada del molino enviada a domicilio o taquería en moto",
          category: "reparto_moto",
          unit: "kg",
          price: "11.00",
          costPrice: "7.00",
          stock: "350.000",
          minStockAlert: "50.000",
          isBulk: true,
        },
      ])
      .returning();

    // 2. Clientes y Taquerías Frecuentes
    const insertedCustomers = await db
      .insert(customers)
      .values([
        {
          name: "Taquería El Pastorcito (Ruta Moto)",
          phone: "55-4321-8765",
          balance: "220.00",
          creditLimit: "3000.00",
        },
        {
          name: "Tamalería Centro (Ruta Moto)",
          phone: "55-8899-7766",
          balance: "110.00",
          creditLimit: "2500.00",
        },
        {
          name: "Tortillería Artesanal (En Tienda)",
          phone: "55-2233-4455",
          balance: "0.00",
          creditLimit: "2000.00",
        },
        {
          name: "Público en General",
          phone: "N/A",
          balance: "0.00",
          creditLimit: "0.00",
        },
      ])
      .returning();

    // 3. Turno de Caja Abierto
    const [openShift] = await db
      .insert(cashShifts)
      .values([
        {
          cashierName: "Caja 1 - Molino y Reparto Moto (Pedro G.)",
          initialCash: "1000.00",
          status: "open",
          notes: "Turno del día - Masa a $10 en Tienda y $11 en Moto",
        },
      ])
      .returning();

    if (openShift) {
      await db.insert(cashMovements).values([
        {
          shiftId: openShift.id,
          type: "in",
          amount: "1000.00",
          reason: "Fondo inicial de caja para cambio",
        },
        {
          shiftId: openShift.id,
          type: "out",
          amount: "100.00",
          reason: "Gasolina para motocicleta de reparto",
        },
      ]);
    }

    // 4. Bitácora de Molino
    await db.insert(masaProductionLogs).values([
      {
        productType: "Masa de Maíz Nixtamalizado (Molino)",
        kilosProduced: "450.00",
        cornUsedKg: "300.00",
        costTotal: "1950.00",
        notes: "Molienda matutina 5:30 AM. Calidad excelente para tienda y moto.",
      },
      {
        productType: "Masa de Maíz Nixtamalizado (Molino)",
        kilosProduced: "350.00",
        cornUsedKg: "235.00",
        costTotal: "1520.00",
        notes: "Molienda mediodía para rutas de repartidores.",
      },
    ]);

    // 5. Ventas de Muestra: Tienda ($10) vs Reparto Moto ($11)
    if (openShift && insertedProducts.length >= 2) {
      const pTienda = insertedProducts[0]; // $10/kg
      const pMoto = insertedProducts[1]; // $11/kg

      // Ticket 1: 5 KG comprados en Tienda -> $50.00
      const [s1] = await db
        .insert(sales)
        .values({
          ticketNumber: "TICK-2026-0010",
          shiftId: openShift.id,
          customerName: "Público en General",
          paymentMethod: "efectivo",
          subtotal: "50.00",
          tax: "0.00",
          discount: "0.00",
          total: "50.00",
          cashReceived: "100.00",
          changeReturned: "50.00",
          status: "completed",
          notes: "Venta en Tienda - 5 kg a $10.00",
        })
        .returning();

      await db.insert(saleItems).values([
        {
          saleId: s1.id,
          productId: pTienda.id,
          productName: pTienda.name,
          unit: "kg",
          quantity: "5.000",
          unitPrice: "10.00",
          subtotal: "50.00",
        },
      ]);

      // Ticket 2: 20 KG Reparto en Moto para Taquería -> $220.00
      const [s2] = await db
        .insert(sales)
        .values({
          ticketNumber: "TICK-2026-0011",
          shiftId: openShift.id,
          customerName: "Taquería El Pastorcito (Ruta Moto)",
          paymentMethod: "efectivo",
          subtotal: "220.00",
          tax: "0.00",
          discount: "0.00",
          total: "220.00",
          cashReceived: "250.00",
          changeReturned: "30.00",
          status: "completed",
          notes: "Reparto Moto - 20 kg a $11.00",
        })
        .returning();

      await db.insert(saleItems).values([
        {
          saleId: s2.id,
          productId: pMoto.id,
          productName: pMoto.name,
          unit: "kg",
          quantity: "20.000",
          unitPrice: "11.00",
          subtotal: "220.00",
        },
      ]);

      // Ticket 3: 10 KG Reparto en Moto -> $110.00 (Crédito)
      const [s3] = await db
        .insert(sales)
        .values({
          ticketNumber: "TICK-2026-0012",
          shiftId: openShift.id,
          customerName: "Tamalería Centro (Ruta Moto)",
          paymentMethod: "credito",
          subtotal: "110.00",
          tax: "0.00",
          discount: "0.00",
          total: "110.00",
          cashReceived: "0.00",
          changeReturned: "0.00",
          status: "completed",
          notes: "Reparto Moto - 10 kg a $11.00 (Fiado en cuenta)",
        })
        .returning();

      await db.insert(saleItems).values([
        {
          saleId: s3.id,
          productId: pMoto.id,
          productName: pMoto.name,
          unit: "kg",
          quantity: "10.000",
          unitPrice: "11.00",
          subtotal: "110.00",
        },
      ]);
    }

    console.log("MasaPOS Pro database seeded successfully with Tienda ($10) & Reparto Moto ($11) catalog!");
    return { seeded: true, message: "Database seeded successfully" };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
