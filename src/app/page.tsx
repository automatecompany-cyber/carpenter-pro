import Link from "next/link";
import { db } from "@/db";
import { inventoryItems, projects, projectMaterials } from "@/db/schema";
import { eq, lte, sql, desc } from "drizzle-orm";

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

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Projects"
          value={data.activeProjects.length}
          color="var(--color-primary)"
        />
        <StatCard
          label="Planning"
          value={data.planningProjects.length}
          color="var(--color-warning)"
        />
        <StatCard
          label="Inventory Items"
          value={data.totalItems}
          color="var(--color-success)"
        />
        <StatCard
          label="Inventory Value"
          value={`$${data.totalInventoryValue.toFixed(2)}`}
          color="var(--color-accent)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <Link
              href="/inventory"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">
              All items are well-stocked.
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
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">
              No projects yet.{" "}
              <Link
                href="/projects"
                className="text-[var(--color-primary)] hover:underline"
              >
                Create one
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
  const colors: Record<string, string> = {
    planning: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    on_hold: "bg-gray-100 text-gray-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
