"use client";

import { useState, useEffect } from "react";
import type { InventoryItem } from "@/db/schema";

const CATEGORIES = [
  "lumber",
  "hardware",
  "fasteners",
  "adhesives",
  "finishes",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  lumber: "Holz",
  hardware: "Beschläge",
  fasteners: "Befestigungen",
  adhesives: "Klebstoffe",
  finishes: "Oberflächenmittel",
  other: "Sonstiges",
};

const EMPTY_FORM = {
  name: "",
  category: "lumber" as string,
  quantity: "",
  unit: "Stk",
  unitCost: "",
  supplier: "",
  reorderThreshold: "5",
  notes: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId
      ? `/api/inventory/${editingId}`
      : "/api/inventory";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    fetchItems();
  }

  async function handleDelete(id: number) {
    if (!confirm("Diesen Artikel löschen?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    fetchItems();
  }

  function startEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      unitCost: String(item.unitCost),
      supplier: item.supplier || "",
      reorderThreshold: String(item.reorderThreshold),
      notes: item.notes || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  const filtered = items.filter((item) => {
    const matchCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return <div className="text-[var(--color-muted)]">Inventar wird geladen...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventar</h1>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
        >
          + Artikel hinzufügen
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Artikel suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm flex-1 max-w-xs"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
        >
          <option value="all">Alle Kategorien</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Artikel bearbeiten" : "Neuer Artikel"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Menge</label>
              <input
                type="number"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Einheit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Stk, m, kg, L..."
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stückpreis (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lieferant</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mindestbestand</label>
              <input
                type="number"
                value={form.reorderThreshold}
                onChange={(e) =>
                  setForm({ ...form, reorderThreshold: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notizen</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
              >
                {editingId ? "Aktualisieren" : "Hinzufügen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-background)] transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <p className="text-lg mb-2">Keine Artikel gefunden</p>
          <p className="text-sm">Fügen Sie Ihren ersten Artikel hinzu.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Kategorie</th>
                <th className="text-right px-4 py-3 font-medium">Menge</th>
                <th className="text-left px-4 py-3 font-medium">Einheit</th>
                <th className="text-right px-4 py-3 font-medium">Stückpreis</th>
                <th className="text-right px-4 py-3 font-medium">Gesamtwert</th>
                <th className="text-left px-4 py-3 font-medium">Lieferant</th>
                <th className="text-right px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.quantity <= item.reorderThreshold && (
                        <span
                          className="w-2 h-2 rounded-full bg-[var(--color-danger)] flex-shrink-0"
                          title="Niedriger Bestand"
                        />
                      )}
                      {item.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.unitCost.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {(item.quantity * item.unitCost).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {item.supplier || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-[var(--color-primary)] hover:underline mr-3"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[var(--color-danger)] hover:underline"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
