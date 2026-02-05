import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectAssignments, projectMaterials, inventoryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["worker"]);
  if (!isAuthorized(auth)) return auth;

  const { id } = await params;
  const projectId = Number(id);

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
      { error: "Nicht berechtigt dieses Projekt anzuzeigen" },
      { status: 403 }
    );
  }

  // Get project details
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  // Get materials
  const materials = await db
    .select({
      id: projectMaterials.id,
      inventoryItemId: projectMaterials.inventoryItemId,
      itemName: inventoryItems.name,
      itemUnit: inventoryItems.unit,
      quantityNeeded: projectMaterials.quantityNeeded,
      quantityUsed: projectMaterials.quantityUsed,
    })
    .from(projectMaterials)
    .innerJoin(inventoryItems, eq(projectMaterials.inventoryItemId, inventoryItems.id))
    .where(eq(projectMaterials.projectId, projectId));

  return NextResponse.json({
    id: project.id,
    name: project.name,
    clientName: project.clientName,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    materials,
  });
}
