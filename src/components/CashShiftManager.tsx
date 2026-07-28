"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Lock,
  Unlock,
  Plus,
  Minus,
  DollarSign,
  AlertCircle,
  Clock,
  Printer,
  Check,
  X,
  TrendingUp,
} from "lucide-react";
import { playPosBeep } from "@/lib/sound";

interface CashShiftManagerProps {
  onShiftChanged: () => void;
}

export default function CashShiftManager({ onShiftChanged }: CashShiftManagerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [openShift, setOpenShift] = useState<any | null>(null);
  const [shiftSummary, setShiftSummary] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);

  // Modals state
  const [openShiftModal, setOpenShiftModal] = useState<boolean>(false);
  const [closeShiftModal, setCloseShiftModal] = useState<boolean>(false);
  const [movementModal, setMovementModal] = useState<boolean>(false);

  // Form Fields
  const [cashierName, setCashierName] = useState<string>("Caja 1 - Principal (Rosa M.)");
  const [initialCash, setInitialCash] = useState<string>("1000.00");
  const [finalCash, setFinalCash] = useState<string>("");
  const [shiftNotes, setShiftNotes] = useState<string>("Cierre de turno habitual");
  const [movType, setMovType] = useState<"in" | "out">("out");
  const [movAmount, setMovAmount] = useState<string>("150.00");
  const [movReason, setMovReason] = useState<string>("Pago a proveedor de gas del molino");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchShiftData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shifts");
      const data = await res.json();
      setOpenShift(data.openShift || null);
      setShiftSummary(data.shiftSummary || null);
      setMovements(data.movements || []);
      setRecentShifts(data.recentShifts || []);
      if (data.shiftSummary) {
        setFinalCash(String(data.shiftSummary.expectedCashInDrawer || "0"));
      }
    } catch (err) {
      console.error("Error fetching shift data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, []);

  const handleOpenNewShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open_shift",
          cashierName,
          initialCash,
          notes: "Apertura de turno en tienda",
        }),
      });

      if (res.ok) {
        playPosBeep("checkout");
        setOpenShiftModal(false);
        await fetchShiftData();
        onShiftChanged();
      } else {
        const err = await res.json();
        alert(err.error || "No se pudo abrir la caja.");
      }
    } catch (err) {
      console.error("Open shift error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openShift) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close_shift",
          shiftId: openShift.id,
          finalCash,
          notes: shiftNotes,
        }),
      });

      if (res.ok) {
        playPosBeep("checkout");
        setCloseShiftModal(false);
        await fetchShiftData();
        onShiftChanged();
      } else {
        alert("Error al cerrar el turno.");
      }
    } catch (err) {
      console.error("Close shift error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openShift || !movAmount || !movReason) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cash_movement",
          shiftId: openShift.id,
          type: movType,
          amount: movAmount,
          reason: movReason,
        }),
      });

      if (res.ok) {
        playPosBeep("scan");
        setMovementModal(false);
        await fetchShiftData();
        setMovAmount("100.00");
        setMovReason("");
      } else {
        alert("Error al registrar movimiento.");
      }
    } catch (err) {
      console.error("Add movement error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const expectedCash = shiftSummary ? Number(shiftSummary.expectedCashInDrawer || 0) : 0;
  const countedCash = Number(finalCash) || 0;
  const difference = countedCash - expectedCash;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER TURNO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3.5 rounded-2xl border ${
              openShift
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border-rose-500/40"
            }`}
          >
            {openShift ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                {openShift ? "Turno de Caja en Curso (Activo)" : "Turno de Caja Cerrado"}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  openShift
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {openShift ? "Abierto" : "Cerrado"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {openShift
                ? `Responsable: ${openShift.cashierName} • Apertura: ${new Date(
                    openShift.openedAt
                  ).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                : "Abre un turno para habilitar la caja y llevar el corte y arqueo de efectivo."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {openShift ? (
            <>
              <button
                onClick={() => {
                  setMovType("out");
                  setMovementModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Minus className="w-4 h-4 text-rose-400" />
                <span>Retiro / Entrada</span>
              </button>

              <button
                onClick={handlePrintSummary}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Corte X</span>
              </button>

              <button
                onClick={() => setCloseShiftModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Corte Z (Cerrar Turno)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpenShiftModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Nuevo Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* DETALLE Y ARQUEO EN VIVO DEL TURNO ABIERTO */}
      {openShift && shiftSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fondo Inicial */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Fondo Inicial en Caja
            </span>
            <div className="text-2xl font-extrabold font-mono text-white">
              ${Number(shiftSummary.initialCash || 0).toFixed(2)}
            </div>
            <span className="text-xs text-slate-500 block mt-1">Efectivo para cambio</span>
          </div>

          {/* Movimientos Efectivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Entradas / Salidas Extra
            </span>
            <div className="text-2xl font-extrabold font-mono text-white flex items-center gap-2">
              <span className="text-emerald-400 text-base">
                +${Number(shiftSummary.cashInMovements || 0).toFixed(2)}
              </span>
              <span className="text-rose-400 text-base">
                -${Number(shiftSummary.cashOutMovements || 0).toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Abonos de crédito vs retiros
            </span>
          </div>

          {/* Cobrado en Efectivo POS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Cobrado en Efectivo (Ventas)
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              +${Number(shiftSummary.cashSalesTotal || 0).toFixed(2)}
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Ingreso por tickets en efectivo
            </span>
          </div>

          {/* TOTAL ESPERADO EN CAJA */}
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              💵 TOTAL ESPERADO EN CAJA
            </span>
            <div className="text-3xl font-extrabold font-mono text-emerald-300">
              ${expectedCash.toFixed(2)}
            </div>
            <span className="text-xs text-emerald-400/80 block mt-1">
              Arqueo proyectado en billetes/monedas
            </span>
          </div>
        </div>
      )}

      {/* SECCIÓN INTERMEDIA: MOVIMIENTOS Y TURNOS RECIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entradas y Salidas en Efectivo del Turno (6 Columnas) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Movimientos de Efectivo (Ingresos / Gastos)
            </h3>
            {openShift && (
              <button
                onClick={() => {
                  setMovType("in");
                  setMovementModal(true);
                }}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                + Registrar Ingreso Extra
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {movements && movements.length > 0 ? (
              movements.map((m) => {
                const isOut = m.type === "out";
                return (
                  <div
                    key={m.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{m.reason}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Hoy"}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm ${
                        isOut ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isOut ? "-" : "+"}${Number(m.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay retiros o ingresos adicionales en este turno.
              </div>
            )}
          </div>
        </div>

        {/* Historial de Turnos de Caja (6 Columnas) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Historial de Turnos y Cortes
            </h3>
            <span className="text-xs text-slate-400">Últimos turnos</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentShifts && recentShifts.length > 0 ? (
              recentShifts.map((s) => {
                const isOpenShift = s.status === "open";
                return (
                  <div
                    key={s.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{s.cashierName}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded uppercase font-extrabold ${
                            isOpenShift
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {isOpenShift ? "ACTIVO" : "CERRADO"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Fondo Inicial: ${Number(s.initialCash || 0).toFixed(2)}{" "}
                        {s.finalCash ? `• Corte: $${Number(s.finalCash).toFixed(2)}` : ""}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <div>
                        {s.openedAt
                          ? new Date(s.openedAt).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "Reciente"}
                      </div>
                      <div>
                        {s.openedAt
                          ? new Date(s.openedAt).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Aún no hay historial de turnos pasados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ABRIR TURNO */}
      {openShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Abrir Nuevo Turno de Caja</h3>
              <button
                onClick={() => setOpenShiftModal(false)}
                className="p-1 hover:bg-black/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenNewShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Cajero / Nombre del Responsable:
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Fondo Inicial en Efectivo ($ MXN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Monedas y billetes con los que se inicia la jornada para dar cambio.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpenShiftModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs shadow-lg"
                >
                  Habilitar Caja & Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CERRAR TURNO (CORTE Z) */}
      {closeShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Corte Z • Cierre de Turno y Arqueo</h3>
              <button
                onClick={() => setCloseShiftModal(false)}
                className="p-1 hover:bg-black/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="p-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Fondo Inicial:</span>
                  <span className="font-mono text-white">
                    ${Number(shiftSummary?.initialCash || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ingresos Extras en Efectivo:</span>
                  <span className="font-mono text-emerald-400">
                    +${Number(shiftSummary?.cashInMovements || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Salidas / Pagos en Efectivo:</span>
                  <span className="font-mono text-rose-400">
                    -${Number(shiftSummary?.cashOutMovements || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ventas en Efectivo en POS:</span>
                  <span className="font-mono text-emerald-400">
                    +${Number(shiftSummary?.cashSalesTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>ESPERADO EN CAJA:</span>
                  <span className="text-amber-400 font-mono">
                    ${expectedCash.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Efectivo contado y físico en caja ($ MXN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={finalCash}
                    onChange={(e) => setFinalCash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xl font-mono font-extrabold text-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Diferencia en corte */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  Math.abs(difference) < 1
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : difference > 0
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <span>Diferencia calculada:</span>
                <strong className="font-mono text-sm">
                  {difference >= 0 ? "+" : ""}
                  ${difference.toFixed(2)}
                </strong>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Observaciones / Notas del Cajero:
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCloseShiftModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg"
                >
                  Realizar Corte Z y Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ENTRADA / RETIRO DE DINERO */}
      {movementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {movType === "out" ? "Registrar Salida de Efectivo" : "Registrar Ingreso de Efectivo"}
              </h3>
              <button
                onClick={() => setMovementModal(false)}
                className="p-1 hover:bg-black/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="p-6 space-y-4">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovType("out")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    movType === "out"
                      ? "bg-rose-500 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  - Retiro de Caja
                </button>
                <button
                  type="button"
                  onClick={() => setMovType("in")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    movType === "in"
                      ? "bg-emerald-500 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  + Ingreso Extra
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Monto ($ MXN):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={movAmount}
                  onChange={(e) => setMovAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-lg font-mono font-bold text-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Motivo o Justificación del Movimiento:
                </label>
                <input
                  type="text"
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ej: Pago de garrafones, proveedor de manteca..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
