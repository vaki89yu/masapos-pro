"use client";

import React, { useState } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Scale,
  DollarSign,
  AlertCircle,
  Sparkles,
  Barcode,
  ArrowRight,
  Receipt,
  User,
  Weight,
  Store,
  Bike,
  Check,
} from "lucide-react";
import DigitalScaleModal from "./DigitalScaleModal";
import CheckoutModal from "./CheckoutModal";
import ReceiptModal from "./ReceiptModal";
import { playPosBeep } from "@/lib/sound";

interface Product {
  id: number;
  barcode: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price: string | number;
  costPrice: string | number;
  stock: string | number;
  minStockAlert: string | number;
  isBulk: boolean;
  active: boolean;
}

interface CartItem {
  productId: number;
  barcode: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isBulk: boolean;
  channel: "tienda" | "moto";
}

interface Customer {
  id: number;
  name: string;
  balance: string | number;
  creditLimit: string | number;
}

interface PosTerminalProps {
  products: Product[];
  customers: Customer[];
  openShiftId: number | null;
  onSaleCompleted: () => void;
  onNavigateShift: () => void;
}

export default function PosTerminal({
  products,
  customers,
  openShiftId,
  onSaleCompleted,
  onNavigateShift,
}: PosTerminalProps) {
  const [selectedChannel, setSelectedChannel] = useState<"tienda" | "moto">("tienda");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("Público en General");

  // Digital Scale Modal
  const [scaleModalOpen, setScaleModalOpen] = useState<boolean>(false);
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);

  // Checkout Modal
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);

  // Receipt Modal
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);

  // Descuento rápido en monto ($)
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Buscar el producto correspondiente de Tienda ($10) vs Moto ($11) en el array `products`
  const tiendaProduct =
    products.find((p) => p.category === "tienda" || Number(p.price) === 10) || products[0];
  const motoProduct =
    products.find((p) => p.category === "reparto_moto" || Number(p.price) === 11) ||
    products[1] ||
    products[0];

  const activeProduct = selectedChannel === "tienda" ? tiendaProduct : motoProduct;
  const currentPrice = selectedChannel === "tienda" ? 10.0 : 11.0;

  // Cart operations
  const handleAddDirect = (channel: "tienda" | "moto", qty: number = 1) => {
    const prod = channel === "tienda" ? tiendaProduct : motoProduct;
    if (!prod) return;
    playPosBeep("scan");

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prod.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = Number(copy[existingIdx].quantity) + qty;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: Number(newQty.toFixed(3)),
          subtotal: Number((newQty * copy[existingIdx].unitPrice).toFixed(2)),
        };
        return copy;
      } else {
        const up = channel === "tienda" ? 10.0 : 11.0;
        return [
          ...prev,
          {
            productId: prod.id,
            barcode: prod.barcode,
            productName: channel === "tienda" ? "Masa • Comprada en Tienda" : "Masa • Repartida en Moto",
            unit: "kg",
            unitPrice: up,
            quantity: qty,
            subtotal: Number((qty * up).toFixed(2)),
            isBulk: true,
            channel,
          },
        ];
      }
    });
  };

  const handleOpenScale = (channel: "tienda" | "moto") => {
    const prod = channel === "tienda" ? tiendaProduct : motoProduct;
    if (!prod) return;
    setScaleProduct(prod);
    setScaleModalOpen(true);
  };

  const handleScaleConfirmed = (qty: number, sub: number) => {
    if (!scaleProduct) return;
    const isTienda = scaleProduct.category === "tienda" || Number(scaleProduct.price) === 10;
    const channel: "tienda" | "moto" = isTienda ? "tienda" : "moto";

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === scaleProduct.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = Number(copy[existingIdx].quantity) + qty;
        const newSub = Number(copy[existingIdx].subtotal) + sub;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: Number(newQty.toFixed(3)),
          subtotal: Number(newSub.toFixed(2)),
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            productId: scaleProduct.id,
            barcode: scaleProduct.barcode,
            productName: isTienda ? "Masa • Comprada en Tienda" : "Masa • Repartida en Moto",
            unit: scaleProduct.unit,
            unitPrice: isTienda ? 10.0 : 11.0,
            quantity: qty,
            subtotal: sub,
            isBulk: true,
            channel,
          },
        ];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = Number(item.quantity) + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: Number(nextQty.toFixed(3)),
              subtotal: Number((nextQty * item.unitPrice).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    playPosBeep("error");
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    playPosBeep("error");
    setCart([]);
    setDiscountAmount(0);
  };

  // Financial calculations
  const cartSubtotal = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  // Submit Checkout to Backend
  const handleConfirmCheckout = async (
    paymentMethod: string,
    cashReceived: number,
    changeReturned: number,
    notes: string
  ) => {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: openShiftId,
          customerName: selectedCustomerName,
          paymentMethod,
          items: cart,
          subtotal: cartSubtotal.toFixed(2),
          tax: "0.00",
          discount: discountAmount.toFixed(2),
          total: cartTotal.toFixed(2),
          cashReceived: cashReceived.toFixed(2),
          changeReturned: changeReturned.toFixed(2),
          notes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || "Error al procesar la venta");
        return;
      }

      const resJson = await response.json();
      setLastCompletedSale(resJson.sale);
      setCheckoutOpen(false);
      setCart([]);
      setDiscountAmount(0);
      setReceiptOpen(true);
      onSaleCompleted();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("No se pudo conectar con el servidor para registrar el cobro.");
    }
  };

  // Botones de 1kg al 10kg
  const kilos1to10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Pedidos grandes para moto / taquería
  const kilosGrandes = [15, 20, 25, 30, 40, 50];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* PANEL IZQUIERDO: SELECTORES DE MASA EN TIENDA ($10) vs REPARTO MOTO ($11) (7 COLUMNAS) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Banner si la caja está cerrada */}
        {!openShiftId && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 text-rose-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold text-sm">Turno de Caja Cerrado</div>
                <p className="text-xs text-rose-300/80">
                  Abre un turno antes o el sistema asignará la venta al turno activo.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateShift}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors shrink-0"
            >
              Abrir Caja
            </button>
          </div>
        )}

        {/* SELECTOR SUPERIOR DE MODALIDAD (TIENDA $10 vs REPARTO MOTO $11) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TARJETA 1: COMPRADA EN TIENDA ($10.00 / kg) */}
          <div
            className={`rounded-3xl border-2 transition-all flex flex-col justify-between shadow-lg overflow-hidden ${
              selectedChannel === "tienda"
                ? "border-emerald-500 shadow-emerald-500/10 scale-[1.01]"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Imagen de masa real de fondo en la parte superior */}
            <div className="relative h-32 bg-slate-950 overflow-hidden">
              <img
                src="/images/masa-tienda.jpg"
                alt="Masa fresca en tienda"
                className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute top-2 left-3">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider inline-flex items-center gap-1 backdrop-blur-sm">
                  <Store className="w-3 h-3" /> En Tienda / Mostrador
                </span>
              </div>
              <div className="absolute bottom-2 right-3 text-xs font-mono font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                Stock: {Number(tiendaProduct?.stock || 450).toFixed(0)} kg
              </div>
            </div>

            <div className="p-4 bg-slate-900/95 backdrop-blur-sm flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  Masa de Maíz
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Tienda</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Masa 100% nixtamalizada fresca del molino</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-emerald-400 tracking-tight">$10.00</span>
                  <span className="text-sm font-bold text-slate-400">pesos / kilo</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel("tienda")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedChannel === "tienda"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {selectedChannel === "tienda" ? "✓ Cobrar en Tienda" : "Elegir $10 / kg"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenScale("tienda")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  <span>Báscula</span>
                </button>
              </div>
            </div>
          </div>

          {/* TARJETA 2: REPARTIDA EN MOTO ($11.00 / kg) */}
          <div
            className={`rounded-3xl border-2 transition-all flex flex-col justify-between shadow-lg overflow-hidden ${
              selectedChannel === "moto"
                ? "border-amber-500 shadow-amber-500/10 scale-[1.01]"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Imagen de reparto en moto */}
            <div className="relative h-32 bg-slate-950 overflow-hidden">
              <img
                src="/images/masa-moto.jpg"
                alt="Reparto de masa en moto"
                className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute top-2 left-3">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider inline-flex items-center gap-1 backdrop-blur-sm">
                  <Bike className="w-3 h-3" /> Repartida en Moto
                </span>
              </div>
              <div className="absolute bottom-2 right-3 text-xs font-mono font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                Stock: {Number(motoProduct?.stock || 350).toFixed(0)} kg
              </div>
            </div>

            <div className="p-4 bg-slate-900/95 backdrop-blur-sm flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  Masa de Maíz
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Moto</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Entrega a domicilio y taquerías en moto</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-amber-400 tracking-tight">$11.00</span>
                  <span className="text-sm font-bold text-slate-400">pesos / kilo</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel("moto")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedChannel === "moto"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {selectedChannel === "moto" ? "✓ Cobrar Moto" : "Elegir $11 / kg"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenScale("moto")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  <span>Báscula</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTONERA GIGANTE NUMÉRICA DE KILOS DEL 1KG AL 10KG (DE LA MODALIDAD ACTIVA) */}
        <div className="relative overflow-hidden bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Imagen sutil de masa de fondo */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <img src="/images/masa-fresca.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  selectedChannel === "tienda"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                <Weight className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">
                  Selectores Rápidos •{" "}
                  {selectedChannel === "tienda" ? "En Tienda ($10 / kg)" : "Repartida en Moto ($11 / kg)"}
                </h4>
                <p className="text-xs text-slate-400">
                  Toca directamente <strong className="text-white">1kg, 2kg, 5kg... hasta 10kg</strong> para sumar al ticket
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedChannel("tienda")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChannel === "tienda"
                    ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                🏪 Tienda $10
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel("moto")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChannel === "moto"
                    ? "bg-amber-500 border-amber-400 text-slate-950 shadow"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                🏍️ Moto $11
              </button>
            </div>
          </div>

          {/* BOTONERA PRINCIPAL 1 KG AL 10 KG EN BOTONES GIGANTES Y FÁCILES DE TOCAR */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Selectores de Kilos (1 al 10 Kg):</span>
              <span className="text-amber-400 font-mono">
                Precio actual: ${currentPrice.toFixed(2)} pesos/kg
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {kilos1to10.map((kilo) => {
                const totalCalculado = (kilo * currentPrice).toFixed(0);
                return (
                  <button
                    key={kilo}
                    type="button"
                    onClick={() => handleAddDirect(selectedChannel, kilo)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg group ${
                      selectedChannel === "tienda"
                        ? "bg-slate-950 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-white"
                        : "bg-slate-950 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500 hover:text-slate-950 text-white"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                      {kilo} <span className="text-base font-bold">kg</span>
                    </span>
                    <span
                      className={`text-xs font-mono font-bold mt-1 ${
                        selectedChannel === "tienda"
                          ? "text-emerald-400 group-hover:text-slate-950"
                          : "text-amber-400 group-hover:text-slate-950"
                      }`}
                    >
                      ${totalCalculado}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTONERA DE KILOS MAYORES PARA MOTO / TAQUERÍAS (15, 20, 25, 30, 40, 50 KG) */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Kilos por Mayor (Taquerías & Tamalerías):
            </div>
            <div className="grid grid-cols-6 gap-2">
              {kilosGrandes.map((kilo) => {
                const totalCalc = (kilo * currentPrice).toFixed(0);
                return (
                  <button
                    key={kilo}
                    type="button"
                    onClick={() => handleAddDirect(selectedChannel, kilo)}
                    className="py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-center transition-all active:scale-95"
                  >
                    <div className="text-sm font-extrabold font-mono text-white">{kilo} kg</div>
                    <div className="text-[11px] font-mono font-semibold text-slate-400">
                      ${totalCalc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FRACCIONES (1/4 KG, 1/2 KG, 3/4 KG, 1.5 KG, 2.5 KG) */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400 shrink-0">Fracciones:</span>
            <div className="grid grid-cols-5 gap-2 flex-1">
              {[
                { label: "+1/4 kg (250g)", val: 0.25 },
                { label: "+1/2 kg (500g)", val: 0.5 },
                { label: "+3/4 kg (750g)", val: 0.75 },
                { label: "+1.5 kg", val: 1.5 },
                { label: "+2.5 kg", val: 2.5 },
              ].map((frac) => (
                <button
                  key={frac.label}
                  type="button"
                  onClick={() => handleAddDirect(selectedChannel, frac.val)}
                  className="py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all text-center"
                >
                  {frac.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: CARRITO DEL TICKET & CAJA (5 COLUMNAS) */}
      <div className="lg:col-span-5">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-full sticky top-20 overflow-hidden">
          {/* Header Ticket */}
          <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Ticket de Venta de Masa</h3>
                <span className="text-xs text-slate-400">
                  {cart.length} {cart.length === 1 ? "partida" : "partidas"} registradas
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 transition-colors font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            )}
          </div>

          {/* Selector de Cliente para Factura / Crédito */}
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Cliente / Taquería:
            </span>
            <select
              value={selectedCustomerName}
              onChange={(e) => setSelectedCustomerName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="Público en General">Público en General</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Partidas del Carrito */}
          <div className="p-5 flex-1 overflow-y-auto space-y-3 max-h-[420px] min-h-[240px]">
            {cart.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                <Weight className="w-12 h-12 text-slate-600 mb-2" />
                <p className="font-bold text-slate-400 text-base">Ticket Vacío</p>
                <p className="text-xs mt-1 max-w-xs">
                  Elige <strong className="text-emerald-400">Tienda ($10)</strong> o{" "}
                  <strong className="text-amber-400">Reparto Moto ($11)</strong> y toca los botones de kilos.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const isTienda = item.channel === "tienda" || Number(item.unitPrice) === 10;
                return (
                  <div
                    key={item.productId}
                    className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 group hover:border-slate-700 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            isTienda
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {isTienda ? "🏪 Tienda $10/kg" : "🏍️ Moto $11/kg"}
                        </span>
                      </div>
                      <div className="font-extrabold text-white text-sm truncate mt-1">
                        {item.productName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>${item.unitPrice.toFixed(2)} / kg</span>
                        <span className="text-amber-400 font-mono font-bold">
                          • {Number(item.quantity).toFixed(2)} kg
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Controles cantidad */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.productId, -1)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Disminuir 1 kg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-white">
                          {Number(item.quantity).toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.productId, 1)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Aumentar 1 kg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal e icono eliminar */}
                      <div className="text-right">
                        <div className="font-black text-amber-400 text-base font-mono">
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                        title="Quitar partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen Financiero de la Caja */}
          <div className="bg-slate-950 border-t border-slate-800 p-6 space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal del ticket:</span>
              <span className="font-mono text-slate-300 font-semibold">
                ${cartSubtotal.toFixed(2)}
              </span>
            </div>

            {/* Descuento rápido opcional */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Descuento aplicado ($):</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  step="1"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">
                  TOTAL A COBRAR
                </span>
                <span className="text-xs text-slate-500">Masa fresca nixtamalizada</span>
              </div>
              <div className="text-4xl font-black font-mono text-amber-400 tracking-tight">
                ${cartTotal.toFixed(2)}
              </div>
            </div>

            {/* Botón Cobrar */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                playPosBeep("checkout");
                setCheckoutOpen(true);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-lg transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <DollarSign className="w-6 h-6" />
              <span>COBRAR MASA (ENTER / F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE PESO (Báscula Digital) */}
      {scaleProduct && (
        <DigitalScaleModal
          product={scaleProduct}
          isOpen={scaleModalOpen}
          onClose={() => setScaleModalOpen(false)}
          onConfirm={handleScaleConfirmed}
        />
      )}

      {/* MODAL DE COBRO Y CAMBIO */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        subtotal={cartSubtotal}
        discount={discountAmount}
        total={cartTotal}
        customersList={customers}
        selectedCustomerName={selectedCustomerName}
        onSelectCustomer={setSelectedCustomerName}
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* MODAL DE TICKET TÉRMICO IMPRIMIBLE */}
      <ReceiptModal
        sale={lastCompletedSale}
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
