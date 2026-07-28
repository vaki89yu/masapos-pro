"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  AlertTriangle,
  Barcode,
  X,
  Check,
  Filter,
  DollarSign,
} from "lucide-react";
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

interface InventoryManagerProps {
  products: Product[];
  onProductUpdated: () => void;
}

export default function InventoryManager({
  products,
  onProductUpdated,
}: InventoryManagerProps) {
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Edit / Create modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form Fields
  const [barcode, setBarcode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("masa_blanco");
  const [unit, setUnit] = useState<string>("kg");
  const [price, setPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [minStockAlert, setMinStockAlert] = useState<string>("20");
  const [isBulk, setIsBulk] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const categories = [
    { id: "all", label: "✨ Todas las Masas" },
    { id: "masa_blanco", label: "🌽 Masa Blanco" },
    { id: "masa_tamal", label: "🫔 Masa para Tamal" },
    { id: "masa_amarillo", label: "🌮 Masa Amarillo" },
    { id: "masa_especial", label: "🥟 Masa Azul & Hojas" },
    { id: "nixtamal", label: "🌾 Nixtamal y Maíz" },
  ];

  const filteredProducts = products.filter((p) => {
    const catMatch = categoryFilter === "all" || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const qMatch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));

    return catMatch && qMatch;
  });

  // Calculate total warehouse valuation
  const totalValuation = products.reduce(
    (sum, p) => sum + Number(p.stock || 0) * Number(p.costPrice || 0),
    0
  );

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setBarcode(String(100000000000 + Math.floor(Math.random() * 99999)));
    setName("");
    setDescription("");
    setCategory("masa_blanco");
    setUnit("kg");
    setPrice("24.00");
    setCostPrice("15.00");
    setStock("100.000");
    setMinStockAlert("20.000");
    setIsBulk(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setEditId(p.id);
    setBarcode(p.barcode);
    setName(p.name);
    setDescription(p.description || "");
    setCategory(p.category);
    setUnit(p.unit);
    setPrice(String(p.price));
    setCostPrice(String(p.costPrice));
    setStock(String(p.stock));
    setMinStockAlert(String(p.minStockAlert));
    setIsBulk(p.isBulk);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !name || !price) return;

    try {
      setSubmitting(true);
      if (isEditing && editId) {
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            barcode,
            name,
            description,
            category,
            unit,
            price,
            costPrice,
            stock,
            minStockAlert,
            isBulk,
          }),
        });
        if (res.ok) {
          playPosBeep("checkout");
          setModalOpen(false);
          onProductUpdated();
        } else {
          alert("Error al actualizar producto.");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode,
            name,
            description,
            category,
            unit,
            price,
            costPrice,
            stock,
            minStockAlert,
            isBulk,
          }),
        });
        if (res.ok) {
          playPosBeep("checkout");
          setModalOpen(false);
          onProductUpdated();
        } else {
          const err = await res.json();
          alert(err.error || "Error al crear el producto.");
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
      alert("Error en el servidor al procesar el producto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER ALMACÉN */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Catálogo de Masas & Inventario de Molino
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {products.length} productos de masa y maíz registrados • Valoración aprox:{" "}
              <strong className="text-emerald-400 font-mono">
                ${totalValuation.toFixed(2)}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Masa / Producto</span>
        </button>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre o código en molino..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                categoryFilter === cat.id
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE PRODUCTOS EN INVENTARIO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">Listado de Masas y Nixtamal</h3>
          <span className="text-xs text-slate-400">
            {filteredProducts.length} resultados encontrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="pb-3 font-semibold">Código / Barcode</th>
                <th className="pb-3 font-semibold">Producto de Masa</th>
                <th className="pb-3 font-semibold">Categoría</th>
                <th className="pb-3 font-semibold text-right">Precio / Kilo</th>
                <th className="pb-3 font-semibold text-right">Costo</th>
                <th className="pb-3 font-semibold text-right">Margen</th>
                <th className="pb-3 font-semibold text-right">Existencia</th>
                <th className="pb-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const priceNum = Number(p.price || 0);
                const costNum = Number(p.costPrice || 0);
                const margin = priceNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : 0;
                const stockNum = Number(p.stock || 0);
                const isLow = stockNum <= Number(p.minStockAlert || 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono text-xs text-slate-400">
                      {p.barcode}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded uppercase">
                        {p.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-extrabold text-amber-400">
                      ${priceNum.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        /{p.unit.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-xs text-slate-400">
                      ${costNum.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono text-xs text-emerald-400">
                      {margin.toFixed(0)}%
                    </td>
                    <td className="py-3 text-right font-mono">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs ${
                          isLow
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                            : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {stockNum.toFixed(p.unit === "pz" ? 0 : 1)} {p.unit.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Editar o ajustar existencia"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    No se encontraron productos con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO / EDITAR PRODUCTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {isEditing ? "Editar Masa & Existencia" : "Registrar Nueva Masa / Nixtamal"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-black/20 rounded-lg text-amber-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Código en Molino:
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Categoría de Masa:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="masa_blanco">🌽 Masa Blanco (Tortilla)</option>
                    <option value="masa_tamal">🫔 Masa para Tamal</option>
                    <option value="masa_amarillo">🌮 Masa Amarillo (Antojitos)</option>
                    <option value="masa_especial">🥟 Masa Azul & Hojas</option>
                    <option value="nixtamal">🌾 Nixtamal y Maíz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nombre del Producto de Masa:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Masa para Tamal Dulce..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Descripción corta (opcional):
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Unidad:
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      setIsBulk(e.target.value === "kg" || e.target.value === "l");
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white font-mono"
                  >
                    <option value="kg">Kilo (KG)</option>
                    <option value="pz">Pieza / Manoja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Precio Venta ($):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Costo Maíz/Molino ($):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Stock en Molino:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Alerta Mínima Stock:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-rose-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bulkChk"
                  checked={isBulk}
                  onChange={(e) => setIsBulk(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-amber-500"
                />
                <label htmlFor="bulkChk" className="text-xs text-slate-300 cursor-pointer">
                  Producto a granel por kilo (Habilita selectores rápidos del 1 kg al 10 kg en caja)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-sm font-bold shadow-lg"
                >
                  {isEditing ? "Guardar Cambios" : "Crear Masa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
