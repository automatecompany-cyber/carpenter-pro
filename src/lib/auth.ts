import { cookies } from "next/headers";
import { db } from "@/db";
import { employees, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export type Role = "boss" | "manager" | "worker";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

// Generate a simple random session ID
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Hash password using built-in crypto
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.AUTH_SECRET || "fallback-secret"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Get current session from cookie (for server components)
export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  const [result] = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      expiresAt: sessions.expiresAt,
      isActive: employees.isActive,
    })
    .from(sessions)
    .innerJoin(employees, eq(sessions.employeeId, employees.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date().toISOString())
      )
    );

  if (!result || !result.isActive) return null;

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role as Role,
  };
}

// Create a new session
export async function createSession(employeeId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    employeeId,
    expiresAt,
  });

  return sessionId;
}

// Delete session (logout)
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
