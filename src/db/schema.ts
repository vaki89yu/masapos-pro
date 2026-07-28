import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// 1. Productos (Masa, Tortillas, Abarrotes, Lácteos, Bebidas, etc.)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // 'masa_tortillas', 'abarrotes', 'lacteos', 'bebidas', 'granos'
  unit: varchar("unit", { length: 10 }).notNull().default("kg"), // 'kg', 'g', 'pz', 'l'
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  stock: numeric("stock", { precision: 10, scale: 3 }).notNull().default("0"),
  minStockAlert: numeric("min_stock_alert", { precision: 10, scale: 3 }).notNull().default("5"),
  isBulk: boolean("is_bulk").notNull().default(true), // true si requiere báscula / gramaje
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Turnos / Caja (Corte de caja)
export const cashShifts = pgTable("cash_shifts", {
  id: serial("id").primaryKey(),
  cashierName: varchar("cashier_name", { length: 100 }).notNull().default("Caja 1 - Principal"),
  initialCash: numeric("initial_cash", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  finalCash: numeric("final_cash", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open' | 'closed'
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
});

// 3. Movimientos de Efectivo de Caja (Entradas / Salidas de dinero)
export const cashMovements = pgTable("cash_movements", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").references(() => cashShifts.id),
  type: varchar("type", { length: 10 }).notNull(), // 'in' | 'out'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Ventas / Cobros (Cabecera del ticket de cobro)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 30 }).notNull().unique(),
  shiftId: integer("shift_id").references(() => cashShifts.id),
  customerName: varchar("customer_name", { length: 100 }).notNull().default("Público en General"),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("efectivo"), // 'efectivo', 'tarjeta', 'transferencia', 'credito'
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  cashReceived: numeric("cash_received", { precision: 10, scale: 2 }).notNull().default("0.00"),
  changeReturned: numeric("change_returned", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // 'completed' | 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Partidas de cada Venta (Ítems del Ticket)
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  unit: varchar("unit", { length: 10 }).notNull(), // 'kg', 'pz', etc.
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(), // Ej: 1.500 kg
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// 6. Bitácora de Producción de Masa / Molino (Control especial para tortillería/molino)
export const masaProductionLogs = pgTable("masa_production_logs", {
  id: serial("id").primaryKey(),
  productType: varchar("product_type", { length: 100 }).notNull(), // 'Masa Blanca para Tortilla', 'Masa para Tamal', etc.
  kilosProduced: numeric("kilos_produced", { precision: 10, scale: 2 }).notNull(),
  cornUsedKg: numeric("corn_used_kg", { precision: 10, scale: 2 }).notNull(),
  costTotal: numeric("cost_total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. Clientes para Crédito / Cuentas Frecuentes
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // saldo pendiente por pagar
  creditLimit: numeric("credit_limit", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  createdAt: timestamp("created_at").defaultNow(),
});
