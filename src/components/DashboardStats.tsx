"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Flame,
  UserCheck,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Clock,
  PieChart,
  BarChart2,
  Store,
  Bike,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";

interface DashboardStatsProps {
  stats: {
    totalSalesToday: number;
    ticketsCountToday: number;
    averageTicketToday: number;
    kilosMasaSoldToday: number;
    masaProductionToday: number;
    totalCreditPending: number;
    paymentBreakdown: Record<string, number>;
    topProducts: Array<{
      name: string;
      category: string;
      qty: number;
      revenue: number;
    }>;
    lowStockCount: number;
  } | null;
  lowStockItems: Array<{
    id: number;
    name: string;
    stock: string | number;
    minStockAlert: string | number;
    unit: string;
  }>;
  recentSales: Array<any>;
  onNavigateTab: (tab: string) => void;
}

export default function DashboardStats({
  stats,
  lowStockItems,
  recentSales,
  onNavigateTab,
}: DashboardStatsProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  if (!stats) {
    return (
      <div className="py-20 text-center text-slate-400">
        Cargando estadísticas en tiempo real...
      </div>
    );
  }

  const totalPaymentSum = Object.values(stats.paymentBreakdown || {}).reduce(
    (a, b) => a + Number(b),
    0
  );

  const getPaymentPercent = (key: string) => {
    const val = Number(stats.paymentBreakdown?.[key] || 0);
    if (totalPaymentSum === 0) return 0;
    return Math.round((val / totalPaymentSum) * 100);
  };

  // Calcular kilos por canal desde topProducts
  let kilosTienda = 0;
  let revenueTienda = 0;
  let kilosMoto = 0;
  let revenueMoto = 0;

  stats.topProducts.forEach((p) => {
    if (p.name.toLowerCase().includes("tienda") || p.category === "tienda") {
      kilosTienda += Number(p.qty || 0);
      revenueTienda += Number(p.revenue || 0);
    } else {
      kilosMoto += Number(p.qty || 0);
      revenueMoto += Number(p.revenue || 0);
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 4 CARDS PRINCIPALES DE KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Recaudación del Día
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            ${stats.totalSalesToday.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span>
              <strong className="text-emerald-400">{stats.ticketsCountToday}</strong> tickets hoy
            </span>
            <span>
              Promedio: <strong className="text-white">${stats.averageTicketToday.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Kilos de Masa vendida hoy */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-slate-700 transition-all group">
          <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <img src="/images/masa-fresca.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between mb-3 relative">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Total Masa Vendida
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight relative">
            {stats.kilosMasaSoldToday.toFixed(1)}{" "}
            <span className="text-lg font-normal text-amber-500">kg</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 relative">
            <span>
              Molienda: <strong className="text-white">{stats.masaProductionToday.toFixed(0)} kg</strong>
            </span>
            <button
              onClick={() => onNavigateTab("production")}
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              Ver nixtamal
            </button>
          </div>
        </div>

        {/* Masa Comprada en Tienda ($10) */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-slate-700 transition-all group">
          <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
            <img src="/images/masa-tienda.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between mb-3 relative">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> En Tienda ($10/kg)
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight relative">
            {kilosTienda.toFixed(1)}{" "}
            <span className="text-lg font-normal text-emerald-500">kg</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 relative">
            <span>Ingreso en mostrador:</span>
            <strong className="text-white font-mono">${revenueTienda.toFixed(2)}</strong>
          </div>
        </div>

        {/* Masa Repartida en Moto ($11) */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-slate-700 transition-all group">
          <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
            <img src="/images/masa-moto.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between mb-3 relative">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Bike className="w-3.5 h-3.5" /> En Moto ($11/kg)
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight relative">
            {kilosMoto.toFixed(1)}{" "}
            <span className="text-lg font-normal text-amber-500">kg</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 relative">
            <span>Ingreso por reparto:</span>
            <strong className="text-white font-mono">${revenueMoto.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* SECCIÓN INTERMEDIA: MÉTODOS DE PAGO Y DESGLOSE POR CANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desglose por Método de Cobro (5 Columnas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" />
                Cobros en Efectivo vs Crédito
              </h3>
              <span className="text-xs font-mono text-slate-400">Total: ${totalPaymentSum.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "efectivo",
                  label: "💵 Efectivo en Caja",
                  color: "bg-emerald-500",
                  textColor: "text-emerald-400",
                },
                {
                  id: "credito",
                  label: "🤝 Crédito / Fiado a Taquerías",
                  color: "bg-amber-500",
                  textColor: "text-amber-400",
                },
                {
                  id: "transferencia",
                  label: "📱 Transferencia / QR SPEI",
                  color: "bg-purple-500",
                  textColor: "text-purple-400",
                },
                {
                  id: "tarjeta",
                  label: "💳 Tarjeta Débito/Crédito",
                  color: "bg-blue-500",
                  textColor: "text-blue-400",
                },
              ].map((m) => {
                const amt = Number(stats.paymentBreakdown?.[m.id] || 0);
                const pct = getPaymentPercent(m.id);

                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">{m.label}</span>
                      <span className="font-mono text-white">
                        ${amt.toFixed(2)} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} transition-all duration-500`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Cierre sugerido con Corte Z en caja</span>
            <button
              onClick={() => onNavigateTab("shift")}
              className="text-amber-400 hover:underline font-bold"
            >
              Ver Corte de Caja &rarr;
            </button>
          </div>
        </div>

        {/* COMPARATIVA DE VENTAS: TIENDA ($10/KG) vs REPARTO EN MOTO ($11/KG) (7 COLUMNAS) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              Comparativa por Canal • Tienda vs Moto
            </h3>
            <span className="text-xs text-slate-400">Tarifas oficiales: $10 Tienda / $11 Moto</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <th className="pb-3 font-semibold">Canal de Venta</th>
                  <th className="pb-3 font-semibold text-right">Tarifa</th>
                  <th className="pb-3 font-semibold text-right">Kilos Vendidos</th>
                  <th className="pb-3 font-semibold text-right">Total Recaudado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 font-bold text-white flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Store className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm">Comprada en Tienda</div>
                      <div className="text-xs text-slate-400 font-normal">Mostrador principal</div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono text-emerald-400 font-bold">
                    $10.00 / kg
                  </td>
                  <td className="py-4 text-right font-mono text-white font-extrabold">
                    {kilosTienda.toFixed(1)} kg
                  </td>
                  <td className="py-4 text-right font-mono font-black text-emerald-400 text-base">
                    ${revenueTienda.toFixed(2)}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 font-bold text-white flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Bike className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm">Repartida en Moto</div>
                      <div className="text-xs text-slate-400 font-normal">Domicilio / Taquerías</div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono text-amber-400 font-bold">
                    $11.00 / kg
                  </td>
                  <td className="py-4 text-right font-mono text-white font-extrabold">
                    {kilosMoto.toFixed(1)} kg
                  </td>
                  <td className="py-4 text-right font-mono font-black text-amber-400 text-base">
                    ${revenueMoto.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HISTORIAL RECIENTE DE TICKETS DE COBRO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Últimos Tickets Emitidos en Caja
          </h3>
          <span className="text-xs text-slate-400">Mostrando historial reciente</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="pb-3 font-semibold">Folio / Ticket</th>
                <th className="pb-3 font-semibold">Fecha y Hora</th>
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 font-semibold">Método de Pago</th>
                <th className="pb-3 font-semibold text-right">Importe Total</th>
                <th className="pb-3 font-semibold text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentSales && recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-amber-300">
                      {sale.ticketNumber}
                    </td>
                    <td className="py-3 text-slate-300 text-xs">
                      {sale.createdAt
                        ? new Date(sale.createdAt).toLocaleString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Hoy"}
                    </td>
                    <td className="py-3 text-white font-medium">{sale.customerName}</td>
                    <td className="py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg uppercase font-bold">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-black text-white">
                      ${Number(sale.total).toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => setSelectedReceipt(sale)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                        title="Ver ticket digital"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No hay ventas registradas todavía. Ve al mostrador para realizar un cobro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECIBO MODAL */}
      <ReceiptModal
        sale={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
