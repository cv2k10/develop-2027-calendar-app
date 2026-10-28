import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("categories_slug_key").on(table.slug)],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    // ISO date string (YYYY-MM-DD); lexicographic order matches chronological order.
    eventDate: text("event_date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(true),
    kind: text("kind").notNull().default("event"),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    categorySlug: text("category_slug").notNull().default("personal"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("events_event_date_idx").on(table.eventDate)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type EventRow = typeof events.$inferSelect;
