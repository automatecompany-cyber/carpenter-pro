"use client";

import { useState, useEffect } from "react";

interface OrderedItem {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface ProjectMaterial {
  projectId: number;
  projectName: string;
  itemName: string;
  itemUnit: string;
  itemUnitCost: number;
  quantityUsed: number;
  quantityNeeded: number;
}

interface ReportData {
  month: string;
  orders: {
    placed: number;
    received: number;
    totalSpent: number;
    items: OrderedItem[];
  };
  materials: {
    activeProjects: number;
    totalUsedCost: number;
    totalPlannedCost: number;
    byProject: ProjectMaterial[];
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
  };
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [month]);

  async function fetchReport() {
    setLoading(true);
    const res = await fetch(`/api/reports?month=${month}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  function getMonthLabel(m: string) {
    const [year, mon] = m.split("-").map(Number);
    return `${MONTH_NAMES[mon - 1]} ${year}`;
  }

  function prevMonth() {
    const [year, mon] = month.split("-").map(Number);
    const d = new Date(year, mon - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [year, mon] = month.split("-").map(Number);
    const d = new Date(year, mon, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Group materials by project
  const materialsByProject: Record<string, ProjectMaterial[]> = {};
  if (data) {
    for (const m of data.materials.byProject) {
      if (!materialsByProject[m.projectName]) {
        materialsByProject[m.projectName] = [];
      }
      materialsByProject[m.projectName].push(m);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Monatsübersicht</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="px-3 py-1 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"
          >
            ←
          </button>
          <span className="text-lg font-semibold min-w-[180px] text-center">
            {getMonthLabel(month)}
          </span>
          <button
            onClick={nextMonth}
            className="px-3 py-1 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[var(--color-muted)]">Bericht wird geladen...</div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              label="Bestellungen eingegangen"
              value={data.orders.received}
              sub={`${data.orders.placed} aufgegeben`}
              color="var(--color-primary)"
            />
            <SummaryCard
              label="Einkaufskosten"
              value={`${data.orders.totalSpent.toFixed(2)} €`}
              sub={`${data.orders.items.length} Positionen`}
              color="var(--color-danger)"
            />
            <SummaryCard
              label="Materialverbrauch"
              value={`${data.materials.totalUsedCost.toFixed(2)} €`}
              sub={`${data.materials.activeProjects} aktive Projekte`}
              color="var(--color-warning)"
            />
            <SummaryCard
              label="Inventarwert"
              value={`${data.inventory.totalValue.toFixed(2)} €`}
              sub={`${data.inventory.lowStockCount} Artikel niedrig`}
              color="var(--color-success)"
            />
          </div>

          {/* Cost overview donut charts */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
            <h2 className="text-lg font-semibold mb-6">Kostenübersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DonutChart
                label="Einkauf"
                sub="Eingegangene Bestellungen"
                value={data.orders.totalSpent}
                total={data.orders.totalSpent + data.materials.totalUsedCost || 1}
                color="#c49a6c"
              />
              <DonutChart
                label="Geplant"
                sub="Aktive Projekte"
                value={data.materials.totalPlannedCost}
                total={data.materials.totalPlannedCost || 1}
                color="#f59e0b"
              />
              <DonutChart
                label="Verbraucht"
                sub="Materialverbrauch"
                value={data.materials.totalUsedCost}
                total={data.materials.totalPlannedCost || 1}
                color={data.materials.totalUsedCost > data.materials.totalPlannedCost ? "#ef4444" : "#22c55e"}
              />
            </div>
          </div>

          {/* Spending breakdown donut */}
          {(data.orders.totalSpent > 0 || data.materials.totalUsedCost > 0) && (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
              <h2 className="text-lg font-semibold mb-6">Kostenverteilung</h2>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <MultiDonut
                  segments={[
                    { label: "Einkauf", value: data.orders.totalSpent, color: "#c49a6c" },
                    { label: "Materialverbrauch", value: data.materials.totalUsedCost, color: "#d4a574" },
                    { label: "Inventarwert", value: data.inventory.totalValue, color: "#22c55e" },
                  ]}
                />
                <div className="flex flex-col gap-3">
                  <LegendItem color="#c49a6c" label="Einkauf" value={`${data.orders.totalSpent.toFixed(2)} €`} />
                  <LegendItem color="#d4a574" label="Materialverbrauch" value={`${data.materials.totalUsedCost.toFixed(2)} €`} />
                  <LegendItem color="#22c55e" label="Inventarwert" value={`${data.inventory.totalValue.toFixed(2)} €`} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Received orders */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4">Eingegangene Bestellungen</h2>
              {data.orders.items.length === 0 ? (
                <p className="text-[var(--color-muted)] text-sm">
                  Keine Bestellungen in diesem Monat eingegangen.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-2 font-medium">Artikel</th>
                      <th className="text-right py-2 font-medium">Menge</th>
                      <th className="text-right py-2 font-medium">Kosten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.items.map((item, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right text-[var(--color-muted)]">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 text-right font-medium">{item.cost.toFixed(2)} €</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--color-border)]">
                      <td className="py-2 font-semibold" colSpan={2}>Gesamt</td>
                      <td className="py-2 text-right font-bold">{data.orders.totalSpent.toFixed(2)} €</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Materials by project */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4">Materialverbrauch nach Projekt</h2>
              {Object.keys(materialsByProject).length === 0 ? (
                <p className="text-[var(--color-muted)] text-sm">
                  Keine aktiven Projekte mit Materialverbrauch.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(materialsByProject).map(([projectName, materials]) => {
                    const projectUsedCost = materials.reduce(
                      (sum, m) => sum + m.quantityUsed * m.itemUnitCost, 0
                    );
                    const projectPlannedCost = materials.reduce(
                      (sum, m) => sum + m.quantityNeeded * m.itemUnitCost, 0
                    );

                    return (
                      <div key={projectName}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">{projectName}</h3>
                          <span className="text-sm text-[var(--color-muted)]">
                            {projectUsedCost.toFixed(2)} € / {projectPlannedCost.toFixed(2)} €
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-[var(--color-background)] rounded-full mb-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${projectPlannedCost > 0 ? Math.min((projectUsedCost / projectPlannedCost) * 100, 100) : 0}%`,
                              backgroundColor: projectUsedCost > projectPlannedCost
                                ? "var(--color-danger)"
                                : "var(--color-primary)",
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          {materials.filter(m => m.quantityUsed > 0).map((m, i) => (
                            <div key={i} className="flex justify-between text-xs text-[var(--color-muted)]">
                              <span>{m.itemName}</span>
                              <span>{m.quantityUsed} / {m.quantityNeeded} {m.itemUnit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
      <p className="text-sm text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[var(--color-muted)] mt-1">{sub}</p>
    </div>
  );
}

function DonutChart({
  label,
  sub,
  value,
  total,
  color,
}: {
  label: string;
  sub: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="12"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{value.toFixed(0)} €</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-2">{label}</p>
      <p className="text-xs text-[var(--color-muted)]">{sub}</p>
    </div>
  );
}

function MultiDonut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="16"
        />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLength = pct * circumference;
          const gapLength = circumference - dashLength;
          const offset = -cumulativeOffset;
          cumulativeOffset += dashLength;

          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{total.toFixed(0)} €</span>
        <span className="text-xs text-[var(--color-muted)]">Gesamt</span>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex justify-between gap-4 flex-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
