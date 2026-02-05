import Link from "next/link";
import { db } from "@/db";
import { inventoryItems, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const activeProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "in_progress"));

  const planningProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "planning"));

  const allItems = await db.select().from(inventoryItems);
  const lowStockItems = allItems.filter(
    (item) => item.quantity <= item.reorderThreshold
  );

  const totalInventoryValue = allItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const recentProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(5);

  return {
    activeProjects,
    planningProjects,
    lowStockItems,
    totalInventoryValue,
    totalItems: allItems.length,
    recentProjects,
  };
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

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Aktive Projekte"
          value={data.activeProjects.length}
          color="var(--color-primary)"
        />
        <StatCard
          label="In Planung"
          value={data.planningProjects.length}
          color="var(--color-warning)"
        />
        <StatCard
          label="Inventar-Artikel"
          value={data.totalItems}
          color="var(--color-success)"
        />
        <StatCard
          label="Inventarwert"
          value={`${data.totalInventoryValue.toFixed(2)} €`}
          color="var(--color-accent)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Niedrige Bestände</h2>
            <Link
              href="/inventory"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">
              Alle Artikel sind ausreichend vorrätig.
            </p>
          ) : (
            <div className="space-y-2">
              {data.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {item.category}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-danger)]">
                    {item.quantity} {item.unit} übrig
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Aktuelle Projekte</h2>
            <Link
              href="/projects"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">
              Noch keine Projekte.{" "}
              <Link
                href="/projects"
                className="text-[var(--color-primary)] hover:underline"
              >
                Erstellen Sie eines
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {project.clientName}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
      <p className="text-sm text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status] || "bg-gray-700/50 text-gray-300"}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
