"use client";

import React from "react";
import { Printer, X, Check, QrCode, Sparkles } from "lucide-react";

interface ReceiptModalProps {
  sale: {
    id?: number;
    ticketNumber: string;
    customerName: string;
    paymentMethod: string;
    subtotal: string | number;
    tax?: string | number;
    discount?: string | number;
    total: string | number;
    cashReceived?: string | number;
    changeReturned?: string | number;
    createdAt?: string | Date;
    items?: Array<{
      productName: string;
      quantity: string | number;
      unit: string;
      unitPrice: string | number;
      subtotal: string | number;
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ sale, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = sale.createdAt
    ? new Date(sale.createdAt).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header no imprimible */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm">Comprobante del Molino • Ticket Térmico</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenedor del Ticket estilo Papel Térmico */}
        <div className="p-6 overflow-y-auto flex-1 bg-amber-50/5 text-slate-100 font-mono text-sm print:bg-white print:text-black">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner text-slate-200 print:border-none print:shadow-none print:p-0">
            {/* Cabecera del negocio */}
            <div className="text-center pb-3 border-b border-dashed border-slate-700">
              <div className="text-base font-bold tracking-tight text-amber-400 print:text-black">
                🌽 MASAPOS PRO • FÁBRICA & MOLINO
              </div>
              <div className="text-xs text-slate-400 print:text-gray-700 mt-1">
                Especialistas en Masa para Tortillas, Tamal y Nixtamal
              </div>
              <div className="text-xs text-slate-400 print:text-gray-700">
                Av. Nixtamal del Bajío #100, Molino Central
              </div>
              <div className="text-xs text-slate-400 print:text-gray-700">
                RFC: MSO-260330-POS • Tel: 55-8877-6655
              </div>
            </div>

            {/* Datos del Ticket */}
            <div className="py-3 border-b border-dashed border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">TICKET:</span>
                <span className="font-bold text-white print:text-black">{sale.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">MOSTRADOR:</span>
                <span>Caja 1 - Molino Principal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">TAQUERÍA/CLIENTE:</span>
                <span className="truncate max-w-[180px]">{sale.customerName}</span>
              </div>
            </div>

            {/* Tabla de partidas */}
            <div className="py-3 border-b border-dashed border-slate-700">
              <div className="text-xs font-bold text-slate-400 print:text-gray-600 flex justify-between mb-2">
                <span>CANT / DESCRIPCIÓN DE MASA</span>
                <span>IMPORTE</span>
              </div>
              <div className="space-y-2 text-xs">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white print:text-black">
                          {it.productName}
                        </div>
                        <div className="text-slate-400 print:text-gray-600">
                          {Number(it.quantity).toFixed(2)} {it.unit.toUpperCase()} x ${Number(it.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="font-bold text-right">
                        ${Number(it.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-slate-400">Sin detalle de artículos</div>
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="py-3 border-b border-dashed border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>SUBTOTAL:</span>
                <span>${Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {Number(sale.discount || 0) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>DESCUENTO:</span>
                  <span>-${Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-white print:text-black pt-1">
                <span>TOTAL A PAGAR:</span>
                <span className="text-amber-400 print:text-black">${Number(sale.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Información de Pago y Cambio */}
            <div className="py-3 border-b border-dashed border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">PAGO CON:</span>
                <span className="uppercase font-bold">{sale.paymentMethod}</span>
              </div>
              {sale.paymentMethod === "efectivo" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-600">EFECTIVO RECIBIDO:</span>
                    <span>${Number(sale.cashReceived || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 print:text-black pt-1 bg-emerald-500/10 print:bg-transparent px-2 py-1 rounded">
                    <span>SU CAMBIO ES:</span>
                    <span>${Number(sale.changeReturned || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pie y código QR */}
            <div className="pt-4 text-center space-y-2">
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-lg inline-block">
                  <div className="w-20 h-20 bg-slate-900 rounded grid grid-cols-5 grid-rows-5 gap-0.5 p-1">
                    {/* Visual simulated QR dots */}
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          [0, 2, 4, 6, 8, 10, 12, 16, 18, 20, 24].includes(i)
                            ? "bg-black"
                            : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 print:text-gray-600 font-sans">
                ¡Gracias por su preferencia! • Masa 100% nixtamalizada natural
              </div>
              <div className="text-[10px] text-slate-500 print:text-gray-500">
                Sistema POS Fábrica y Molino de Masa 2026
              </div>
            </div>
          </div>
        </div>

        {/* Footer de botones print / close */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors text-sm"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
