import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, inventoryItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss", "manager"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, Number(id)));

  if (!order) {
    return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
  }

  const items = await db
    .select({
      id: orderItems.id,
      inventoryItemId: orderItems.inventoryItemId,
      quantity: orderItems.quantity,
      unitCost: orderItems.unitCost,
      itemName: inventoryItems.name,
      itemUnit: inventoryItems.unit,
      itemCategory: inventoryItems.category,
    })
    .from(orderItems)
    .innerJoin(inventoryItems, eq(orderItems.inventoryItemId, inventoryItems.id))
    .where(eq(orderItems.orderId, Number(id)));

  return NextResponse.json({ ...order, items });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  // Check if status is changing to "received"
  const [existing] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, Number(id)));

  if (!existing) {
    return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
  }

  const isBeingReceived = existing.status !== "received" && body.status === "received";

  const [order] = await db
    .update(orders)
    .set({
      supplier: body.supplier,
      status: body.status,
      orderDate: body.orderDate || null,
      expectedDate: body.expectedDate || null,
      receivedDate: isBeingReceived ? new Date().toISOString().split("T")[0] : body.receivedDate || null,
      notes: body.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(orders.id, Number(id)))
    .returning();

  // If order is being received, add quantities to inventory
  if (isBeingReceived) {
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, Number(id)));

    for (const item of items) {
      await db
        .update(inventoryItems)
        .set({
          quantity: sql`${inventoryItems.quantity} + ${item.quantity}`,
          unitCost: item.unitCost,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(inventoryItems.id, item.inventoryItemId));
    }
  }

  return NextResponse.json(order);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;

  const [deleted] = await db
    .delete(orders)
    .where(eq(orders.id, Number(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
