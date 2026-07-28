import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MasaPOS Pro • Masa de Maíz ($10 Tienda / $11 Reparto en Moto)",
  description:
    "Sistema integral de punto de cobro exclusivo para venta de Masa de Maíz con tarifas configuradas: $10.00/kg comprada en tienda y $11.00/kg repartida en moto, con selectores numéricos de kilos y báscula digital.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MasaPOS Pro",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('✅ MasaPOS Service Worker registrado');
                  }).catch(function(err) {
                    console.warn('⚠️ Service Worker no disponible:', err);
                  });
                });

                window.addEventListener('online', function() {
                  document.body.classList.remove('masapos-offline');
                  document.body.classList.add('masapos-online');
                  document.dispatchEvent(new CustomEvent('masapos-connection', { detail: { online: true } }));
                });

                window.addEventListener('offline', function() {
                  document.body.classList.remove('masapos-online');
                  document.body.classList.add('masapos-offline');
                  document.dispatchEvent(new CustomEvent('masapos-connection', { detail: { online: false } }));
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-white antialiased">
        <div
          id="masapos-connection-indicator"
          className="hidden fixed top-0 left-0 right-0 z-[100] py-1 text-center text-xs font-bold transition-all duration-300 print:hidden"
        >
          ⚡ Sin conexión a internet — Modo offline activo
        </div>

        {children}

        <style dangerouslySetInnerHTML={{
          __html: `
            .masapos-offline #masapos-connection-indicator {
              display: block !important;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #0f172a;
            }
            @media print {
              #masapos-connection-indicator { display: none !important; }
            }
          `
        }} />
      </body>
    </html>
  );
}
