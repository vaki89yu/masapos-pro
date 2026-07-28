"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  CreditCard,
  QrCode,
  UserCheck,
  X,
  Check,
  Banknote,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Coins,
  Receipt,
} from "lucide-react";
import { playPosBeep } from "@/lib/sound";

interface Customer {
  id: number;
  name: string;
  balance: string | number;
  creditLimit: string | number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  total: number;
  customersList: Customer[];
  selectedCustomerName: string;
  onSelectCustomer: (name: string) => void;
  onConfirmCheckout: (
    paymentMethod: string,
    cashReceived: number,
    changeReturned: number,
    notes: string
  ) => void;
}

const DENOMINATIONS = [
  { value: 1000, label: "$1,000", type: "billete", short: "1,000", img: "/images/billete-1000.jpg" },
  { value: 500, label: "$500", type: "billete", short: "500", img: "/images/billete-500-pexels.jpg" },
  { value: 200, label: "$200", type: "billete", short: "200", img: "/images/billete-200.jpg" },
  { value: 100, label: "$100", type: "billete", short: "100", img: "/images/billete-100.jpg" },
  { value: 50, label: "$50", type: "billete", short: "50", img: "/images/billetes-mexicanos.jpg" },
  { value: 20, label: "$20", type: "billete", short: "20", img: "/images/billetes-mexicanos.jpg" },
  { value: 10, label: "$10", type: "moneda", short: "10", img: "/images/monedas-mexicanas.jpg" },
  { value: 5, label: "$5", type: "moneda", short: "5", img: "/images/monedas-mexicanas.jpg" },
  { value: 2, label: "$2", type: "moneda", short: "2", img: "/images/monedas-mexicanas.jpg" },
  { value: 1, label: "$1", type: "moneda", short: "1", img: "/images/monedas-mexicanas.jpg" },
];

