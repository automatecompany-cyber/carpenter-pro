import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [item] = await db
    .update(inventoryItems)
    .set({
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity),
      unit: body.unit,
      unitCost: Number(body.unitCost),
      supplier: body.supplier || null,
      reorderThreshold: Number(body.reorderThreshold),
      notes: body.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(inventoryItems.id, Number(id)))
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [deleted] = await db
    .delete(inventoryItems)
    .where(eq(inventoryItems.id, Number(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
