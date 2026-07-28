"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import PosTerminal from "./PosTerminal";
import DashboardStats from "./DashboardStats";
import MasaProductionManager from "./MasaProductionManager";
import InventoryManager from "./InventoryManager";
import CashShiftManager from "./CashShiftManager";
import CustomersManager from "./CustomersManager";
import { CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Store, Bike } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";

export default function PosApp() {
  const [activeTab, setActiveTab] = useState<string>("pos");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [openShift, setOpenShift] = useState<any | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, statsRes, shiftsRes, custRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stats"),
        fetch("/api/shifts"),
        fetch("/api/customers"),
      ]);

      const prodData = await prodRes.json();
      const statsData = await statsRes.json();
      const shiftsData = await shiftsRes.json();
      const custData = await custRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (statsData.stats) setStats(statsData.stats);
      if (statsData.lowStockItems) setLowStockItems(statsData.lowStockItems);
      if (statsData.recentSales) setRecentSales(statsData.recentSales);
      if (shiftsData.openShift !== undefined) setOpenShift(shiftsData.openShift);
      if (custData.customers) setCustomers(custData.customers);
    } catch (err) {
      console.error("Error loading POS data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true);
      await fetch("/api/seed", { method: "POST" });
      await fetchAllData();
      showToast("✨ Base de datos reiniciada: Masa en Tienda ($10) & Reparto Moto ($11).");
    } catch (err) {
      console.error("Error seeding:", err);
      showToast("Error al sembrar la base de datos.");
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchAllData();
  }, [fetchAllData]);

  const handleSaleCompleted = () => {
    showToast("💵 ¡Cobro de masa registrado e inventario descontado con éxito!");
    fetchAllData();
  };

  const handleProductionAdded = () => {
    showToast("🌽 ¡Molienda registrada y kilos de masa sumados al inventario!");
    fetchAllData();
  };

  const handleProductUpdated = () => {
    showToast("📦 ¡Catálogo de masa e inventario actualizados con éxito!");
    fetchAllData();
  };

  const handleShiftChanged = () => {
    showToast("💼 ¡Turno y corte de caja actualizados!");
    fetchAllData();
  };

  const handleCustomerUpdated = () => {
    showToast("🤝 ¡Cuenta de taquería/cliente y saldo actualizados!");
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        openShift={openShift}
        onRefreshData={handleSeedDatabase}
        isSeeding={isSeeding}
      />

      {/* TOAST FLOTANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL POR PESTAÑA */}
      <main className="max-w-7xl mx-auto px-4 pt-6 flex-1 w-full">
        <ErrorBoundary>
        {loading && products.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold">
              Cargando terminal de cobro ($10 Tienda / $11 Moto) y selectores por kilo...
            </p>
          </div>
        ) : (
          <>
            {activeTab === "pos" && (
              <PosTerminal
                products={products}
                customers={customers}
                openShiftId={openShift ? openShift.id : null}
                onSaleCompleted={handleSaleCompleted}
                onNavigateShift={() => setActiveTab("shift")}
              />
            )}

            {activeTab === "dashboard" && (
              <DashboardStats
                stats={stats}
                lowStockItems={lowStockItems}
                recentSales={recentSales}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === "production" && (
              <MasaProductionManager
                products={products}
                onProductionAdded={handleProductionAdded}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryManager
                products={products}
                onProductUpdated={handleProductUpdated}
              />
            )}

            {activeTab === "shift" && (
              <CashShiftManager onShiftChanged={handleShiftChanged} />
            )}

            {activeTab === "customers" && (
              <CustomersManager
                customers={customers}
                openShiftId={openShift ? openShift.id : null}
                onCustomerUpdated={handleCustomerUpdated}
              />
            )}
          </>
        )}
        </ErrorBoundary>
      </main>

      {/* FOOTER INFORMACIÓN DEL SISTEMA */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-auto text-xs text-slate-500 select-none print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>🌽</span>
            <span className="font-bold text-slate-400">MasaPOS Pro 2026</span>
            <span>• Venta de Masa de Maíz • Tienda $10/kg & Reparto Moto $11/kg</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Tarifas: <strong className="text-emerald-400">Tienda $10</strong> | <strong className="text-amber-400">Moto $11</strong>
            </span>
            <span>
              <strong className="text-amber-400">Enter / F9</strong> Cobrar Ticket
            </span>
            <span>
              Báscula y Selectores (1 al 10 kg): <strong className="text-emerald-400">Listos</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
