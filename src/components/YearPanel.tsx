"use client";

import { useMemo } from "react";
import {
  MONTH_NAMES,
  MONTH_NAMES_TC,
  WEEKDAY_EN_SHORT,
  YEAR,
  buildMonthGrid,
  daysInMonth,
  groupByDate,
  pad2,
  weekdayOf,
  type PlannerItem,
} from "@/lib/calendar";

type Props = {
  items: PlannerItem[];
  selectedDate: string;
  onPickDate: (iso: string, monthIndex: number) => void;
};

export function YearPanel({ items, selectedDate, onPickDate }: Props) {
  const byDate = useMemo(() => groupByDate(items), [items]);
  const doneCount = items.filter((item) => item.done).length;
  const taskCount = items.filter((item) => item.kind === "task").length;

  return (
    <section className="space-y-3.5">
      <div className="panel flex flex-wrap items-end justify-between gap-4 overflow-hidden px-5 py-5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.3em] text-accent">YEAR AT A GLANCE</p>
          <p className="mt-1.5 font-display text-[46px] leading-[0.85] tracking-[-0.04em] text-ink">
            2027<span className="text-accent">.</span>
          </p>
          <p className="mt-2 text-[11.5px] text-muted">每個月一頁，寫下你的待辦。點選日期即可回到月曆編輯。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "全年項目", value: items.length },
            { label: "待辦", value: taskCount },
            { label: "已完成", value: doneCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-cream/40 px-3.5 py-2">
              <p className="font-display text-[18px] leading-none text-accent">{pad2(stat.value)}</p>
              <p className="mt-1 text-[9.5px] tracking-[0.12em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MONTH_NAMES.map((name, monthIndex) => {
          const cells = buildMonthGrid(YEAR, monthIndex);
          const rows = Math.ceil((weekdayOf(YEAR, monthIndex, 1) + daysInMonth(YEAR, monthIndex)) / 7);
          const monthCells = cells.slice(0, rows * 7);
          const monthPrefix = `${YEAR}-${pad2(monthIndex + 1)}`;
          const count = items.filter((item) => item.eventDate.startsWith(monthPrefix)).length;

          return (
            <article
              key={name}
              className="rounded-[20px] border border-line/90 bg-paper p-3.5 shadow-[0_18px_45px_-45px_rgba(88,45,22,0.8)] transition hover:border-accent/30"
            >
              <div className="flex items-baseline justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPickDate(`${monthPrefix}-01`, monthIndex)}
                  className="flex items-baseline gap-2 text-left"
                >
                  <span className="font-display text-[17px] leading-none tracking-tight text-accent">
                    {pad2(monthIndex + 1)}
                  </span>
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink/60">{name}</span>
                  <span className="text-[9px] text-muted/70">{MONTH_NAMES_TC[monthIndex]}</span>
                </button>
                <span className="text-[9px] text-muted">{count > 0 ? `${count} 項` : "—"}</span>
              </div>

              <div className="mt-2.5 grid grid-cols-7 gap-y-0.5 text-center">
                {WEEKDAY_EN_SHORT.map((day, index) => (
                  <span
                    key={`${name}-${index}`}
                    className={`text-[8px] font-semibold tracking-[0.1em] ${
                      index === 0 ? "text-accent/70" : "text-muted/80"
                    }`}
                  >
                    {day}
                  </span>
                ))}
                {monthCells.map((cell) =>
                  cell.inMonth ? (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => onPickDate(cell.iso, monthIndex)}
                      className={`relative mx-auto grid h-[22px] w-[22px] place-items-center rounded-full text-[10.5px] leading-none transition ${
                        cell.iso === selectedDate
                          ? "ring-1 ring-accent ring-offset-1 ring-offset-paper"
                          : ""
                      } ${
                        byDate.has(cell.iso)
                          ? "bg-accent-soft font-semibold text-accent hover:bg-accent hover:text-white"
                          : cell.weekday === 0
                            ? "text-accent/80 hover:bg-cream"
                            : "text-ink/70 hover:bg-cream"
                      }`}
                      title={`${MONTH_NAMES_TC[monthIndex]}${cell.day}日 · ${
                        byDate.get(cell.iso)?.length ?? 0
                      } 項`}
                    >
                      {cell.day}
                    </button>
                  ) : (
                    <span key={cell.iso} className="mx-auto h-[22px] w-[22px]" aria-hidden="true" />
                  ),
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2">
                <span className="text-[9px] text-muted">
                  {YEAR} · {MONTH_NAMES_TC[monthIndex]}
                </span>
                <button
                  type="button"
                  onClick={() => onPickDate(`${monthPrefix}-01`, monthIndex)}
                  className="text-[9.5px] font-semibold text-accent/80 transition hover:text-accent"
                >
                  前往月份 →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
