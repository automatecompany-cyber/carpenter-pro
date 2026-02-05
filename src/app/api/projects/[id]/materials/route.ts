import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMaterials, inventoryItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [material] = await db
    .insert(projectMaterials)
    .values({
      projectId: Number(id),
      inventoryItemId: Number(body.inventoryItemId),
      quantityNeeded: Number(body.quantityNeeded) || 0,
      quantityUsed: Number(body.quantityUsed) || 0,
    })
    .returning();

  return NextResponse.json(material, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get("materialId");

  if (!materialId) {
    return NextResponse.json(
      { error: "materialId is required" },
      { status: 400 }
    );
  }

  const [deleted] = await db
    .delete(projectMaterials)
    .where(eq(projectMaterials.id, Number(materialId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const newUsed = Number(body.quantityUsed);

  // Get current value to calculate the difference
  const [existing] = await db
    .select()
    .from(projectMaterials)
    .where(eq(projectMaterials.id, Number(body.id)));

  if (!existing) {
    return NextResponse.json({ error: "Material nicht gefunden" }, { status: 404 });
  }

  const oldUsed = existing.quantityUsed;
  const diff = newUsed - oldUsed;

  const [updated] = await db
    .update(projectMaterials)
    .set({
      quantityNeeded: Number(body.quantityNeeded),
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
