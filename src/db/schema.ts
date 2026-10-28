import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("categories_slug_key").on(table.slug)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    allDay: boolean("all_day").notNull().default(true),
    kind: text("kind").notNull().default("event"),
    done: boolean("done").notNull().default(false),
    categorySlug: text("category_slug").notNull().default("personal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("events_event_date_idx").on(table.eventDate)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type EventRow = typeof events.$inferSelect;
