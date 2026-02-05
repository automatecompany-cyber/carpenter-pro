"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { InventoryItem } from "@/db/schema";

interface OrderItemEntry {
  id: number;
  inventoryItemId: number;
  quantity: number;
  unitCost: number;
  itemName: string;
  itemUnit: string;
  itemCategory: string;
}

interface OrderDetail {
  id: number;
  supplier: string;
  status: string;
  orderDate: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  items: OrderItemEntry[];
}

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

const CATEGORY_LABELS: Record<string, string> = {
  lumber: "Holz",
  hardware: "Beschläge",
  fasteners: "Befestigungen",
  adhesives: "Klebstoffe",
  finishes: "Oberflächenmittel",
  other: "Sonstiges",
};

const STATUSES = ["draft", "ordered", "received", "cancelled"] as const;

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchInventory();
  }, []);

  async function fetchOrder() {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) {
      setOrder(await res.json());
    }
    setLoading(false);
  }

  async function fetchInventory() {
    const res = await fetch("/api/inventory");
    setInventory(await res.json());
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId) return;

    await fetch(`/api/orders/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryItemId: selectedItemId,
        quantity: qty || 0,
        unitCost: cost || 0,
      }),
    });

    setSelectedItemId("");
    setQty("");
    setCost("");
    fetchOrder();
  }

  async function removeItem(itemId: number) {
    await fetch(`/api/orders/${id}/items?itemId=${itemId}`, {
      method: "DELETE",
    });
    fetchOrder();
  }

  async function updateStatus(newStatus: string) {
    if (!order) return;

    if (newStatus === "received") {
      if (!confirm("Bestellung als eingegangen markieren? Die Mengen werden automatisch zum Inventar hinzugefügt.")) {
        return;
      }
    }

    setUpdating(true);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        status: newStatus,
      }),
    });
    await fetchOrder();
    setUpdating(false);
  }

  // Auto-fill cost when selecting an inventory item
  function handleItemSelect(itemId: string) {
    setSelectedItemId(itemId);
    const item = inventory.find((i) => i.id === Number(itemId));
    if (item) {
      setCost(String(item.unitCost));
    }
  }

  if (loading) {
    return <div className="text-[var(--color-muted)]">Bestellung wird geladen...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--color-muted)]">Bestellung nicht gefunden</p>
        <Link href="/orders" className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
          Zurück zu Bestellungen
        </Link>
      </div>
    );
  }

  const totalCost = order.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const isEditable = order.status === "draft" || order.status === "ordered";

  return (
    <div>
      <Link href="/orders" className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block">
        &larr; Zurück zu Bestellungen
      </Link>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Bestellung #{order.id}</h1>
            <p className="text-[var(--color-muted)]">{order.supplier}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
          {order.orderDate && (
            <div>
              <span className="text-[var(--color-muted)]">Bestelldatum:</span>
              <p>{order.orderDate}</p>
            </div>
          )}
          {order.expectedDate && (
            <div>
              <span className="text-[var(--color-muted)]">Erwartet:</span>
              <p>{order.expectedDate}</p>
            </div>
          )}
          {order.receivedDate && (
            <div>
              <span className="text-[var(--color-muted)]">Eingegangen:</span>
              <p>{order.receivedDate}</p>
            </div>
          )}
        </div>

        {order.notes && (
          <p className="text-sm text-[var(--color-muted)] mb-4">{order.notes}</p>
        )}

        {/* Status actions */}
        <div className="flex gap-2 flex-wrap">
          {order.status === "draft" && (
            <button
              onClick={() => updateStatus("ordered")}
              disabled={updating || order.items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Als bestellt markieren
            </button>
          )}
          {order.status === "ordered" && (
            <button
              onClick={() => updateStatus("received")}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Wareneingang bestätigen
            </button>
          )}
          {isEditable && (
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              className="px-4 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] rounded-lg hover:bg-red-900/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Stornieren
            </button>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bestellpositionen</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Gesamtkosten:{" "}
            <span className="font-semibold text-[var(--color-foreground)]">
              {totalCost.toFixed(2)} €
            </span>
          </p>
        </div>

        {isEditable && (
          <form onSubmit={addItem} className="flex gap-3 mb-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Artikel</label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              >
                <option value="">Artikel auswählen...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium mb-1">Menge</label>
              <input
                type="number"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium mb-1">Stückpreis €</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
            >
              Hinzufügen
            </button>
          </form>
        )}

        {order.items.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm py-4">
            Noch keine Artikel in dieser Bestellung.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-medium">Artikel</th>
                <th className="text-left py-2 font-medium">Kategorie</th>
                <th className="text-right py-2 font-medium">Menge</th>
                <th className="text-right py-2 font-medium">Stückpreis</th>
                <th className="text-right py-2 font-medium">Gesamt</th>
                {isEditable && <th className="text-right py-2 font-medium">Aktionen</th>}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2">{item.itemName}</td>
                  <td className="py-2 text-[var(--color-muted)]">
                    {CATEGORY_LABELS[item.itemCategory] || item.itemCategory}
                  </td>
                  <td className="py-2 text-right">
                    {item.quantity} {item.itemUnit}
                  </td>
                  <td className="py-2 text-right">{item.unitCost.toFixed(2)} €</td>
                  <td className="py-2 text-right font-medium">
                    {(item.quantity * item.unitCost).toFixed(2)} €
                  </td>
                  {isEditable && (
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[var(--color-danger)] hover:underline text-xs"
                      >
                        Entfernen
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {order.status === "received" && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg text-sm text-green-300">
            Diese Bestellung wurde am {order.receivedDate} als eingegangen markiert. Die Mengen wurden automatisch zum Inventar hinzugefügt.
          </div>
        )}
      </div>
    </div>
  );
}
