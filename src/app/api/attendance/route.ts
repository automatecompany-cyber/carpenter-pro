import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const records = await db
    .select({
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: employees.name,
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      notes: attendance.notes,
    })
    .from(attendance)
    .innerJoin(employees, eq(attendance.employeeId, employees.id))
    .where(eq(attendance.date, date));

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const body = await request.json();

  // Check if record exists for this employee/date
  const [existing] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, body.employeeId),
        eq(attendance.date, body.date)
      )
    );

  if (existing) {
    // Update existing record
    const [updated] = await db
      .update(attendance)
      .set({
        checkIn: body.checkIn !== undefined ? body.checkIn : existing.checkIn,
        checkOut: body.checkOut !== undefined ? body.checkOut : existing.checkOut,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      })
      .where(eq(attendance.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  }

  // Create new record
  const [record] = await db
    .insert(attendance)
    .values({
      employeeId: body.employeeId,
      date: body.date,
      checkIn: body.checkIn || null,
      checkOut: body.checkOut || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}
