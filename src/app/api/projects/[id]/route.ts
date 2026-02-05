import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectMaterials, inventoryItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, Number(id)));

  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  const materials = await db
    .select({
      id: projectMaterials.id,
      quantityNeeded: projectMaterials.quantityNeeded,
      quantityUsed: projectMaterials.quantityUsed,
      inventoryItemId: projectMaterials.inventoryItemId,
      itemName: inventoryItems.name,
      itemUnit: inventoryItems.unit,
      itemUnitCost: inventoryItems.unitCost,
      itemCategory: inventoryItems.category,
    })
    .from(projectMaterials)
    .innerJoin(
      inventoryItems,
      eq(projectMaterials.inventoryItemId, inventoryItems.id)
    )
    .where(eq(projectMaterials.projectId, Number(id)));

  return NextResponse.json({ ...project, materials });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const [project] = await db
    .update(projects)
    .set({
      name: body.name,
      clientName: body.clientName,
      clientAddress: body.clientAddress || null,
      clientPhone: body.clientPhone || null,
      clientEmail: body.clientEmail || null,
      status: body.status,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      notes: body.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(projects.id, Number(id)))
    .returning();

  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, Number(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
