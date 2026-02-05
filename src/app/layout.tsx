import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarpenterPro - Inventory & Project Management",
  description: "Manage your carpentry business inventory and projects",
};

function Sidebar() {
  const links = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/inventory", label: "Inventory", icon: "📦" },
    { href: "/projects", label: "Projects", icon: "🔨" },
  ];

  return (
    <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-[var(--color-primary-dark)]">
          CarpenterPro
        </h1>
        <p className="text-xs text-[var(--color-muted)]">
          Inventory & Project Manager
        </p>
      </div>
      <nav className="flex flex-col gap-1">
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
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
