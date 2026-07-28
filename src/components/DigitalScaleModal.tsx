"use client";

import React, { useState, useEffect } from "react";
import { Scale, X, Check, DollarSign, Weight, Sparkles, Store, Bike } from "lucide-react";
import { playPosBeep } from "@/lib/sound";

interface DigitalScaleModalProps {
  product: {
    id: number;
    name: string;
    price: string | number;
    unit: string;
    stock?: string | number;
    barcode?: string;
    category?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, subtotal: number) => void;
}

export default function DigitalScaleModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: DigitalScaleModalProps) {
  const [weightKg, setWeightKg] = useState<string>("1.000");
  const [inputMode, setInputMode] = useState<"weight" | "money">("weight");
  const [moneyValue, setMoneyValue] = useState<string>("");

  const pricePerKg = Number(product.price || 10);
  const isTienda = product.category === "tienda" || pricePerKg === 10;

  useEffect(() => {
    if (isOpen) {
      setWeightKg("1.000");
      setMoneyValue("");
      setInputMode("weight");
      playPosBeep("scale");
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  // Calculate current weight and price
  let numericWeight = Number(weightKg) || 0;
  let numericPrice = numericWeight * pricePerKg;

  if (inputMode === "money") {
    const money = Number(moneyValue) || 0;
    numericPrice = money;
    numericWeight = pricePerKg > 0 ? money / pricePerKg : 0;
  }

  const handleQuickWeight = (w: number) => {
    setInputMode("weight");
    setWeightKg(w.toFixed(3));
    playPosBeep("scale");
  };

  const handleQuickMoney = (pesos: number) => {
    setInputMode("money");
    setMoneyValue(pesos.toString());
    playPosBeep("scale");
  };

  const handleConfirm = () => {
    if (numericWeight <= 0) return;
    playPosBeep("scan");
    onConfirm(Number(numericWeight.toFixed(3)), Number(numericPrice.toFixed(2)));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            isTienda
              ? "bg-gradient-to-r from-emerald-600 to-teal-600"
              : "bg-gradient-to-r from-amber-600 to-orange-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black/20 rounded-2xl">
              {isTienda ? <Store className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/90">
                Báscula POS • {isTienda ? "Venta en Tienda" : "Reparto en Moto"}
              </div>
              <h3 className="text-lg font-black text-white leading-tight">
                {isTienda ? "Masa en Tienda • $10.00/kg" : "Masa en Moto • $11.00/kg"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/20 rounded-2xl transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Precio por kg y stock info */}
          <div className="flex items-center justify-between bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/60 text-sm">
            <span className="text-slate-300">
              Tarifa aplicada:{" "}
              <strong className={isTienda ? "text-emerald-400 font-black" : "text-amber-400 font-black"}>
                ${pricePerKg.toFixed(2)} pesos / kilo
              </strong>
            </span>
            {product.stock !== undefined && (
              <span className="text-slate-400">
                Almacén molino: <strong className="text-white font-bold">{Number(product.stock).toFixed(0)} kg</strong>
              </span>
            )}
          </div>

          {/* Digital Scale LED display */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 shadow-inner flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Peso kg */}
            <div>
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5" /> PESO DE MASA (KG)
              </div>
              <div className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
                {numericWeight.toFixed(3)}
                <span className="text-lg font-bold ml-1.5 text-emerald-500">kg</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                ({(numericWeight * 1000).toFixed(0)} gramos de masa)
              </div>
            </div>

            {/* Total a cobrar */}
            <div className="text-right border-l border-slate-800 pl-6">
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400 mb-1 flex items-center justify-end gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> TOTAL A COBRAR
              </div>
              <div className="text-4xl font-black font-mono text-amber-400 tracking-tight">
                ${numericPrice.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isTienda ? "Cobro en mostrador" : "Cobro envío en moto"}
              </div>
            </div>
          </div>

          {/* Modo de entrada: Por Peso o Por Dinero */}
          <div className="flex rounded-2xl bg-slate-800 p-1.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setInputMode("weight")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                inputMode === "weight"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Weight className="w-4 h-4" /> Vender por Kilos (1 a 10 Kg)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("money")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                inputMode === "money"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <DollarSign className="w-4 h-4" /> Vender por Pesos ($)
            </button>
          </div>

          {/* Input field */}
          {inputMode === "weight" ? (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Escribe Peso en Kilos o Selecciona Rápido (1 al 10 Kg):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3.5 text-2xl font-mono font-bold text-white focus:outline-none focus:border-amber-500 text-center"
                placeholder="1.000"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                ¿Cuánto de dinero ($ MXN) compra el cliente de masa?:
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-400">
                  $
                </span>
                <input
                  type="number"
                  step="5"
                  min="5"
                  value={moneyValue}
                  onChange={(e) => setMoneyValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-2xl font-mono font-bold text-white focus:outline-none focus:border-amber-500 text-center"
                  placeholder="20, 50, 100..."
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* BOTONES RÁPIDOS DE KILOS DEL 1 AL 10 KG Y FRACCIONES */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {inputMode === "weight"
                ? "Selectores Rápidos de Kilos (1 al 10 Kg)"
                : "Montos Rápidos en Efectivo ($)"}
            </div>
            {inputMode === "weight" ? (
              <div className="space-y-2">
                {/* 1kg al 10kg en botones grandes y vistosos */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((kilo) => (
                    <button
                      key={kilo}
                      type="button"
                      onClick={() => handleQuickWeight(kilo)}
                      className={`py-2.5 px-2 rounded-xl text-sm font-extrabold border transition-all ${
                        Number(weightKg) === kilo
                          ? "bg-amber-500 border-amber-400 text-slate-950 shadow-md scale-105"
                          : "bg-slate-800 border-slate-700 text-amber-300 hover:border-amber-500/60 hover:bg-slate-700"
                      }`}
                    >
                      {kilo} kg
                    </button>
                  ))}
                </div>

                {/* Fracciones complementarias (1/4, 1/2, 3/4, 1.5, 2.5) */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[
                    { label: "1/4 Kg", val: 0.25 },
                    { label: "1/2 Kg", val: 0.5 },
                    { label: "3/4 Kg", val: 0.75 },
                    { label: "1.5 Kg", val: 1.5 },
                    { label: "2.5 Kg", val: 2.5 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleQuickWeight(btn.val)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        Number(weightKg) === btn.val
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {[10, 11, 20, 22, 30, 33, 50, 100, 150, 200].map((pesos) => (
                  <button
                    key={pesos}
                    type="button"
                    onClick={() => handleQuickMoney(pesos)}
                    className="py-2.5 px-2 rounded-xl text-sm font-extrabold bg-slate-800 border border-slate-700 text-amber-300 hover:border-amber-500/60 transition-all"
                  >
                    ${pesos}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={numericWeight <= 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Check className="w-4 h-4" />
            Pesar y Agregar al Ticket ({numericWeight.toFixed(2)} kg a ${numericPrice.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
