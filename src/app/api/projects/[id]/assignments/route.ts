import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectAssignments, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;

  const assignments = await db
    .select({
      id: projectAssignments.id,
      employeeId: employees.id,
      employeeName: employees.name,
      assignedAt: projectAssignments.assignedAt,
    })
    .from(projectAssignments)
    .innerJoin(employees, eq(projectAssignments.employeeId, employees.id))
    .where(eq(projectAssignments.projectId, Number(id)));

  return NextResponse.json(assignments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const [assignment] = await db
    .insert(projectAssignments)
    .values({
      projectId: Number(id),
      employeeId: Number(body.employeeId),
    })
    .returning();

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId erforderlich" }, { status: 400 });
  }

  await db
    .delete(projectAssignments)
    .where(eq(projectAssignments.id, Number(assignmentId)));

  return NextResponse.json({ success: true });
}
