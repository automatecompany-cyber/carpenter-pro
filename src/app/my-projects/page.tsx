"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AssignedProject {
  id: number;
  name: string;
  clientName: string;
  status: string;
  startDate: string | null;
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

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  async function fetchMyProjects() {
    const res = await fetch("/api/my-projects");
    if (res.ok) {
      setProjects(await res.json());
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-[var(--color-muted)]">Projekte werden geladen...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meine Projekte</h1>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg">
          <p className="text-lg text-[var(--color-muted)] mb-2">Keine Projekte zugewiesen</p>
          <p className="text-sm text-[var(--color-muted)]">
            Wenden Sie sich an Ihren Projektleiter für Projektzuweisungen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/my-projects/${project.id}`}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary)] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold">{project.name}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[project.status]}`}
                >
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)]">{project.clientName}</p>
              {project.startDate && (
                <p className="text-xs text-[var(--color-muted)] mt-2">
                  Start: {project.startDate}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
