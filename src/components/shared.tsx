"use client";

import type { Category, ItemKind, PlannerItem } from "@/lib/calendar";
import { formatDateDot, itemTimeLabel } from "@/lib/calendar";
import { Check, Clock } from "./icons";

export type Draft = {
  title: string;
  notes: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  kind: ItemKind;
  done: boolean;
  categorySlug: string;
};

export type CategoryLookup = Map<string, Category>;

export const FALLBACK_COLOR = "#EE5A26";

export const FALLBACK_CATEGORY: Category = {
  slug: "personal",
  name: "個人",
  color: FALLBACK_COLOR,
};

export function categoryOf(lookup: CategoryLookup, slug: string): Category {
  return lookup.get(slug) ?? FALLBACK_CATEGORY;
}

export function draftFromItem(item: PlannerItem): Draft {
  return {
    title: item.title,
    notes: item.notes,
    eventDate: item.eventDate,
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    allDay: item.allDay,
    kind: item.kind,
    done: item.done,
    categorySlug: item.categorySlug,
  };
}

export function blankDraft(date: string, kind: ItemKind = "event", categorySlug = "work"): Draft {
  return {
    title: "",
    notes: "",
    eventDate: date,
    startTime: "",
    endTime: "",
    allDay: true,
    kind,
    done: false,
    categorySlug,
  };
}

export function Progress({ value, color = "#EE5A26" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-deep/70">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function ItemRow({
  item,
  category,
  onToggle,
  onEdit,
  showDate = false,
  dense = false,
}: {
  item: PlannerItem;
  category: Category;
  onToggle: (item: PlannerItem) => void;
  onEdit: (item: PlannerItem) => void;
  showDate?: boolean;
  dense?: boolean;
}) {
  const timeLabel = itemTimeLabel(item);
  const showTime = !item.allDay && timeLabel !== "全天";

  return (
    <div className="group flex items-start gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-cream/70">
      <button
        type="button"
        aria-label={item.done ? `將「${item.title}」標為未完成` : `完成「${item.title}」`}
        aria-pressed={item.done}
        onClick={() => onToggle(item)}
        className="mt-[2px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border transition"
        style={{
          borderColor: item.done ? category.color : "#dccabd",
          background: item.done ? category.color : "transparent",
          color: "#fffdfb",
        }}
      >
        {item.done ? <Check className="h-2.5 w-2.5" /> : null}
      </button>

      <button type="button" onClick={() => onEdit(item)} className="min-w-0 flex-1 text-left">
        <p
          className={`truncate text-[12.5px] leading-[1.45] transition ${
            item.done ? "text-muted line-through" : "text-ink/85 group-hover:text-ink"
          } ${item.kind === "task" ? "" : "font-medium"}`}
        >
          {item.title}
        </p>
        {!dense && item.notes ? (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-[1.4] text-muted">{item.notes}</p>
        ) : null}
      </button>

      <div className="flex shrink-0 flex-col items-end gap-0.5 pt-[1px]">
        {showDate ? <span className="text-[9.5px] tracking-wide text-muted">{formatDateDot(item.eventDate)}</span> : null}
        {showTime ? (
          <span className="inline-flex items-center gap-0.5 text-[9.5px] text-muted">
            <Clock className="h-2.5 w-2.5" />
            {timeLabel}
          </span>
        ) : showDate ? null : (
          <span className="rounded-full bg-cream/90 px-1.5 py-[1px] text-[9px] text-muted">
            {item.kind === "task" ? "待辦" : "全天"}
          </span>
        )}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-muted">{children}</p>
  );
}
