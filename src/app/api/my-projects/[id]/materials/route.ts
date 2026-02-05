import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMaterials, inventoryItems, projectAssignments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["worker"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const newUsed = Number(body.quantityUsed);

  // Check if this worker is assigned to this project
  const [assignment] = await db
    .select()
    .from(projectAssignments)
    .where(
      and(
        eq(projectAssignments.projectId, projectId),
        eq(projectAssignments.employeeId, auth.user.id)
      )
    );

  if (!assignment) {
    return NextResponse.json(
      { error: "Nicht berechtigt Materialien zu aktualisieren" },
      { status: 403 }
    );
  }

  // Get current value to calculate the difference
  const [existing] = await db
    .select()
    .from(projectMaterials)
    .where(eq(projectMaterials.id, Number(body.id)));

  if (!existing) {
    return NextResponse.json({ error: "Material nicht gefunden" }, { status: 404 });
  }

  // Verify material belongs to this project
  if (existing.projectId !== projectId) {
    return NextResponse.json({ error: "Material gehört nicht zu diesem Projekt" }, { status: 403 });
  }

  const oldUsed = existing.quantityUsed;
  const diff = newUsed - oldUsed;

  const [updated] = await db
    .update(projectMaterials)
    .set({
      quantityUsed: newUsed,
    })
    .where(eq(projectMaterials.id, Number(body.id)))
    .returning();

  // Deduct the difference from inventory (positive diff = more used = deduct)
  if (diff !== 0) {
    await db
      .update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} - ${diff}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventoryItems.id, existing.inventoryItemId));
  }

  return NextResponse.json(updated);
}
