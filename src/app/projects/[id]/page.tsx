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

interface Assignment {
  id: number;
  employeeId: number;
  employeeName: string;
  assignedAt: string;
}

interface Worker {
  id: number;
  name: string;
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

const STATUS_LABELS: Record<string, string> = {
  planning: "Planung",
  in_progress: "In Arbeit",
  on_hold: "Pausiert",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-900/50 text-yellow-300",
  in_progress: "bg-blue-900/50 text-blue-300",
  on_hold: "bg-gray-700/50 text-gray-300",
  completed: "bg-green-900/50 text-green-300",
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  useEffect(() => {
    fetchProject();
    fetchInventory();
    fetchAssignments();
    fetchWorkers();
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

  async function fetchAssignments() {
    const res = await fetch(`/api/projects/${id}/assignments`);
    if (res.ok) {
      setAssignments(await res.json());
    }
  }

  async function fetchWorkers() {
    const res = await fetch("/api/employees");
    if (res.ok) {
      const allEmployees = await res.json();
      setWorkers(allEmployees.filter((e: { role: string }) => e.role === "worker"));
    }
  }

  async function assignWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkerId) return;

    await fetch(`/api/projects/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selectedWorkerId }),
    });

    setSelectedWorkerId("");
    fetchAssignments();
  }

  async function removeAssignment(assignmentId: number) {
    await fetch(`/api/projects/${id}/assignments?assignmentId=${assignmentId}`, {
      method: "DELETE",
    });
    fetchAssignments();
  }

  if (loading) {
    return <div className="text-[var(--color-muted)]">Projekt wird geladen...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--color-muted)]">Projekt nicht gefunden</p>
        <Link
          href="/projects"
          className="text-[var(--color-primary)] hover:underline mt-2 inline-block"
        >
          Zurück zu Projekte
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
        &larr; Zurück zu Projekte
      </Link>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-[var(--color-muted)]">{project.clientName}</p>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {project.clientAddress && (
            <div>
              <span className="text-[var(--color-muted)]">Adresse:</span>
              <p>{project.clientAddress}</p>
            </div>
          )}
          {project.clientPhone && (
            <div>
              <span className="text-[var(--color-muted)]">Telefon:</span>
              <p>{project.clientPhone}</p>
            </div>
          )}
          {project.clientEmail && (
            <div>
              <span className="text-[var(--color-muted)]">E-Mail:</span>
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
              <span className="text-[var(--color-muted)]">Ende:</span>
              <p>{project.endDate}</p>
            </div>
          )}
        </div>

        {project.notes && (
          <div className="mt-4 text-sm">
            <span className="text-[var(--color-muted)]">Notizen:</span>
            <p className="mt-1">{project.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Materialliste</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Geschätzte Kosten:{" "}
            <span className="font-semibold text-[var(--color-foreground)]">
              {totalMaterialCost.toFixed(2)} €
            </span>
          </p>
        </div>

        <form
          onSubmit={addMaterial}
          className="flex gap-3 mb-4 items-end flex-wrap"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              Inventar-Artikel
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            >
              <option value="">Artikel auswählen...</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unit} verfügbar)
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Benötigt</label>
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
            Hinzufügen
          </button>
        </form>

        {project.materials.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm py-4">
            Noch keine Materialien zugewiesen.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-medium">Material</th>
                <th className="text-left py-2 font-medium">Kategorie</th>
                <th className="text-right py-2 font-medium">Benötigt</th>
                <th className="text-right py-2 font-medium">Verbraucht</th>
                <th className="text-right py-2 font-medium">Kosten</th>
                <th className="text-right py-2 font-medium">Aktionen</th>
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
                    {CATEGORY_LABELS[mat.itemCategory] || mat.itemCategory}
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
                    {(mat.quantityNeeded * mat.itemUnitCost).toFixed(2)} €
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeMaterial(mat.id)}
                      className="text-[var(--color-danger)] hover:underline text-xs"
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Worker Assignments */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Zugewiesene Mitarbeiter</h2>

        <form onSubmit={assignWorker} className="flex gap-3 mb-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Mitarbeiter zuweisen</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-input)]"
            >
              <option value="">Mitarbeiter auswählen...</option>
              {workers
                .filter((w) => !assignments.some((a) => a.employeeId === w.id))
                .map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
          >
            Zuweisen
          </button>
        </form>

        {assignments.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm py-4">
            Noch keine Mitarbeiter zugewiesen.
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between py-2 px-3 bg-[var(--color-background)] rounded-lg"
              >
                <div>
                  <span className="font-medium">{assignment.employeeName}</span>
                  <span className="text-xs text-[var(--color-muted)] ml-2">
                    seit {new Date(assignment.assignedAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <button
                  onClick={() => removeAssignment(assignment.id)}
                  className="text-[var(--color-danger)] hover:underline text-xs"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
