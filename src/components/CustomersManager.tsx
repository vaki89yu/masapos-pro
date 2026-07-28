"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  DollarSign,
  Phone,
  UserCheck,
  X,
  Check,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { playPosBeep } from "@/lib/sound";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  balance: string | number;
  creditLimit: string | number;
}

interface CustomersManagerProps {
  customers: Customer[];
  openShiftId: number | null;
  onCustomerUpdated: () => void;
}

export default function CustomersManager({
  customers,
  openShiftId,
  onCustomerUpdated,
}: CustomersManagerProps) {
  const [modalNewOpen, setModalNewOpen] = useState<boolean>(false);
  const [modalPayOpen, setModalPayOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form New Customer
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("1500.00");

  // Form Payment (Abono)
  const [payAmount, setPayAmount] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("Abono en efectivo en mostrador");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleOpenPay = (cust: Customer) => {
    setSelectedCustomer(cust);
    setPayAmount(String(Number(cust.balance || 0).toFixed(2)));
    setPayNotes("Abono de saldo en caja");
    setModalPayOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          creditLimit,
        }),
      });

      if (res.ok) {
        playPosBeep("checkout");
        setModalNewOpen(false);
        setName("");
        setPhone("");
        onCustomerUpdated();
      } else {
        alert("No se pudo registrar el cliente.");
      }
    } catch (err) {
      console.error("Create customer error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount || Number(payAmount) <= 0) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_credit",
          customerId: selectedCustomer.id,
          amount: payAmount,
          shiftId: openShiftId,
          notes: payNotes,
        }),
      });

      if (res.ok) {
        playPosBeep("checkout");
        setModalPayOpen(false);
        onCustomerUpdated();
      } else {
        alert("Error al registrar el abono.");
      }
    } catch (err) {
      console.error("Pay credit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCreditBalance = customers.reduce(
    (sum, c) => sum + Number(c.balance || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* BANNER CLIENTES */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Cuentas de Crédito, Fiado & Taquerías Habituales
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Control de saldos pendientes por cobrar en la tienda • Saldo total fiado:{" "}
              <strong className="text-blue-400 font-mono">
                ${totalCreditBalance.toFixed(2)}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNewOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente / Cuenta</span>
        </button>
      </div>

      {/* GRILLA DE CLIENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => {
          const bal = Number(c.balance || 0);
          const lim = Number(c.creditLimit || 1);
          const ratio = (bal / lim) * 100;
          const hasDebt = bal > 0;

          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-semibold">
                    #CL-{c.id}
                  </span>
                  {hasDebt ? (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
                      Saldo Pendiente
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                      Al Corriente
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base truncate">{c.name}</h3>
                {c.phone && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{c.phone}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Deuda actual:</span>
                    <span className="text-lg font-extrabold font-mono text-amber-400">
                      ${bal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Límite de crédito:</span>
                    <span className="font-mono text-white">${lim.toFixed(2)}</span>
                  </div>

                  {/* Barra de uso de crédito */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        ratio > 85
                          ? "bg-rose-500"
                          : ratio > 50
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
                {hasDebt ? (
                  <button
                    onClick={() => handleOpenPay(c)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Registrar Abono / Pago</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-500 text-center w-full py-1.5">
                    Sin adeudo pendiente
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {modalNewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Nuevo Cliente / Taquería</h3>
              <button
                onClick={() => setModalNewOpen(false)}
                className="p-1 hover:bg-black/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nombre de la Cuenta o Taquería:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Taquería Los Hermanos..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Teléfono de contacto (opcional):
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="55-1234-5678"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Límite de Crédito Permitido ($ MXN):
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-blue-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNewOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg"
                >
                  Registrar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAY CREDIT / REGISTRAR ABONO */}
      {modalPayOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Abono de Pago</h3>
              <button
                onClick={() => setModalPayOpen(false)}
                className="p-1 hover:bg-black/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayCredit} className="p-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="text-slate-400">Cliente / Taquería:</div>
                <div className="font-bold text-white text-base">{selectedCustomer.name}</div>
                <div className="text-amber-400 font-mono font-bold mt-1">
                  Saldo pendiente actual: ${Number(selectedCustomer.balance || 0).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Monto del Abono en Efectivo ($ MXN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={Number(selectedCustomer.balance || 9999)}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-mono font-extrabold text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Nota / Observación:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalPayOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs shadow-lg"
                >
                  Registrar Abono en Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
