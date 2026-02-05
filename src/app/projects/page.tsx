"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Project } from "@/db/schema";

const STATUSES = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

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

const EMPTY_FORM = {
  name: "",
  clientName: "",
  clientAddress: "",
  clientPhone: "",
  clientEmail: "",
  status: "planning" as string,
  startDate: "",
  endDate: "",
  notes: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    fetchProjects();
  }

  async function handleDelete(id: number) {
    if (!confirm("Dieses Projekt und alle Materialien löschen?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  }

  function startEdit(project: Project) {
    setForm({
      name: project.name,
      clientName: project.clientName,
      clientAddress: project.clientAddress || "",
      clientPhone: project.clientPhone || "",
      clientEmail: project.clientEmail || "",
      status: project.status,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      notes: project.notes || "",
    });
    setEditingId(project.id);
    setShowForm(true);
  }

  const filtered = projects.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  if (loading) {
    return <div className="text-[var(--color-muted)]">Projekte werden geladen...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte</h1>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
        >
          + Neues Projekt
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
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Projekt bearbeiten" : "Neues Projekt"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Projektname *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Kundenname *
              </label>
              <input
                required
                type="text"
                value={form.clientName}
                onChange={(e) =>
                  setForm({ ...form, clientName: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={form.clientAddress}
                onChange={(e) =>
                  setForm({ ...form, clientAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={form.clientPhone}
                onChange={(e) =>
                  setForm({ ...form, clientPhone: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) =>
                  setForm({ ...form, clientEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enddatum</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              />
            </div>
            <div>
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
                {editingId ? "Aktualisieren" : "Erstellen"}
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
          <p className="text-lg mb-2">Keine Projekte gefunden</p>
          <p className="text-sm">Erstellen Sie Ihr erstes Projekt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary-dark)] transition-colors block"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{project.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}
                >
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)] mb-1">
                {project.clientName}
              </p>
              {project.clientAddress && (
                <p className="text-xs text-[var(--color-muted)] mb-2">
                  {project.clientAddress}
                </p>
              )}
              <div className="flex gap-4 text-xs text-[var(--color-muted)] mt-3">
                {project.startDate && <span>Start: {project.startDate}</span>}
                {project.endDate && <span>Ende: {project.endDate}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    startEdit(project);
                  }}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(project.id);
                  }}
                  className="text-xs text-[var(--color-danger)] hover:underline"
                >
                  Löschen
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
