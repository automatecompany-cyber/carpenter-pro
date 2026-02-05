import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [item] = await db
    .insert(orderItems)
    .values({
      orderId: Number(id),
      inventoryItemId: Number(body.inventoryItemId),
      quantity: Number(body.quantity) || 0,
      unitCost: Number(body.unitCost) || 0,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId erforderlich" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(orderItems)
    .where(eq(orderItems.id, Number(itemId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
