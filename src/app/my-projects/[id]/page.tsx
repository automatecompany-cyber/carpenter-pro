"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface MaterialEntry {
  id: number;
  inventoryItemId: number;
  itemName: string;
  itemUnit: string;
  quantityNeeded: number;
  quantityUsed: number;
}

interface ProjectDetail {
  id: number;
  name: string;
  clientName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
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

export default function MyProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchProject();
  }, []);

  async function fetchProject() {
    const res = await fetch(`/api/my-projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    }
    setLoading(false);
  }

  async function updateMaterialUsed(materialId: number, mat: MaterialEntry, newUsed: string) {
    if (updating) return;

    const newUsedNum = Number(newUsed);
    if (isNaN(newUsedNum) || newUsedNum < 0) return;
    if (newUsedNum === mat.quantityUsed) return;

    setUpdating(materialId);
    await fetch(`/api/my-projects/${id}/materials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: materialId,
        quantityNeeded: mat.quantityNeeded,
        quantityUsed: newUsedNum,
      }),
    });
    await fetchProject();
    setUpdating(null);
  }

  if (loading) {
    return <div className="text-[var(--color-muted)]">Projekt wird geladen...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--color-muted)]">Projekt nicht gefunden</p>
        <Link href="/my-projects" className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
          Zurück zu meinen Projekten
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/my-projects" className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block">
        &larr; Zurück zu meinen Projekten
      </Link>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-[var(--color-muted)]">{project.clientName}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {(project.startDate || project.endDate) && (
          <div className="flex gap-6 text-sm">
            {project.startDate && (
              <div>
                <span className="text-[var(--color-muted)]">Start:</span>
                <span className="ml-2">{project.startDate}</span>
              </div>
            )}
            {project.endDate && (
              <div>
                <span className="text-[var(--color-muted)]">Ende:</span>
                <span className="ml-2">{project.endDate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Materials */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Materialverbrauch</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Geben Sie die verbrauchte Menge ein und klicken Sie außerhalb des Feldes zum Speichern.
        </p>

        {project.materials.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm py-4">
            Keine Materialien für dieses Projekt zugewiesen.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-medium">Material</th>
                <th className="text-right py-2 font-medium">Geplant</th>
                <th className="text-right py-2 font-medium">Verbraucht</th>
                <th className="text-right py-2 font-medium">Verbleibend</th>
              </tr>
            </thead>
            <tbody>
              {project.materials.map((mat) => {
                const remaining = mat.quantityNeeded - mat.quantityUsed;
                const isOverused = remaining < 0;

                return (
                  <tr key={mat.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3">
                      <span className="font-medium">{mat.itemName}</span>
                    </td>
                    <td className="py-3 text-right text-[var(--color-muted)]">
                      {mat.quantityNeeded} {mat.itemUnit}
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        defaultValue={mat.quantityUsed}
                        onBlur={(e) => updateMaterialUsed(mat.id, mat, e.target.value)}
                        disabled={updating === mat.id}
                        className="w-20 px-2 py-1 border border-[var(--color-border)] rounded text-sm text-right bg-[var(--color-input)] disabled:opacity-50"
                      />
                      <span className="ml-1 text-[var(--color-muted)]">{mat.itemUnit}</span>
                    </td>
                    <td className={`py-3 text-right font-medium ${isOverused ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
                      {remaining.toFixed(1)} {mat.itemUnit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
