import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";

export async function GET() {
  const allProjects = await db.select().from(projects);
  return NextResponse.json(allProjects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const [project] = await db
    .insert(projects)
    .values({
      name: body.name,
      clientName: body.clientName,
      clientAddress: body.clientAddress || null,
      clientPhone: body.clientPhone || null,
      clientEmail: body.clientEmail || null,
      status: body.status || "planning",
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
