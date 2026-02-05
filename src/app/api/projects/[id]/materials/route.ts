import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMaterials } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  const [updated] = await db
    .update(projectMaterials)
    .set({
      quantityNeeded: Number(body.quantityNeeded),
      quantityUsed: Number(body.quantityUsed),
    })
    .where(eq(projectMaterials.id, Number(body.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
