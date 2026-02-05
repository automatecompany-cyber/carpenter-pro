import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.role !== undefined) updates.role = body.role;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.password) {
    updates.passwordHash = await hashPassword(body.password);
  }

  const [updated] = await db
    .update(employees)
    .set(updates)
    .where(eq(employees.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
  });
}
