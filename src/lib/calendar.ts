export const YEAR = 2027;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_NAMES_TC = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

export const WEEKDAY_TC = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"] as const;
export const WEEKDAY_TC_SHORT = ["日", "一", "二", "三", "四", "五", "六"] as const;
export const WEEKDAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export const WEEKDAY_EN_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;

export type ItemKind = "event" | "task";

export type PlannerItem = {
  id: number;
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

export type Category = {
  id?: number;
  slug: string;
  name: string;
  color: string;
  sortOrder?: number;
};

export type CalendarDay = {
  iso: string;
  day: number;
  monthIndex: number;
  weekday: number;
  inMonth: boolean;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { slug: "work", name: "工作", color: "#EE5A26", sortOrder: 0 },
  { slug: "personal", name: "個人", color: "#B4638A", sortOrder: 1 },
  { slug: "health", name: "健康", color: "#5F8A6B", sortOrder: 2 },
  { slug: "study", name: "學習", color: "#4C6E9C", sortOrder: 3 },
  { slug: "holiday", name: "節日", color: "#C2412D", sortOrder: 4 },
];

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function isoOf(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function weekdayOf(year: number, monthIndex: number, day: number): number {
  return new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function parseIso(iso: string): { year: number; monthIndex: number; day: number; weekday: number } {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  return { year, monthIndex: month - 1, day, weekday: weekdayOf(year, month - 1, day) };
}

/** Six-week Sunday-first grid for a month. */
export function buildMonthGrid(year: number, monthIndex: number): CalendarDay[] {
  const offset = weekdayOf(year, monthIndex, 1);
  const cells: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cursor = new Date(Date.UTC(year, monthIndex, 1 - offset + index));
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    cells.push({
      iso: isoOf(y, m, d),
      day: d,
      monthIndex: m,
      weekday: cursor.getUTCDay(),
      inMonth: m === monthIndex && y === year,
    });
  }

  return cells;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function formatMonthDay(iso: string): string {
  const { monthIndex, day } = parseIso(iso);
  return `${monthIndex + 1}月${day}日`;
}

export function formatDateFull(iso: string): string {
  const { weekday } = parseIso(iso);
  return `${formatMonthDay(iso)} ${WEEKDAY_TC[weekday]}`;
}

export function formatDateDot(iso: string): string {
  const { monthIndex, day } = parseIso(iso);
  return `${pad2(monthIndex + 1)}.${pad2(day)}`;
}

export function formatTime(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export function itemTimeLabel(item: PlannerItem): string {
  if (item.allDay || (!item.startTime && !item.endTime)) return "全天";
  if (item.startTime && item.endTime) return `${formatTime(item.startTime)}–${formatTime(item.endTime)}`;
  return formatTime(item.startTime ?? item.endTime);
}

export function sortItems(items: PlannerItem[]): PlannerItem[] {
  return [...items].sort((a, b) => {
    if (a.eventDate !== b.eventDate) return a.eventDate < b.eventDate ? -1 : 1;
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    const aTime = a.startTime ?? "";
    const bTime = b.startTime ?? "";
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    return a.id - b.id;
  });
}

export function groupByDate(items: PlannerItem[]): Map<string, PlannerItem[]> {
  const map = new Map<string, PlannerItem[]>();
  for (const item of sortItems(items)) {
    const bucket = map.get(item.eventDate);
    if (bucket) bucket.push(item);
    else map.set(item.eventDate, [item]);
  }
  return map;
}

export function monthItems(items: PlannerItem[], monthIndex: number): PlannerItem[] {
  const prefix = `${YEAR}-${pad2(monthIndex + 1)}`;
  return sortItems(items.filter((item) => item.eventDate.startsWith(prefix)));
}

export function matchesQuery(item: PlannerItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.title.toLowerCase().includes(needle) ||
    item.notes.toLowerCase().includes(needle) ||
    item.eventDate.includes(needle)
  );
}
