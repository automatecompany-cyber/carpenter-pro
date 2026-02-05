"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-3 py-2 text-left text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] rounded-lg transition-colors"
    >
      Abmelden
    </button>
  );
}
