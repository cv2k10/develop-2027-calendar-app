import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, events } from "@/db/schema";
import {
  DEFAULT_CATEGORIES,
  sortItems,
  type Category,
  type ItemKind,
  type PlannerItem,
} from "@/lib/calendar";

const eventColumns = {
  id: events.id,
  title: events.title,
  notes: events.notes,
  eventDate: events.eventDate,
  startTime: events.startTime,
  endTime: events.endTime,
  allDay: events.allDay,
  kind: events.kind,
  done: events.done,
  categorySlug: events.categorySlug,
};

type EventSelect = {
  id: number;
  title: string;
  notes: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  kind: string;
  done: boolean;
  categorySlug: string;
};

function toItem(row: EventSelect): PlannerItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    eventDate: row.eventDate,
    startTime: row.startTime,
    endTime: row.endTime,
    allDay: row.allDay,
    kind: row.kind === "task" ? "task" : "event",
    done: row.done,
    categorySlug: row.categorySlug,
  };
}

export async function listItems(): Promise<PlannerItem[]> {
  const db = getDb();
  const rows = await db.select(eventColumns).from(events).orderBy(asc(events.eventDate), asc(events.id));
  return sortItems(rows.map(toItem));
}

export async function listCategories(): Promise<Category[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      color: categories.color,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return rows.length > 0 ? rows : DEFAULT_CATEGORIES;
}

export type ItemInput = {
  title: string;
  notes: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  kind: ItemKind;
  done: boolean;
  categorySlug: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ValidationResult = { ok: true; value: ItemInput } | { ok: false; error: string };

export function parseItemInput(body: unknown, partial = false): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "請提供行程資料" };
  }
  const input = body as Record<string, unknown>;

  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (!partial && !rawTitle) {
    return { ok: false, error: "請輸入行程名稱" };
  }
  if (partial && "title" in input && !rawTitle) {
    return { ok: false, error: "行程名稱不能留空" };
  }
  if (rawTitle.length > 120) {
    return { ok: false, error: "行程名稱請少於 120 字" };
  }

  const rawDate = typeof input.eventDate === "string" ? input.eventDate : "";
  if (!partial && !DATE_PATTERN.test(rawDate)) {
    return { ok: false, error: "請選擇有效日期" };
  }
  if (rawDate && !DATE_PATTERN.test(rawDate)) {
    return { ok: false, error: "日期格式不正確" };
  }

  const normaliseTime = (value: unknown): string | null => {
    if (typeof value !== "string" || value.trim() === "") return null;
    return TIME_PATTERN.test(value.trim()) ? value.trim() : null;
  };

  const allDay = typeof input.allDay === "boolean" ? input.allDay : true;
  const startTime = normaliseTime(input.startTime);
  const endTime = normaliseTime(input.endTime);

  const kind: ItemKind = input.kind === "task" ? "task" : "event";
  const categorySlug =
    typeof input.categorySlug === "string" && input.categorySlug.trim()
      ? input.categorySlug.trim().slice(0, 40)
      : "personal";

  return {
    ok: true,
    value: {
      title: rawTitle,
      notes: typeof input.notes === "string" ? input.notes.slice(0, 2000) : "",
      eventDate: rawDate,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      allDay,
      kind,
      done: typeof input.done === "boolean" ? input.done : false,
      categorySlug,
    },
  };
}

export async function createItem(input: ItemInput): Promise<PlannerItem> {
  const db = getDb();
  const [row] = await db.insert(events).values(input).returning(eventColumns);
  return toItem(row);
}

export async function updateItem(id: number, input: Partial<ItemInput>): Promise<PlannerItem | null> {
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning(eventColumns);
  return row ? toItem(row) : null;
}

export async function deleteItem(id: number): Promise<boolean> {
  const db = getDb();
  const rows = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
  return rows.length > 0;
}

export async function listItemsInRange(from: string, to: string): Promise<PlannerItem[]> {
  const db = getDb();
  const rows = await db
    .select(eventColumns)
    .from(events)
    .where(and(gte(events.eventDate, from), lte(events.eventDate, to)))
    .orderBy(asc(events.eventDate), asc(events.id));
  return sortItems(rows.map(toItem));
}

export function isIsoDate(value: string): boolean {
  return DATE_PATTERN.test(value);
}
