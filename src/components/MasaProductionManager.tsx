"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Plus,
  TrendingUp,
  Scale,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { playPosBeep } from "@/lib/sound";

interface Product {
  id: number;
  name: string;
  category: string;
  stock: string | number;
  unit: string;
}

interface ProductionLog {
  id: number;
  productType: string;
  kilosProduced: string | number;
  cornUsedKg: string | number;
  costTotal: string | number;
  notes?: string;
  createdAt: string;
}

interface MasaProductionManagerProps {
  products: Product[];
  onProductionAdded: () => void;
}

export default function MasaProductionManager({
  products,
  onProductionAdded,
}: MasaProductionManagerProps) {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [productType, setProductType] = useState<string>("Masa de Maíz Blanco (Para Tortillas)");
  const [kilosProduced, setKilosProduced] = useState<string>("120");
  const [cornUsedKg, setCornUsedKg] = useState<string>("80");
  const [costTotal, setCostTotal] = useState<string>("1050");
  const [notes, setNotes] = useState<string>("Molienda de turno matutino");
  const [updateStock, setUpdateStock] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Find masa products for stock sync
  const masaProducts = products.filter((p) => p.category === "masa_tortillas");

  useEffect(() => {
    // Select default product id
    const found = masaProducts.find((p) => p.name.includes("Masa de Maíz Blanco"));
    if (found) setSelectedProductId(found.id);
    else if (masaProducts[0]) setSelectedProductId(masaProducts[0].id);
  }, [products]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/production");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching production logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kilosProduced || !cornUsedKg) return;

    try {
      setSubmitting(true);
      playPosBeep("scan");
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          kilosProduced,
          cornUsedKg,
          costTotal,
          notes,
          updateStock,
          productId: selectedProductId,
        }),
      });

      if (res.ok) {
        playPosBeep("checkout");
        await fetchLogs();
        onProductionAdded();
        // Reset form to slight default
        setKilosProduced("100");
        setCornUsedKg("68");
        setNotes("");
      } else {
        alert("No se pudo registrar la producción.");
      }
    } catch (err) {
      console.error("Error saving production log:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const numericKilos = Number(kilosProduced) || 0;
  const numericCorn = Number(cornUsedKg) || 0;
  const yieldRatio = numericCorn > 0 ? numericKilos / numericCorn : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Bitácora del Molino & Nixtamal
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Registra la molienda diaria de maíz para masa blanca, amarilla y tamales. El inventario se actualiza en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-700/80 text-xs">
          <Scale className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-400 block font-medium">Rendimiento Promedio:</span>
            <strong className="text-amber-400 font-bold text-sm">
              1.45 kg - 1.55 kg de Masa / Kg Maíz
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORMULARIO DE REGISTRO DE PRODUCCIÓN (5 COLUMNAS) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Registrar Nueva Molienda
            </h3>
            <span className="text-xs bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              Turno Día
            </span>
          </div>

          <form onSubmit={handleCreateProduction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tipo de Masa o Producto del Molino:
              </label>
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  const found = masaProducts.find((p) =>
                    p.name.toLowerCase().includes(e.target.value.toLowerCase().split(" ")[0])
                  );
                  if (found) setSelectedProductId(found.id);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="Masa de Maíz Blanco (Para Tortillas)">
                  🌽 Masa de Maíz Blanco (Para Tortillas)
                </option>
                <option value="Masa para Tamal (Quebrada)">
                  🫔 Masa para Tamal (Quebrada)
                </option>
                <option value="Masa de Maíz Amarillo">
                  🌽 Masa de Maíz Amarillo (Antojitos)
                </option>
                <option value="Tortilla Caliente de Maíz">
                  🌮 Tortilla Caliente de Máquina
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Kilos Producidos (Kg):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={kilosProduced}
                  onChange={(e) => setKilosProduced(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Maíz / Nixtamal Usado (Kg):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={cornUsedKg}
                  onChange={(e) => setCornUsedKg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Rendimiento calculado en tiempo real */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Rendimiento en esta tanda:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  yieldRatio >= 1.4 && yieldRatio <= 1.7
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {yieldRatio.toFixed(2)} Kg masa / Kg maíz
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Costo Total Insumos ($ MXN - Maíz + Gas + Cal):
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={costTotal}
                onChange={(e) => setCostTotal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Checkbox actualizar inventario */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={updateStock}
                  onChange={(e) => setUpdateStock(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold text-white block">
                    Sumar los kilos producidos al inventario
                  </span>
                  <span className="text-slate-400 block text-[11px]">
                    Esto incrementará automáticamente las existencias de este producto en la tienda.
                  </span>
                </div>
              </label>

              {updateStock && (
                <div className="pt-2 border-t border-slate-700/60 text-xs">
                  <span className="text-slate-400 block mb-1">
                    Asignar al producto del catálogo:
                  </span>
                  <select
                    value={selectedProductId || ""}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {masaProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock actual: {Number(p.stock).toFixed(2)} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Notas del Molinero / Calidad de Masa:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Nixtamal suave con buena elasticidad..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Registrar Molienda & Actualizar Stock</span>
            </button>
          </form>
        </div>

        {/* HISTORIAL Y BITÁCORA DEL MOLINO (7 COLUMNAS) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Historial del Molino & Rendimiento
            </h3>
            <span className="text-xs text-slate-400">
              {logs.length} moliendas registradas
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Cargando bitácora del molino...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <th className="pb-3 font-semibold">Producto / Masa</th>
                    <th className="pb-3 font-semibold text-right">Maíz Usado</th>
                    <th className="pb-3 font-semibold text-right">Producido</th>
                    <th className="pb-3 font-semibold text-right">Rendimiento</th>
                    <th className="pb-3 font-semibold">Fecha / Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => {
                      const produced = Number(log.kilosProduced || 0);
                      const corn = Number(log.cornUsedKg || 0);
                      const ratio = corn > 0 ? produced / corn : 0;

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3">
                            <div className="font-bold text-white text-xs">
                              {log.productType}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Costo insumos: ${Number(log.costTotal).toFixed(2)}
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300 text-xs">
                            {corn.toFixed(1)} kg
                          </td>
                          <td className="py-3 text-right font-mono font-extrabold text-amber-400 text-xs">
                            {produced.toFixed(1)} kg
                          </td>
                          <td className="py-3 text-right font-mono text-xs font-semibold text-emerald-400">
                            {ratio.toFixed(2)}x
                          </td>
                          <td className="py-3 text-xs text-slate-400">
                            <div>
                              {log.createdAt
                                ? new Date(log.createdAt).toLocaleString("es-MX", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Hoy"}
                            </div>
                            {log.notes && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-[140px]">
                                {log.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        Aún no hay registros en la bitácora del molino.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
