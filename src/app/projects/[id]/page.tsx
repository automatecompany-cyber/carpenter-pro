"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { InventoryItem } from "@/db/schema";

interface MaterialEntry {
  id: number;
  inventoryItemId: number;
  quantityNeeded: number;
  quantityUsed: number;
  itemName: string;
  itemUnit: string;
  itemUnitCost: number;
  itemCategory: string;
}

interface ProjectDetail {
  id: number;
  name: string;
  clientName: string;
  clientAddress: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  materials: MaterialEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  on_hold: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qtyNeeded, setQtyNeeded] = useState("");

  useEffect(() => {
    fetchProject();
    fetchInventory();
  }, []);

  async function fetchProject() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    }
    setLoading(false);
  }

  async function fetchInventory() {
    const res = await fetch("/api/inventory");
    setInventory(await res.json());
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId) return;

    await fetch(`/api/projects/${id}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryItemId: selectedItemId,
        quantityNeeded: qtyNeeded || 0,
      }),
    });

    setSelectedItemId("");
    setQtyNeeded("");
    fetchProject();
  }

  async function removeMaterial(materialId: number) {
    await fetch(`/api/projects/${id}/materials?materialId=${materialId}`, {
      method: "DELETE",
    });
    fetchProject();
  }

  async function updateMaterialUsed(materialId: number, mat: MaterialEntry, newUsed: string) {
    await fetch(`/api/projects/${id}/materials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: materialId,
        quantityNeeded: mat.quantityNeeded,
        quantityUsed: Number(newUsed) || 0,
      }),
    });
    fetchProject();
  }

  if (loading) {
    return <div className="text-[var(--color-muted)]">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--color-muted)]">Project not found</p>
        <Link
          href="/projects"
          className="text-[var(--color-primary)] hover:underline mt-2 inline-block"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const totalMaterialCost = project.materials.reduce(
    (sum, m) => sum + m.quantityNeeded * m.itemUnitCost,
    0
  );

  return (
    <div>
      <Link
        href="/projects"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        &larr; Back to projects
      </Link>

      {/* Project header */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-[var(--color-muted)]">{project.clientName}</p>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
          >
            {project.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {project.clientAddress && (
            <div>
              <span className="text-[var(--color-muted)]">Address:</span>
              <p>{project.clientAddress}</p>
            </div>
          )}
          {project.clientPhone && (
            <div>
              <span className="text-[var(--color-muted)]">Phone:</span>
              <p>{project.clientPhone}</p>
            </div>
          )}
          {project.clientEmail && (
            <div>
              <span className="text-[var(--color-muted)]">Email:</span>
              <p>{project.clientEmail}</p>
            </div>
          )}
          {project.startDate && (
            <div>
              <span className="text-[var(--color-muted)]">Start:</span>
              <p>{project.startDate}</p>
            </div>
          )}
          {project.endDate && (
            <div>
              <span className="text-[var(--color-muted)]">End:</span>
              <p>{project.endDate}</p>
            </div>
          )}
        </div>

        {project.notes && (
          <div className="mt-4 text-sm">
            <span className="text-[var(--color-muted)]">Notes:</span>
            <p className="mt-1">{project.notes}</p>
          </div>
        )}
      </div>

      {/* Material list */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Material List</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Estimated cost:{" "}
            <span className="font-semibold text-[var(--color-foreground)]">
              ${totalMaterialCost.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Add material form */}
        <form
          onSubmit={addMaterial}
          className="flex gap-3 mb-4 items-end flex-wrap"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              Inventory Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            >
              <option value="">Select an item...</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unit} available)
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Qty Needed</label>
            <input
              type="number"
              step="any"
              value={qtyNeeded}
              onChange={(e) => setQtyNeeded(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
          >
            Add
          </button>
        </form>

        {/* Materials table */}
        {project.materials.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm py-4">
            No materials assigned yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-medium">Material</th>
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Needed</th>
                <th className="text-right py-2 font-medium">Used</th>
                <th className="text-right py-2 font-medium">Cost</th>
                <th className="text-right py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.materials.map((mat) => (
                <tr
                  key={mat.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="py-2">{mat.itemName}</td>
                  <td className="py-2 text-[var(--color-muted)]">
                    {mat.itemCategory}
                  </td>
                  <td className="py-2 text-right">
                    {mat.quantityNeeded} {mat.itemUnit}
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      step="any"
                      defaultValue={mat.quantityUsed}
                      onBlur={(e) =>
                        updateMaterialUsed(mat.id, mat, e.target.value)
                      }
                      className="w-20 px-2 py-1 border border-[var(--color-border)] rounded text-right text-sm"
                    />
                  </td>
                  <td className="py-2 text-right">
                    ${(mat.quantityNeeded * mat.itemUnitCost).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeMaterial(mat.id)}
                      className="text-[var(--color-danger)] hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