export default function CheckoutModal({
  isOpen,
  onClose,
  subtotal,
  discount,
  total,
  customersList,
  selectedCustomerName,
  onSelectCustomer,
  onConfirmCheckout,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [notes, setNotes] = useState<string>("");
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen) {
      const initial: Record<number, number> = {};
      DENOMINATIONS.forEach((d) => { initial[d.value] = 0; });
      setDenomCounts(initial);
      setPaymentMethod("efectivo");
      setNotes("");
    }
  }, [isOpen]);

  // 🔴 CORREGIDO: Todos los hooks ANTES del early return
  const cashReceived = useMemo(() => {
    return DENOMINATIONS.reduce((sum, d) => sum + d.value * (denomCounts[d.value] || 0), 0);
  }, [denomCounts]);

  const change = Math.max(0, cashReceived - total);
  const insufficientCash = paymentMethod === "efectivo" && cashReceived < total;
  const falta = total - cashReceived;

  const totalPiezas = useMemo(() => Object.values(denomCounts).reduce((a, b) => a + b, 0), [denomCounts]);

  const totalMonedas = DENOMINATIONS.filter((d) => d.type === "moneda").reduce(
    (sum, d) => sum + d.value * (denomCounts[d.value] || 0), 0
  );
  const totalBilletes = DENOMINATIONS.filter((d) => d.type === "billete").reduce(
    (sum, d) => sum + d.value * (denomCounts[d.value] || 0), 0
  );

  // 🔴 CORREGIDO: Early return pero hooks ya declarados arriba
  if (!isOpen) return null;

  const handleDenomChange = (value: number, delta: number) => {
    playPosBeep("scan");
    setDenomCounts((prev) => {
      const current = prev[value] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [value]: next };
    });
  };

  const handleQuickFill = () => {
    playPosBeep("scan");
    const newCounts: Record<number, number> = {};
    DENOMINATIONS.forEach((d) => { newCounts[d.value] = 0; });
    let remaining = Math.ceil(total);
    for (const den of DENOMINATIONS) {
      if (remaining <= 0) break;
      if (den.value <= remaining) {
        const count = Math.floor(remaining / den.value);
        newCounts[den.value] = count;
        remaining -= count * den.value;
      }
    }
    if (remaining > 0) {
      const smallest = DENOMINATIONS[DENOMINATIONS.length - 1];
      newCounts[smallest.value] = (newCounts[smallest.value] || 0) + 1;
    }
    setDenomCounts(newCounts);
  };

  const handleExactCash = () => {
    playPosBeep("scan");
    const newCounts: Record<number, number> = {};
    DENOMINATIONS.forEach((d) => { newCounts[d.value] = 0; });
    let remaining = Math.round(total);
    for (const den of DENOMINATIONS) {
      if (remaining <= 0) break;
      if (den.value <= remaining) {
        const count = Math.floor(remaining / den.value);
        newCounts[den.value] = count;
        remaining -= count * den.value;
      }
    }
    setDenomCounts(newCounts);
  };

  const handleQuickBill = (billValue: number) => {
    playPosBeep("scan");
    setDenomCounts((prev) => ({ ...prev, [billValue]: (prev[billValue] || 0) + 1 }));
  };

  const getChangeBreakdown = (amount: number) => {
    if (amount <= 0) return [];
    let rem = Math.round(amount);
    const items: Array<{ count: number; label: string; value: number }> = [];
    for (const den of DENOMINATIONS) {
      if (rem <= 0) break;
      const count = Math.floor(rem / den.value);
      if (count > 0) {
        items.push({ count, label: den.label, value: den.value });
        rem -= count * den.value;
      }
    }
    return items;
  };

  const changeBreakdownList = getChangeBreakdown(change);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (insufficientCash) return;
    playPosBeep("checkout");
    onConfirmCheckout(
      paymentMethod,
      paymentMethod === "efectivo" ? cashReceived : total,
      paymentMethod === "efectivo" ? change : 0,
      notes
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden text-white max-h-[95vh] flex flex-col backdrop-blur-xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-800/90 via-emerald-700/85 to-teal-800/90 px-6 py-4 flex items-center justify-between shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('/images/billetes-mexicanos.jpg')] bg-cover bg-center" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-black/20 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100/90">
                Punto de Cobro • Masa de Maíz
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                Total a Cobrar: <span className="text-amber-200">${total.toFixed(2)}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/20 rounded-2xl transition-colors text-emerald-100 relative z-10"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Método de pago */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "efectivo", label: "Efectivo ($)", icon: Banknote },
              { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
              { id: "transferencia", label: "QR / SPEI", icon: QrCode },
              { id: "credito", label: "Crédito / Fiado", icon: UserCheck },
            ].map((m) => {
              const Icon = m.icon;
              const isSel = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setPaymentMethod(m.id); playPosBeep("scan"); }}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all backdrop-blur-sm ${
                    isSel
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-extrabold text-center">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* EFECTIVO */}
          {paymentMethod === "efectivo" && (
            <div className="space-y-4">
              {/* Panel de resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/80 backdrop-blur border border-slate-800/80 rounded-2xl p-3.5 text-center">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">EFECTIVO RECIBIDO</div>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${cashReceived >= total ? "text-emerald-400" : "text-white"}`}>
                    ${cashReceived.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{totalPiezas} piezas</div>
                </div>

                <div className="bg-slate-950/80 backdrop-blur border border-slate-800/80 rounded-2xl p-3.5 text-center">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {insufficientCash ? "❌ FALTA POR CUBRIR" : "✅ COMPLETO"}
                  </div>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${insufficientCash ? "text-rose-400" : "text-emerald-400"}`}>
                    {insufficientCash ? `$${falta.toFixed(2)}` : "✓ LISTO"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {insufficientCash ? "Faltan pesos" : "Cubre el total"}
                  </div>
                </div>

                <div className={`rounded-2xl p-3.5 text-center border-2 backdrop-blur ${
                  insufficientCash
                    ? "bg-slate-950/80 border-rose-500/40"
                    : change > 0
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-slate-950/80 border-slate-800"
                }`}>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {change > 0 ? "🔄 CAMBIO A DEVOLVER" : "CAMBIO"}
                  </div>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${change > 0 ? "text-amber-400" : "text-slate-500"}`}>
                    {change > 0 ? `$${change.toFixed(2)}` : "$0.00"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {change > 0 ? `${changeBreakdownList.length} denominaciones` : "Cambio exacto"}
                  </div>
                </div>
              </div>

              {/* Desglose billetes vs monedas */}
              <div className="flex items-center justify-between bg-slate-800/40 backdrop-blur px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-700/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  Billetes: <strong className="text-white font-mono">${totalBilletes.toFixed(2)}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Monedas: <strong className="text-white font-mono">${totalMonedas.toFixed(2)}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  Total: <strong className="text-white">{totalPiezas} piezas</strong>
                </span>
              </div>

              {/* BILLETES MEXICANOS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-400" />
                    Billetes Mexicanos 🇲🇽
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={handleExactCash}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/20 backdrop-blur">Exacto</button>
                    <button type="button" onClick={handleQuickFill}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500/20">Cubrir</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {DENOMINATIONS.filter((d) => d.type === "billete").map((den) => {
                    const count = denomCounts[den.value] || 0;
                    const subtotalDen = count * den.value;
                    const isActive = count > 0;

                    return (
                      <div key={den.value} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        isActive ? "border-amber-500/60 shadow-lg shadow-amber-500/10" : "border-slate-700/60 hover:border-slate-500"
                      }`}>
                        <div className="h-24 sm:h-28 bg-slate-950 relative overflow-hidden">
                          <img src={den.img} alt={`Billete mexicano ${den.label} pesos`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 text-sm font-black font-mono text-white drop-shadow-lg bg-black/30 px-2 py-0.5 rounded-lg backdrop-blur-sm">{den.label}</div>
                        </div>
                        <div className="bg-slate-900/95 backdrop-blur-sm p-2.5 border-t border-slate-800/60">
                          <div className="flex items-center justify-between gap-1">
                            <button type="button" onClick={() => handleDenomChange(den.value, -1)} disabled={count <= 0}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-base font-black font-mono text-white min-w-[32px] text-center tabular-nums">{count}</span>
                            <button type="button" onClick={() => handleDenomChange(den.value, 1)}
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-all">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {isActive && <div className="mt-1.5 text-xs font-bold text-amber-400 font-mono text-right bg-amber-500/10 px-2 py-0.5 rounded-lg">${subtotalDen.toFixed(0)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MONEDAS MEXICANAS */}
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Monedas Mexicanas 🇲🇽
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DENOMINATIONS.filter((d) => d.type === "moneda").map((den) => {
                    const count = denomCounts[den.value] || 0;
                    const subtotalDen = count * den.value;
                    const isActive = count > 0;

                    return (
                      <div key={den.value} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        isActive ? "border-emerald-500/60 shadow-md shadow-emerald-500/10" : "border-slate-700/60 hover:border-slate-600"
                      }`}>
                        <div className="h-16 bg-slate-950 relative overflow-hidden">
                          <img src={den.img} alt={`Moneda mexicana ${den.label} peso`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                          <div className="absolute bottom-1 left-2 text-sm font-black font-mono text-white drop-shadow-lg bg-black/20 px-1.5 py-0.5 rounded">{den.label}</div>
                        </div>
                        <div className="bg-slate-900/95 backdrop-blur-sm p-2 border-t border-slate-800/60">
                          <div className="flex items-center justify-between gap-1">
                            <button type="button" onClick={() => handleDenomChange(den.value, -1)} disabled={count <= 0}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black font-mono text-white min-w-[28px] text-center">{count}</span>
                            <button type="button" onClick={() => handleDenomChange(den.value, 1)}
                              className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {isActive && <div className="mt-1 text-[11px] font-bold text-emerald-400 font-mono text-right bg-emerald-500/10 px-1.5 py-0.5 rounded-lg">${subtotalDen.toFixed(0)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones rápidos */}
              <div className="pt-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Agregar Billete Rápido
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "+$20", val: 20 }, { label: "+$50", val: 50 }, { label: "+$100", val: 100 },
                    { label: "+$200", val: 200 }, { label: "+$500", val: 500 }, { label: "+$1,000", val: 1000 },
                    { label: "♻️ Limpiar", val: -1 },
                  ].map((b, idx) => (
                    <button key={idx} type="button"
                      onClick={() => {
                        if (b.val === -1) {
                          const reset: Record<number, number> = {};
                          DENOMINATIONS.forEach((d) => { reset[d.value] = 0; });
                          setDenomCounts(reset);
                          playPosBeep("scan");
                        } else { handleQuickBill(b.val); }
                      }}
                      className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold border transition-all backdrop-blur-sm ${
                        b.val === -1
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          : "bg-slate-950/60 border-slate-700 text-emerald-300 hover:border-emerald-500/60"
                      }`}>{b.label}</button>
                  ))}
                </div>
              </div>

              {/* Desglose de cambio sugerido */}
              {change > 0 && changeBreakdownList.length > 0 && (
                <div className="bg-slate-950/80 backdrop-blur p-4 rounded-2xl border border-amber-500/30 shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-amber-400 mb-3">
                    <Receipt className="w-4 h-4" />
                    💡 Desglose Sugerido para Devolver Cambio
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {changeBreakdownList.map((item, i) => (
                      <div key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm border backdrop-blur-sm ${
                        item.value >= 100 ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}>
                        <span className="font-mono font-black">{item.count} x {item.label}</span>
                        <span className="text-[10px] opacity-60">= ${(item.count * item.value).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="w-full text-right text-xs text-slate-400 mt-1 pt-2 border-t border-slate-800">
                      Total del cambio: <strong className="text-amber-400 font-mono text-sm">${change.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta */}
          {paymentMethod === "tarjeta" && (
            <div className="bg-slate-800/40 backdrop-blur p-6 rounded-2xl border border-slate-700 text-center space-y-2">
              <CreditCard className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="font-extrabold text-white text-base">Pago con Tarjeta de Débito / Crédito</div>
              <p className="text-xs text-slate-400">Pase o inserte la tarjeta en la Terminal Bancaria POS y confirme el cobro.</p>
            </div>
          )}

          {/* Transferencia QR */}
          {paymentMethod === "transferencia" && (
            <div className="bg-slate-800/40 backdrop-blur p-6 rounded-2xl border border-slate-700 text-center space-y-3">
              <div className="font-extrabold text-white text-sm">Escanea el Código QR para pagar con SPEI / App Bancaria</div>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                  <div className="w-28 h-28 bg-slate-900 rounded grid grid-cols-6 grid-rows-6 gap-1 p-1">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? "bg-black" : "bg-white"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-emerald-400 font-bold">CLABE: 012-180-00123456789-0 • Banco Banxico / BBVA</div>
            </div>
          )}

          {/* Crédito */}
          {paymentMethod === "credito" && (
            <div className="bg-amber-500/10 backdrop-blur p-5 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                <AlertCircle className="w-5 h-5" />
                Venta a Cuenta / Fiado en Tienda
              </div>
              <p className="text-xs text-slate-300">
                El total de <strong className="text-amber-400 font-mono">${total.toFixed(2)}</strong> será cargado al saldo de cuenta del cliente{" "}
                <strong className="text-white">{selectedCustomerName}</strong>.
              </p>
            </div>
          )}

          {/* Cliente */}
          <div className="bg-slate-800/40 backdrop-blur p-3 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="text-slate-400 block font-semibold">Cliente del Ticket:</span>
              <strong className="text-white text-sm">{selectedCustomerName}</strong>
            </div>
            <select value={selectedCustomerName} onChange={(e) => onSelectCustomer(e.target.value)}
              className="bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 backdrop-blur">
              <option value="Público en General">Público en General</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {Number(c.balance) > 0 ? `(Saldo: $${Number(c.balance).toFixed(2)})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Nota */}
          <div>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Nota / Referencia del ticket (opcional)..."
              className="w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900/90 backdrop-blur pb-1">
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-800/60 text-slate-300 font-bold hover:bg-slate-700/60 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={insufficientCash || totalPiezas === 0}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
              <Check className="w-5 h-5" />
              Confirmar Cobro e Imprimir Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
