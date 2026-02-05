import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";

export async function GET() {
  const allOrders = await db.select().from(orders);
  return NextResponse.json(allOrders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const [order] = await db
    .insert(orders)
    .values({
      supplier: body.supplier,
      status: body.status || "draft",
      orderDate: body.orderDate || null,
      expectedDate: body.expectedDate || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(order, { status: 201 });
}
