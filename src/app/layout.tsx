import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "CarpenterPro - Inventar & Projektverwaltung",
  description: "Verwalten Sie Ihr Schreinerei-Inventar und Ihre Projekte",
};

const ROLE_LABELS: Record<string, string> = {
  boss: "Chef",
  manager: "Projektleiter",
  worker: "Mitarbeiter",
};

function getNavigationLinks(role: string) {
  if (role === "boss") {
    return [
      { href: "/", label: "Dashboard", icon: "📊" },
      { href: "/inventory", label: "Inventar", icon: "📦" },
      { href: "/orders", label: "Bestellungen", icon: "🛒" },
      { href: "/projects", label: "Projekte", icon: "🔨" },
      { href: "/reports", label: "Monatsübersicht", icon: "📈" },
      { href: "/employees", label: "Mitarbeiter", icon: "👥" },
      { href: "/attendance", label: "Anwesenheit", icon: "📅" },
    ];
  }

  if (role === "manager") {
    return [
      { href: "/", label: "Dashboard", icon: "📊" },
      { href: "/inventory", label: "Inventar", icon: "📦" },
      { href: "/projects", label: "Projekte", icon: "🔨" },
      { href: "/reports", label: "Monatsübersicht", icon: "📈" },
    ];
  }

  // Worker
  return [
    { href: "/my-projects", label: "Meine Projekte", icon: "🔨" },
  ];
}

async function Sidebar() {
  const user = await getSession();

  if (!user) return null;

  const links = getNavigationLinks(user.role);

  return (
    <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">
          CarpenterPro
        </h1>
        <p className="text-xs text-[var(--color-muted)]">
          Inventar & Projektverwaltung
        </p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-background)] transition-colors"
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] pt-4 mt-4">
        <div className="px-3 mb-2">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <html lang="de">
      <body className={user ? "flex" : ""}>
        {user && <Sidebar />}
        <main className={user ? "flex-1 p-8 overflow-auto min-h-screen" : ""}>
          {children}
        </main>
      </body>
    </html>
  );
}
