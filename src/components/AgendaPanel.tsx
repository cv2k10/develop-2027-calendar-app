"use client";

import { useMemo, useState } from "react";
import {
  MONTH_NAMES,
  MONTH_NAMES_TC,
  WEEKDAY_TC,
  YEAR,
  pad2,
  parseIso,
  type PlannerItem,
} from "@/lib/calendar";
import { categoryOf, ItemRow, type CategoryLookup } from "./shared";

type Filter = "all" | "event" | "task";

type Props = {
  items: PlannerItem[];
  categories: CategoryLookup;
  onToggle: (item: PlannerItem) => void;
  onEdit: (item: PlannerItem) => void;
  onJumpMonth: (monthIndex: number) => void;
};

export function AgendaPanel({ items, categories, onToggle, onEdit, onJumpMonth }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [hideDone, setHideDone] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (hideDone && item.done) return false;
      return true;
    });
  }, [items, filter, hideDone]);

  const grouped = useMemo(() => {
    const months: { monthIndex: number; dates: { iso: string; items: PlannerItem[] }[] }[] = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const prefix = `${YEAR}-${pad2(monthIndex + 1)}`;
      const monthItems = filtered.filter((item) => item.eventDate.startsWith(prefix));
      if (monthItems.length === 0) continue;
      const byDate = new Map<string, PlannerItem[]>();
      for (const item of monthItems) {
        const bucket = byDate.get(item.eventDate);
        if (bucket) bucket.push(item);
        else byDate.set(item.eventDate, [item]);
      }
      months.push({
        monthIndex,
        dates: [...byDate.entries()].map(([iso, dateItems]) => ({ iso, items: dateItems })),
      });
    }
    return months;
  }, [filtered]);

  const remaining = filtered.filter((item) => !item.done).length;

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-display text-[22px] font-black leading-none tracking-tight text-accent">2027 議程</h2>
          <p className="mt-1.5 text-[10.5px] text-muted">依月份排列 · 還有 {remaining} 件事等著完成</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-full border border-line bg-cream/40 p-0.5">
            {(
              [
                { value: "all", label: "全部" },
                { value: "event", label: "行程" },
                { value: "task", label: "待辦" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${
                  filter === option.value ? "bg-paper text-accent shadow-sm" : "text-muted hover:text-ink/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setHideDone((prev) => !prev)}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
              hideDone
                ? "border-accent/40 bg-accent-soft/50 text-accent"
                : "border-line bg-paper text-muted hover:text-ink/70"
            }`}
          >
            隱藏已完成
          </button>
        </div>
      </header>

      <div className="max-h-[68vh] overflow-y-auto scroll-thin border-t border-line px-4 py-4 sm:px-5">
        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-[18px] text-accent">還沒有符合的項目</p>
            <p className="mt-1.5 text-[11.5px] text-muted">調整篩選條件，或新增一筆行程開始規劃。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const monthCount = group.dates.reduce((sum, date) => sum + date.items.length, 0);
              return (
                <div key={group.monthIndex}>
                  <button
                    type="button"
                    onClick={() => onJumpMonth(group.monthIndex)}
                    className="group flex w-full items-center gap-2.5"
                  >
                    <span className="font-display text-[17px] leading-none text-accent">
                      {pad2(group.monthIndex + 1)}
                    </span>
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink/55">
                      {MONTH_NAMES[group.monthIndex]} · {MONTH_NAMES_TC[group.monthIndex]}
                    </span>
                    <span className="h-px flex-1 bg-line transition group-hover:bg-accent/30" />
                    <span className="text-[9.5px] text-muted">{monthCount} 項</span>
                    <span className="text-[9.5px] font-semibold text-accent/0 transition group-hover:text-accent">
                      查看 →
                    </span>
                  </button>

                  <div className="mt-2 space-y-2">
                    {group.dates.map((date) => {
                      const { weekday } = parseIso(date.iso);
                      return (
                        <div key={date.iso} className="grid grid-cols-[46px_minmax(0,1fr)] gap-2.5">
                          <div className="pt-1.5 text-center">
                            <p className="font-display text-[16px] leading-none text-ink/80">{pad2(parseIso(date.iso).day)}</p>
                            <p className={`mt-1 text-[9px] ${weekday === 0 ? "text-accent" : "text-muted"}`}>
                              {WEEKDAY_TC[weekday]}
                            </p>
                          </div>
                          <div className="space-y-0.5 rounded-xl border border-line/70 bg-[#fffdfa] px-1.5 py-1">
                            {date.items.map((item) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                category={categoryOf(categories, item.categorySlug)}
                                onToggle={onToggle}
                                onEdit={onEdit}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[9.5px] text-muted sm:px-5">
        <span>點擊標題可編輯 · 圓圈打勾完成</span>
        <span className="font-display tracking-[0.2em] text-accent/60">AGENDA · 2027</span>
      </footer>
    </section>
  );
}
