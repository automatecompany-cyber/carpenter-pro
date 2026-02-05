import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, inventoryItems, projectMaterials, projects } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // format: 2026-02

  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  // Orders received this month
  const receivedOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "received"),
        gte(orders.receivedDate, startDate),
        lte(orders.receivedDate, endDate)
      )
    );

  // Orders placed this month
  const placedOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        gte(orders.orderDate, startDate),
        lte(orders.orderDate, endDate)
      )
    );

  // Get items for received orders to calculate total spend
  let totalOrderCost = 0;
  const orderedItemsList: { name: string; quantity: number; unit: string; cost: number }[] = [];

  for (const order of receivedOrders) {
    const items = await db
      .select({
        quantity: orderItems.quantity,
        unitCost: orderItems.unitCost,
        itemName: inventoryItems.name,
        itemUnit: inventoryItems.unit,
      })
      .from(orderItems)
      .innerJoin(inventoryItems, eq(orderItems.inventoryItemId, inventoryItems.id))
      .where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      const lineCost = item.quantity * item.unitCost;
      totalOrderCost += lineCost;
      orderedItemsList.push({
        name: item.itemName,
        quantity: item.quantity,
        unit: item.itemUnit,
        cost: lineCost,
      });
    }
  }

  // Materials used this month (from project_materials updated_at via createdAt)
  // We track materials by looking at project materials with quantityUsed > 0
  // Since we don't have a per-usage log, we show all active project material usage
  const allProjectMaterials = await db
    .select({
      projectId: projectMaterials.projectId,
      projectName: projects.name,
      itemName: inventoryItems.name,
      itemUnit: inventoryItems.unit,
      itemUnitCost: inventoryItems.unitCost,
      quantityUsed: projectMaterials.quantityUsed,
      quantityNeeded: projectMaterials.quantityNeeded,
    })
    .from(projectMaterials)
    .innerJoin(inventoryItems, eq(projectMaterials.inventoryItemId, inventoryItems.id))
    .innerJoin(projects, eq(projectMaterials.projectId, projects.id))
    .where(
      and(
        eq(projects.status, "in_progress"),
      )
    );

  const totalMaterialCost = allProjectMaterials.reduce(
    (sum, m) => sum + m.quantityUsed * m.itemUnitCost,
    0
  );

  const totalPlannedCost = allProjectMaterials.reduce(
    (sum, m) => sum + m.quantityNeeded * m.itemUnitCost,
    0
  );

  // Inventory value snapshot
  const allItems = await db.select().from(inventoryItems);
  const totalInventoryValue = allItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const lowStockCount = allItems.filter(
    (item) => item.quantity <= item.reorderThreshold
  ).length;

  // Active projects
  const activeProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "in_progress"));

  return NextResponse.json({
    month,
    orders: {
      placed: placedOrders.length,
      received: receivedOrders.length,
      totalSpent: totalOrderCost,
      items: orderedItemsList,
    },
    materials: {
      activeProjects: activeProjects.length,
      totalUsedCost: totalMaterialCost,
      totalPlannedCost,
      byProject: allProjectMaterials,
    },
    inventory: {
      totalItems: allItems.length,
      totalValue: totalInventoryValue,
      lowStockCount,
    },
  });
}
