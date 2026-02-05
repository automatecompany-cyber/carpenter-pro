import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { requireAuth, isAuthorized } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const allEmployees = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
    })
    .from(employees);

  return NextResponse.json(allEmployees);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const body = await request.json();
  const passwordHash = await hashPassword(body.password);

  const [employee] = await db
    .insert(employees)
    .values({
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role || "worker",
    })
    .returning();

  return NextResponse.json(
    { id: employee.id, name: employee.name, email: employee.email, role: employee.role },
    { status: 201 }
  );
}
