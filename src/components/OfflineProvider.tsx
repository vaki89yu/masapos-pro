"use client";

import React, { useEffect, useState, createContext, useContext } from "react";

type OfflineContextType = {
  isOnline: boolean;
  lastSyncAt: string | null;
  savedSales: number;
};

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  lastSyncAt: null,
  savedSales: 0,
});

export const useOffline = () => useContext(OfflineContext);

export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [savedSales, setSavedSales] = useState(0);

  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);

    // Escuchar cambios de conexión
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncAt(new Date().toLocaleString("es-MX"));
      syncPendingSales();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Contar ventas guardadas localmente
    const count = localStorage.getItem("masapos-offline-sales-count") || "0";
    setSavedSales(parseInt(count, 10));

    // Escuchar evento personalizado de nueva venta offline
    const handleNewSale = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.count) {
        setSavedSales(detail.count);
      }
    };

    window.addEventListener("masapos-offline-sale", handleNewSale);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("masapos-offline-sale", handleNewSale);
    };
  }, []);

  // Función para sincronizar ventas pendientes
  const syncPendingSales = async () => {
    try {
      const raw = localStorage.getItem("masapos-pending-sales");
      if (!raw) return;

      const pending = JSON.parse(raw);
      if (!Array.isArray(pending) || pending.length === 0) return;

      for (const sale of pending) {
        try {
          await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sale),
          });
        } catch (err) {
          // Si falla la sincronización, lo dejamos para después
          break;
        }
      }

      localStorage.removeItem("masapos-pending-sales");
      localStorage.setItem("masapos-offline-sales-count", "0");
      setSavedSales(0);
      setLastSyncAt(new Date().toLocaleString("es-MX"));
    } catch (err) {
      console.warn("Error syncing pending sales:", err);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, lastSyncAt, savedSales }}>
      {children}
    </OfflineContext.Provider>
  );
}

// Hook para guardar una venta offline
export function saveSaleOffline(saleData: any) {
  try {
    // Guardar en localStorage
    const raw = localStorage.getItem("masapos-pending-sales");
    const pending = raw ? JSON.parse(raw) : [];
    pending.push(saleData);
    localStorage.setItem("masapos-pending-sales", JSON.stringify(pending));

    // Actualizar contador
    const count = pending.length;
    localStorage.setItem("masapos-offline-sales-count", String(count));

    // Disparar evento
    window.dispatchEvent(new CustomEvent("masapos-offline-sale", { detail: { count } }));

    return { saved: true, count };
  } catch (err) {
    console.error("Error saving offline sale:", err);
    return { saved: false, count: 0 };
  }
}
