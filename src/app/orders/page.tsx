"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Order } from "@/db/schema";

const STATUSES = ["draft", "ordered", "received", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  ordered: "Bestellt",
  received: "Eingegangen",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-700/50 text-gray-300",
  ordered: "bg-blue-900/50 text-blue-300",
  received: "bg-green-900/50 text-green-300",
  cancelled: "bg-red-900/50 text-red-300",
};

const EMPTY_FORM = {
  supplier: "",
  status: "draft" as string,
  orderDate: "",
  expectedDate: "",
  notes: "",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const newOrder = await res.json();
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchOrders();

    // Navigate to the new order to add items
    window.location.href = `/orders/${newOrder.id}`;
  }

  async function handleDelete(id: number) {
    if (!confirm("Diese Bestellung löschen?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    fetchOrders();
  }

  const filtered = orders.filter(
    (o) => filterStatus === "all" || o.status === filterStatus
  );

  if (loading) {
    return <div className="text-[var(--color-muted)]">Bestellungen werden geladen...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bestellungen</h1>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
        >
          + Neue Bestellung
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
        >
          <option value="all">Alle Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Neue Bestellung</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lieferant *</label>
              <input
                required
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bestelldatum</label>
              <input
                type="date"
                value={form.orderDate}
                onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Erwartetes Lieferdatum</label>
              <input
                type="date"
                value={form.expectedDate}
                onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
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
                Erstellen & Artikel hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
          <p className="text-lg mb-2">Keine Bestellungen gefunden</p>
          <p className="text-sm">Erstellen Sie Ihre erste Bestellung.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                <th className="text-left px-4 py-3 font-medium">Nr.</th>
                <th className="text-left px-4 py-3 font-medium">Lieferant</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Bestelldatum</th>
                <th className="text-left px-4 py-3 font-medium">Erwartet</th>
                <th className="text-right px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] transition-colors"
                >
                  <td className="px-4 py-3">#{order.id}</td>
                  <td className="px-4 py-3 font-medium">{order.supplier}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {order.orderDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {order.expectedDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-[var(--color-primary)] hover:underline mr-3"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleDelete(order.id)}
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
