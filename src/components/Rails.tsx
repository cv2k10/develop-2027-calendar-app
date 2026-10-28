"use client";

import { MONTH_NAMES, MONTH_NAMES_TC, WEEKDAY_TC, YEAR, pad2, parseIso, type Category, type PlannerItem } from "@/lib/calendar";
import { categoryOf, ItemRow, Progress, SectionLabel, type CategoryLookup } from "./shared";
import { Check, Download, Plus, Printer } from "./icons";

export function YearRail({
  monthIndex,
  counts,
  total,
  done,
  onSelectMonth,
  onYearView,
  onPrint,
}: {
  monthIndex: number;
  counts: number[];
  total: number;
  done: number;
  onSelectMonth: (index: number) => void;
  onYearView: () => void;
  onPrint: () => void;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rail-card p-4">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>年度概覽</SectionLabel>
        <button
          type="button"
          onClick={onYearView}
          className="text-[9.5px] font-semibold text-accent/80 transition hover:text-accent"
        >
          年曆 →
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-display text-[36px] leading-[0.8] tracking-[-0.03em] text-ink">2027</p>
        <span className="text-[9px] font-semibold tracking-[0.16em] text-muted">PLANNER</span>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-1.5">
        {MONTH_NAMES.map((name, index) => {
          const active = index === monthIndex;
          const count = counts[index] ?? 0;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectMonth(index)}
              title={`${MONTH_NAMES_TC[index]} · ${count} 項`}
              className={`relative grid h-9 place-items-center rounded-xl border text-[11px] font-semibold transition ${
                active
                  ? "border-accent bg-accent text-white shadow-[0_8px_18px_-12px_rgba(238,90,38,0.9)]"
                  : count > 0
                    ? "border-line bg-paper text-ink/70 hover:border-accent/40 hover:text-accent"
                    : "border-dashed border-line bg-cream/30 text-muted/70 hover:border-accent/30 hover:text-accent/80"
              }`}
            >
              {pad2(index + 1)}
              {count > 0 && !active ? (
                <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-accent/70" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">完成率</span>
          <span className="font-semibold text-ink/70">{pct}%</span>
        </div>
        <div className="mt-1.5">
          <Progress value={pct} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
          <span>已完成 {done}</span>
          <span>全部 {total}</span>
        </div>
      </div>

      <div className="mt-3.5 grid gap-1.5">
        <a href="/api/export" className="btn-ghost justify-center">
          <Download className="h-3.5 w-3.5" /> 匯出 .ics
        </a>
        <button type="button" onClick={onPrint} className="btn-ghost justify-center">
          <Printer className="h-3.5 w-3.5" /> 列印年曆
        </button>
      </div>

      <p className="mt-3 rounded-xl bg-cream/70 px-3 py-2.5 text-[10.5px] leading-relaxed text-ink/55">
        把大事寫下來，小事就不會忘記。
        <span className="mt-1 block text-muted">— 給 2027 的自己</span>
      </p>
    </div>
  );
}

export function DayRail({
  selectedDate,
  items,
  categories,
  onToggle,
  onEdit,
  onCreate,
}: {
  selectedDate: string;
  items: PlannerItem[];
  categories: CategoryLookup;
  onToggle: (item: PlannerItem) => void;
  onEdit: (item: PlannerItem) => void;
  onCreate: (iso: string) => void;
}) {
  const { monthIndex, day, weekday } = parseIso(selectedDate);

  return (
    <div className="rail-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <SectionLabel>選定日期</SectionLabel>
          <div className="mt-1.5 flex items-baseline gap-1">
            <p className="font-display text-[30px] leading-none tracking-[-0.03em] text-ink">{pad2(day)}</p>
            <span className="font-display text-[14px] leading-none text-accent">.{pad2(monthIndex + 1)}</span>
            <span className="ml-1 text-[9.5px] tracking-[0.14em] text-muted">2027</span>
          </div>
          <p className={`mt-1 text-[10.5px] ${weekday === 0 ? "text-accent/80" : "text-muted"}`}>
            {WEEKDAY_TC[weekday]} · {items.length > 0 ? `${items.length} 個安排` : "還沒有安排"}
          </p>
        </div>
        <button type="button" className="icon-btn" aria-label="在這天新增行程" onClick={() => onCreate(selectedDate)}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 space-y-0.5">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[10.5px] leading-relaxed text-muted">
            這一天還空著，
            <br />
            寫下一件想做的事吧。
          </p>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              category={categoryOf(categories, item.categorySlug)}
              onToggle={onToggle}
              onEdit={onEdit}
              dense
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => onCreate(selectedDate)}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-1.5 text-[10.5px] font-semibold text-muted transition hover:border-accent/40 hover:bg-accent-soft/20 hover:text-accent"
      >
        <Plus className="h-3 w-3" /> 在這天新增
      </button>
    </div>
  );
}

export function TodoRail({
  monthIndex,
  tasks,
  eventCount,
  categories,
  onToggle,
  onEdit,
  onCreate,
}: {
  monthIndex: number;
  tasks: PlannerItem[];
  eventCount: number;
  categories: CategoryLookup;
  onToggle: (item: PlannerItem) => void;
  onEdit: (item: PlannerItem) => void;
  onCreate: (iso: string) => void;
}) {
  const done = tasks.filter((item) => item.done).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="rail-card p-4">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>本月待辦</SectionLabel>
        <span className="rounded-full bg-accent-soft/70 px-2 py-0.5 text-[9.5px] font-semibold text-accent">
          {pad2(monthIndex + 1)} / 12
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-[17px] leading-none tracking-tight text-ink">
          {MONTH_NAMES[monthIndex]}
          <span className="ml-1.5 font-sans text-[10px] font-medium tracking-normal text-muted">
            {MONTH_NAMES_TC[monthIndex]}
          </span>
        </p>
        <p className="text-[9.5px] text-muted">
          {done}/{tasks.length} 完成
        </p>
      </div>

      <div className="mt-2">
        <Progress value={pct} />
      </div>

      <div className="mt-2.5 space-y-0.5">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[10.5px] leading-relaxed text-muted">
            這個月還沒有待辦，
            <br />
            把想完成的事寫進來。
          </p>
        ) : (
          tasks.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              category={categoryOf(categories, item.categorySlug)}
              onToggle={onToggle}
              onEdit={onEdit}
              showDate
            />
          ))
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className="text-[9.5px] text-muted">另有 {eventCount} 個行程</span>
        <button
          type="button"
          onClick={() => onCreate(`${YEAR}-${pad2(monthIndex + 1)}-01`)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent/85 transition hover:text-accent"
        >
          <Plus className="h-3 w-3" /> 新增待辦
        </button>
      </div>
    </div>
  );
}



export function CategoryRail({
  categories,
  counts,
  hidden,
  onToggle,
  onReset,
}: {
  categories: Category[];
  counts: Map<string, number>;
  hidden: string[];
  onToggle: (slug: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="rail-card p-4">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>分類</SectionLabel>
        {hidden.length > 0 ? (
          <button type="button" onClick={onReset} className="text-[9.5px] font-semibold text-accent transition hover:underline">
            全部顯示
          </button>
        ) : (
          <span className="text-[9px] text-muted">點選篩選</span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        {categories.map((category) => {
          const active = !hidden.includes(category.slug);
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onToggle(category.slug)}
              aria-pressed={active}
              className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                active ? "bg-cream/55 hover:bg-cream" : "opacity-45 hover:opacity-70"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: category.color }} />
              <span className="flex-1 text-left text-[11px] font-medium text-ink/75">{category.name}</span>
              <span className="text-[10px] tabular-nums text-muted">{counts.get(category.slug) ?? 0}</span>
              <span
                className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${
                  active ? "border-transparent text-accent" : "border-line text-transparent"
                }`}
              >
                {active ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
