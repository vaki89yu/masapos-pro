"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  BarChart3,
  Flame,
  Package,
  Wallet,
  Users,
  Volume2,
  VolumeX,
  Clock,
  RotateCcw,
  Sparkles,
  Store,
  Bike,
} from "lucide-react";
import { getAudioEnabled, setAudioEnabled, playPosBeep } from "@/lib/sound";

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  openShift: {
    id: number;
    cashierName: string;
    initialCash: string | number;
  } | null;
  onRefreshData: () => void;
  isSeeding?: boolean;
}

export default function Navbar({
  activeTab,
  onSelectTab,
  openShift,
  onRefreshData,
  isSeeding,
}: NavbarProps) {
  const [audioOn, setAudioOn] = useState<boolean>(true);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    setAudioOn(getAudioEnabled());
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleString("es-MX", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    setAudioEnabled(next);
    if (next) playPosBeep("scan");
  };

  const tabs = [
    { id: "pos", label: "Mostrador (1kg a 10kg)", icon: ShoppingCart },
    { id: "dashboard", label: "Dashboard • Tienda vs Moto", icon: BarChart3 },
    { id: "production", label: "Molino & Nixtamal", icon: Flame },
    { id: "inventory", label: "Almacén de Masa", icon: Package },
    { id: "shift", label: "Corte de Caja", icon: Wallet },
    { id: "customers", label: "Taquerías & Crédito", icon: Users },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none print:hidden">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-2xl">
            🌽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-400 bg-clip-text text-transparent">
                MASAPOS PRO
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Molino de Masa
              </span>
            </div>
            <div className="text-xs text-slate-300 font-semibold flex items-center gap-3 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Store className="w-3.5 h-3.5" /> En Tienda: <strong>$10.00 / kg</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Bike className="w-3.5 h-3.5" /> Reparto en Moto: <strong>$11.00 / kg</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Status badges & Controls */}
        <div className="flex items-center gap-3">
          {/* Shift status badge */}
          <div
            onClick={() => onSelectTab("shift")}
            className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
              openShift
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                openShift ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span className="hidden md:inline">
              {openShift ? `Turno Abierto (${openShift.cashierName.split(" ")[0]})` : "Caja Cerrada"}
            </span>
            <span className="md:hidden">{openShift ? "Caja Abierta" : "Caja Cerrada"}</span>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTimeStr || "Cargando..."}</span>
          </div>

          {/* Sound Beep Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-2 rounded-xl border transition-all ${
              audioOn
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title={audioOn ? "Sonido de escáner activado" : "Sonido desactivado"}
          >
            {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Seed/Refresh Button */}
          <button
            onClick={onRefreshData}
            disabled={isSeeding}
            className="p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Recargar catálogo de masa y tarifas"
          >
            <RotateCcw className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs / Navegación */}
      <div className="bg-slate-950/80 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTab(t.id);
                  playPosBeep("scan");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSel
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? "text-slate-950" : "text-amber-400/80"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
