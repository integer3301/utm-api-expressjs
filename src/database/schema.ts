import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const utms = sqliteTable("utm_servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
  ip: text("ip").notNull(),
  port: integer("port").default(8080).notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export type Utm = typeof utms.$inferSelect;
export type NewUtm = typeof utms.$inferInsert;
