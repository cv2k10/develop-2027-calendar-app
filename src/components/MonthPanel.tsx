"use client";

import { useMemo } from "react";
import {
  MONTH_NAMES,
  MONTH_NAMES_TC,
  WEEKDAY_EN,
  WEEKDAY_TC,
  YEAR,
  buildMonthGrid,
  groupByDate,
  pad2,
  type PlannerItem,
} from "@/lib/calendar";
import { categoryOf, type CategoryLookup } from "./shared";
import { ChevronLeft, ChevronRight, Grid, Plus } from "./icons";

type Props = {
  monthIndex: number;
  items: PlannerItem[];
  selectedDate: string;
  categories: CategoryLookup;
  onSelectDate: (iso: string) => void;
  onOpenCreate: (iso: string) => void;
  onEdit: (item: PlannerItem) => void;
  onChangeMonth: (delta: number) => void;
  onYearView: () => void;
};

export function MonthPanel({
  monthIndex,
  items,
  selectedDate,
  categories,
  onSelectDate,
  onOpenCreate,
  onEdit,
  onChangeMonth,
  onYearView,
}: Props) {
  const cells = useMemo(() => buildMonthGrid(YEAR, monthIndex), [monthIndex]);
  const byDate = useMemo(() => groupByDate(items), [items]);
  const monthPrefix = `${YEAR}-${pad2(monthIndex + 1)}`;
  const monthItemCount = items.filter((item) => item.eventDate.startsWith(monthPrefix)).length;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display text-[25px] leading-none tracking-[-0.02em] text-accent sm:text-[28px]">
            {YEAR}-{pad2(monthIndex + 1)}
          </h2>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-muted">
            {MONTH_NAMES[monthIndex]} · {MONTH_NAMES_TC[monthIndex]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 hidden rounded-full bg-cream/80 px-2.5 py-1 text-[10px] font-medium text-ink/60 sm:inline">
            本月 {monthItemCount} 項
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="上一個月"
            disabled={monthIndex === 0}
            onClick={() => onChangeMonth(-1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="下一個月"
            disabled={monthIndex === 11}
            onClick={() => onChangeMonth(1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onOpenCreate(selectedDate)}
            className="btn-accent ml-1 !px-3 !py-1.5 !text-[11px]"
          >
            <Plus className="h-3 w-3" /> 新增
          </button>
          <button
            type="button"
            onClick={onYearView}
            className="ml-0.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-semibold text-accent shadow-[0_6px_14px_-12px_rgba(238,90,38,0.9)] transition hover:border-accent/50 hover:bg-accent-soft/60"
          >
            <Grid className="h-3 w-3" /> 前往年曆
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <div className="min-w-[660px]">
          <div className="grid grid-cols-7 border-y border-line bg-[#fdf7f2]">
            {WEEKDAY_TC.map((label, index) => (
              <div
                key={label}
                className={`px-2 py-2 text-center ${index === 0 ? "text-accent/85" : "text-muted"}`}
              >
                <p className="text-[10px] font-semibold tracking-[0.14em]">{label}</p>
                <p className="mt-[1px] text-[8px] tracking-[0.22em] opacity-60">{WEEKDAY_EN[index]}</p>
              </div>
            ))}
          </div>

          <div key={`${YEAR}-${monthIndex}`} className="grid animate-fade grid-cols-7 gap-px bg-line/80">
            {cells.map((cell) => {
              const dayItems = byDate.get(cell.iso) ?? [];
              const isSelected = cell.iso === selectedDate;
              const isSunday = cell.weekday === 0;
              const visible = dayItems.slice(0, 3);
              const hiddenCount = dayItems.length - visible.length;
              const inYear = cell.iso.startsWith(String(YEAR));

              return (
                <div
                  key={cell.iso}
                  role="presentation"
                  onClick={() => {
                    if (inYear) onSelectDate(cell.iso);
                  }}
                  className={`group relative min-h-[100px] cursor-pointer p-1.5 transition-colors ${
                    isSelected
                      ? "bg-accent-soft/50"
                      : cell.inMonth
                        ? isSunday
                          ? "bg-[#fffaf6] hover:bg-[#fdf4ed]"
                          : "bg-paper hover:bg-[#fdf7f2]"
                        : "bg-[#fdfaf7] hover:bg-[#fbf4ee]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (inYear) onSelectDate(cell.iso);
                      }}
                      className="flex items-baseline gap-1 rounded-md px-0.5 text-left"
                    >
                      <span
                        className={`text-[9px] tracking-wide ${
                          !cell.inMonth ? "text-muted/45" : isSunday ? "text-accent/75" : "text-muted"
                        }`}
                      >
                        {WEEKDAY_TC[cell.weekday]}
                      </span>
                      <span className={`text-[9px] ${cell.inMonth ? "text-line" : "text-line/60"}`}>|</span>
                      <span
                        className={`font-display text-[13px] leading-none tracking-tight ${
                          isSelected
                            ? "text-accent"
                            : !cell.inMonth
                              ? "text-muted/40"
                              : isSunday
                                ? "text-accent"
                                : "text-ink/80"
                        }`}
                      >
                        {pad2(cell.day)}
                      </span>
                    </button>
                    {inYear ? (
                      <button
                        type="button"
                        aria-label={`在 ${cell.iso} 新增行程`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCreate(cell.iso);
                        }}
                        className="grid h-[17px] w-[17px] place-items-center rounded-full bg-accent text-white shadow-sm transition hover:bg-[#d94c1c] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-1 space-y-[2px]">
                    {visible.map((item) => {
                      const category = categoryOf(categories, item.categorySlug);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(item);
                          }}
                          className="flex w-full items-center gap-1.5 truncate rounded-[6px] px-1 py-[2px] text-left transition hover:bg-white"
                          title={`${item.title}${item.notes ? ` · ${item.notes}` : ""}`}
                        >
                          <span
                            className="h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ background: category.color }}
                          />
                          <span
                            className={`truncate text-[10.5px] leading-[1.35] ${
                              item.done
                                ? "text-muted line-through"
                                : item.categorySlug === "holiday"
                                  ? "font-semibold text-[#b23a24]"
                                  : "text-ink/80"
                            }`}
                          >
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                    {hiddenCount > 0 ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDate(cell.iso);
                        }}
                        className="px-1 text-[9.5px] text-muted transition hover:text-accent"
                      >
                        +{hiddenCount} 更多
                      </button>
                    ) : null}
                  </div>

                  {isSelected ? <span className="absolute inset-x-0 bottom-0 h-[2px] bg-accent/80" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[9.5px] text-muted sm:px-5">
        <span>點選日期查看當日行程 · 點「+」直接新增 · ← → 切換月份</span>
        <span className="font-display tracking-[0.22em] text-accent/60">WARM PLANNER · 2027</span>
      </div>
    </section>
  );
}
