import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthorized(auth)) return auth;

  const items = await db.select().from(inventoryItems);
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["boss"]);
  if (!isAuthorized(auth)) return auth;

  const body = await request.json();

  const [item] = await db
    .insert(inventoryItems)
    .values({
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity) || 0,
      unit: body.unit || "pcs",
      unitCost: Number(body.unitCost) || 0,
      supplier: body.supplier || null,
      reorderThreshold: Number(body.reorderThreshold) || 5,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
