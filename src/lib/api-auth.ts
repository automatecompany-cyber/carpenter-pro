import { NextRequest, NextResponse } from "next/server";
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

// Get user from request cookies (for API routes)
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const sessionId = request.cookies.get("session_id")?.value;
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

// Check auth and role for API routes
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: Role[]
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "Zugriff verweigert" },
      { status: 403 }
    );
  }

  return { user };
}

// Type guard to check if result is authorized
export function isAuthorized(
  result: { user: AuthUser } | NextResponse
): result is { user: AuthUser } {
  return "user" in result;
}
