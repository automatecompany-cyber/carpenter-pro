import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["lumber", "hardware", "fasteners", "adhesives", "finishes", "other"],
  }).notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  unitCost: real("unit_cost").notNull().default(0),
  supplier: text("supplier"),
  reorderThreshold: integer("reorder_threshold").notNull().default(5),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  status: text("status", {
    enum: ["planning", "in_progress", "on_hold", "completed", "cancelled"],
  })
    .notNull()
    .default("planning"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const projectMaterials = sqliteTable("project_materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "restrict" }),
  quantityNeeded: real("quantity_needed").notNull().default(0),
  quantityUsed: real("quantity_used").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMaterial = typeof projectMaterials.$inferSelect;
export type NewProjectMaterial = typeof projectMaterials.$inferInsert;
