import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, isAuthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["worker"]);
  if (!isAuthorized(auth)) return auth;

  const assignedProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: projects.clientName,
      status: projects.status,
      startDate: projects.startDate,
    })
    .from(projectAssignments)
    .innerJoin(projects, eq(projectAssignments.projectId, projects.id))
    .where(eq(projectAssignments.employeeId, auth.user.id));

  return NextResponse.json(assignedProjects);
}
