import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MasaPOS Pro • Masa de Maíz ($10 Tienda / $11 Reparto en Moto)",
  description:
    "Sistema integral de punto de cobro exclusivo para venta de Masa de Maíz con tarifas configuradas: $10.00/kg comprada en tienda y $11.00/kg repartida en moto, con selectores numéricos de kilos y báscula digital.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
