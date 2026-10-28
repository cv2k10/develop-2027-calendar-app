"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MONTH_NAMES,
  MONTH_NAMES_TC,
  YEAR,
  groupByDate,
  matchesQuery,
  monthItems,
  pad2,
  parseIso,
  sortItems,
  type Category,
  type ItemKind,
  type PlannerItem,
} from "@/lib/calendar";
import { AgendaPanel } from "./AgendaPanel";
import { EventDialog } from "./EventDialog";
import { MonthPanel } from "./MonthPanel";
import { YearPanel } from "./YearPanel";
import { CategoryRail, DayRail, TodoRail, YearRail } from "./Rails";
import { ItemRow, blankDraft, categoryOf, draftFromItem, type CategoryLookup, type Draft } from "./shared";
import {
  CalendarIcon,
  Close,
  Download,
  Flag,
  Grid,
  ListIcon,
  Plus,
  Search,
  Sparkle,
} from "./icons";

type View = "month" | "year" | "agenda";

type DialogState = {
  draft: Draft;
  editingId: number | null;
  token: string;
};

type ToastState = { message: string; tone: "ok" | "error" };

const VIEW_TABS: { value: View; label: string }[] = [
  { value: "month", label: "月" },
  { value: "year", label: "年" },
  { value: "agenda", label: "議程" },
];

export function CalendarApp({
  initialItems,
  categories,
}: {
  initialItems: PlannerItem[];
  categories: Category[];
}) {
  const [items, setItems] = useState<PlannerItem[]>(() => sortItems(initialItems));
  const [view, setView] = useState<View>("month");
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(`${YEAR}-01-04`);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const categoryLookup = useMemo<CategoryLookup>(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories],
  );

  const notify = useCallback((message: string, tone: ToastState["tone"] = "ok") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleItems = useMemo(
    () => items.filter((item) => !hidden.includes(item.categorySlug)),
    [items, hidden],
  );
  const filteredItems = useMemo(
    () => visibleItems.filter((item) => matchesQuery(item, query)),
    [visibleItems, query],
  );
  const byDate = useMemo(() => groupByDate(filteredItems), [filteredItems]);
  const currentMonthItems = useMemo(() => monthItems(filteredItems, monthIndex), [filteredItems, monthIndex]);
  const selectedDayItems = byDate.get(selectedDate) ?? [];
  const monthTasks = useMemo(() => currentMonthItems.filter((item) => item.kind === "task"), [currentMonthItems]);
  const monthEventCount = currentMonthItems.length - monthTasks.length;
  const monthDoneTasks = monthTasks.filter((item) => item.done).length;
  const yearDone = items.filter((item) => item.done).length;
  const yearPct = items.length > 0 ? Math.round((yearDone / items.length) * 100) : 0;

  const monthCounts = useMemo(() => {
    const counts = new Array<number>(12).fill(0);
    for (const item of visibleItems) {
      const month = Number(item.eventDate.slice(5, 7)) - 1;
      if (month >= 0 && month < 12) counts[month] += 1;
    }
    return counts;
  }, [visibleItems]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.categorySlug, (counts.get(item.categorySlug) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const searchGroups = useMemo(() => {
    const groups: { monthIndex: number; items: PlannerItem[] }[] = [];
    for (let month = 0; month < 12; month += 1) {
      const prefix = `${YEAR}-${pad2(month + 1)}`;
      const monthMatches = filteredItems.filter((item) => item.eventDate.startsWith(prefix));
      if (monthMatches.length > 0) groups.push({ monthIndex: month, items: monthMatches });
    }
    return groups;
  }, [filteredItems]);

  const openCreate = useCallback((iso: string, kind: ItemKind = "event") => {
    const safeDate = iso.startsWith(`${YEAR}-`) ? iso : `${YEAR}-01-01`;
    setDialog({
      draft: blankDraft(safeDate, kind),
      editingId: null,
      token: `new-${safeDate}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }, []);

  const openEdit = useCallback((item: PlannerItem) => {
    setDialog({
      draft: draftFromItem(item),
      editingId: item.id,
      token: `edit-${item.id}`,
    });
  }, []);

  const selectMonth = useCallback((index: number) => {
    const next = Math.min(11, Math.max(0, index));
    setMonthIndex(next);
    setSelectedDate(`${YEAR}-${pad2(next + 1)}-01`);
  }, []);

  const changeMonth = useCallback(
    (delta: number) => {
      selectMonth(monthIndex + delta);
    },
    [monthIndex, selectMonth],
  );

  const selectDate = useCallback((iso: string) => {
    if (!iso.startsWith(`${YEAR}-`)) return;
    setSelectedDate(iso);
    setMonthIndex(parseIso(iso).monthIndex);
  }, []);

  const jumpToMonth = useCallback(
    (index: number) => {
      selectMonth(index);
      setQuery("");
      setView("month");
    },
    [selectMonth],
  );

  const pickYearDate = useCallback(
    (iso: string, index: number) => {
      setSelectedDate(iso);
      setMonthIndex(index);
      setView("month");
    },
    [],
  );

  const saveItem = useCallback(
    async (draft: Draft) => {
      const editingId = dialog?.editingId ?? null;
      setPending(true);
      try {
        const payload = {
          title: draft.title,
          notes: draft.notes,
          eventDate: draft.eventDate,
          startTime: draft.allDay ? null : draft.startTime || null,
          endTime: draft.allDay ? null : draft.endTime || null,
          allDay: draft.allDay,
          kind: draft.kind,
          done: draft.done,
          categorySlug: draft.categorySlug,
        };
        const response = await fetch(editingId ? `/api/events/${editingId}` : "/api/events", {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { item?: PlannerItem; error?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.error ?? "儲存失敗，請稍後再試");
        }
        const saved = data.item;
        setItems((prev) =>
          sortItems(editingId ? prev.map((item) => (item.id === saved.id ? saved : item)) : [...prev, saved]),
        );
        setSelectedDate(saved.eventDate);
        setMonthIndex(parseIso(saved.eventDate).monthIndex);
        setDialog(null);
        notify(editingId ? "行程已更新" : "已加入行事曆");
      } catch (error) {
        notify(error instanceof Error ? error.message : "儲存失敗", "error");
      } finally {
        setPending(false);
      }
    },
    [dialog, notify],
  );

  const removeItem = useCallback(
    async (id: number) => {
      if (!window.confirm("確定要刪除這筆行程嗎？")) return;
      setPending(true);
      try {
        const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "刪除失敗");
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
        setDialog(null);
        notify("已刪除行程");
      } catch (error) {
        notify(error instanceof Error ? error.message : "刪除失敗", "error");
      } finally {
        setPending(false);
      }
    },
    [notify],
  );

  const toggleDone = useCallback(
    async (item: PlannerItem) => {
      const nextDone = !item.done;
      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, done: nextDone } : entry)),
      );
      try {
        const response = await fetch(`/api/events/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: nextDone }),
        });
        const data = (await response.json()) as { item?: PlannerItem; error?: string };
        if (!response.ok || !data.item) throw new Error(data.error ?? "更新失敗");
        const saved = data.item;
        setItems((prev) => sortItems(prev.map((entry) => (entry.id === saved.id ? saved : entry))));
      } catch (error) {
        setItems((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, done: item.done } : entry)),
        );
        notify(error instanceof Error ? error.message : "更新失敗", "error");
      }
    },
    [notify],
  );

  const toggleCategory = useCallback((slug: string) => {
    setHidden((prev) => (prev.includes(slug) ? prev.filter((entry) => entry !== slug) : [...prev, slug]));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      if (typing || dialog) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeMonth(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        changeMonth(1);
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openCreate(selectedDate);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeMonth, dialog, openCreate, selectedDate]);

  const heroTitle = view === "year" ? "2027" : MONTH_NAMES[monthIndex];
  const heroSubtitle =
    view === "year"
      ? "一整年的節奏，寫在同一頁。"
      : view === "agenda"
        ? "把全年行程攤開來看，掌握每一件事。"
        : "每個月一頁，寫下你的待辦。";

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-line/80 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-accent text-paper shadow-[0_10px_22px_-13px_rgba(238,90,38,0.95)]">
              <CalendarIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="leading-none">
              <p className="font-display text-[13.5px] tracking-[-0.01em] text-ink">WARM PLANNER</p>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.26em] text-muted">2027 · 行事曆</p>
            </div>
          </div>

          <div className="order-3 flex w-full items-center rounded-full border border-line bg-paper/80 p-1 sm:order-none sm:ml-2 sm:w-auto">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:flex-none ${
                  view === tab.value
                    ? "bg-accent text-white shadow-[0_8px_16px_-12px_rgba(238,90,38,0.9)]"
                    : "text-muted hover:text-ink/70"
                }`}
              >
                {tab.value === "month" ? (
                  <CalendarIcon className="h-3 w-3" />
                ) : tab.value === "year" ? (
                  <Grid className="h-3 w-3" />
                ) : (
                  <ListIcon className="h-3 w-3" />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative flex h-8 items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋行程…"
                aria-label="搜尋行程"
                className="field !h-8 w-[132px] !rounded-full !py-0 !pl-8 !pr-7 !text-[11.5px] transition-[width] focus:!w-[168px] sm:!w-[168px] sm:focus:!w-[214px]"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="清除搜尋"
                  onClick={() => setQuery("")}
                  className="absolute right-2 grid h-4 w-4 place-items-center rounded-full text-muted hover:text-accent"
                >
                  <Close className="h-2.5 w-2.5" />
                </button>
              ) : null}
            </div>
            <a href="/api/export" className="icon-btn hidden sm:grid" title="匯出 .ics 行事曆" aria-label="匯出 .ics">
              <Download className="h-3.5 w-3.5" />
            </a>
            <button type="button" onClick={() => openCreate(selectedDate)} className="btn-accent">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">新增行程</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 pb-14 pt-5 lg:px-8">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.3em] text-accent">
              <Sparkle className="h-3 w-3" /> Annual Planner · 2027
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-[0.86] tracking-[-0.045em] text-accent">
              {heroTitle}
            </h1>
            <p className="mt-2.5 text-[11.5px] text-ink/65">
              <span className="font-semibold text-accent">2027</span>
              <span className="mx-1.5 text-line">|</span>
              {heroSubtitle}
            </p>
          </div>

          <div className="hidden items-stretch gap-2 md:flex">
            <div className="min-w-[104px] rounded-2xl border border-line bg-paper/90 px-3.5 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">本月安排</p>
              <p className="mt-1 font-display text-[21px] leading-none text-ink">
                {pad2(currentMonthItems.length)}
                <span className="ml-1 font-sans text-[9.5px] font-medium text-muted">項</span>
              </p>
            </div>
            <div className="min-w-[104px] rounded-2xl border border-line bg-paper/90 px-3.5 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">本月待辦</p>
              <p className="mt-1 font-display text-[21px] leading-none text-ink">
                {pad2(monthDoneTasks)}
                <span className="ml-0.5 font-sans text-[10px] font-medium text-muted">/{pad2(monthTasks.length)}</span>
              </p>
            </div>
            <div className="min-w-[104px] rounded-2xl border border-accent/25 bg-accent-soft/40 px-3.5 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent/80">年度完成率</p>
              <p className="mt-1 font-display text-[21px] leading-none text-accent">
                {yearPct}
                <span className="ml-0.5 font-sans text-[10px] font-medium">%</span>
              </p>
            </div>
          </div>
        </section>

        <div className="no-print mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scroll-thin xl:hidden">
          {MONTH_NAMES.map((name, index) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                selectMonth(index);
                setView("month");
              }}
              className={`shrink-0 rounded-full border px-3 py-1 text-[10.5px] font-semibold transition ${
                index === monthIndex && view === "month"
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-paper/80 text-ink/60 hover:border-accent/40 hover:text-accent"
              }`}
            >
              {pad2(index + 1)} <span className="text-[9px] font-normal opacity-70">{MONTH_NAMES_TC[index]}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[216px_minmax(0,1fr)_318px]">
          <aside className="no-print hidden xl:block">
            <div className="sticky top-[82px]">
              <YearRail
                monthIndex={monthIndex}
                counts={monthCounts}
                total={items.length}
                done={yearDone}
                onSelectMonth={(index) => {
                  selectMonth(index);
                  setView("month");
                }}
                onYearView={() => setView("year")}
                onPrint={() => window.print()}
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {query ? (
              <section className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <div>
                    <h2 className="font-display text-[20px] leading-none tracking-tight text-accent">搜尋結果</h2>
                    <p className="mt-1.5 text-[10.5px] text-muted">
                      「{query}」共 {filteredItems.length} 筆
                    </p>
                  </div>
                  <button type="button" onClick={() => setQuery("")} className="btn-ghost">
                    <Close className="h-3 w-3" /> 清除搜尋
                  </button>
                </div>
                <div className="max-h-[62vh] space-y-4 overflow-y-auto scroll-thin border-t border-line px-4 py-4 sm:px-5">
                  {searchGroups.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[11.5px] text-muted">
                      找不到符合的行程，換個關鍵字試試。
                    </p>
                  ) : (
                    searchGroups.map((group) => (
                      <div key={group.monthIndex}>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[15px] leading-none text-accent">
                            {pad2(group.monthIndex + 1)}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/55">
                            {MONTH_NAMES[group.monthIndex]}
                          </span>
                          <span className="h-px flex-1 bg-line" />
                          <span className="text-[9.5px] text-muted">{group.items.length} 筆</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {group.items.map((item) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              category={categoryOf(categoryLookup, item.categorySlug)}
                              onToggle={toggleDone}
                              onEdit={openEdit}
                              showDate
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : view === "month" ? (
              <MonthPanel
                monthIndex={monthIndex}
                items={visibleItems}
                selectedDate={selectedDate}
                categories={categoryLookup}
                onSelectDate={selectDate}
                onOpenCreate={openCreate}
                onEdit={openEdit}
                onChangeMonth={changeMonth}
                onYearView={() => setView("year")}
              />
            ) : view === "year" ? (
              <YearPanel items={visibleItems} selectedDate={selectedDate} onPickDate={pickYearDate} />
            ) : (
              <AgendaPanel
                items={visibleItems}
                categories={categoryLookup}
                onToggle={toggleDone}
                onEdit={openEdit}
                onJumpMonth={jumpToMonth}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <p className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                <Flag className="h-3 w-3 text-accent/70" />
                資料儲存於 PostgreSQL · 重新整理後仍會保留
              </p>
              <p className="text-[10px] text-muted">
                快捷鍵：<kbd className="rounded border border-line bg-paper px-1">←</kbd>{" "}
                <kbd className="rounded border border-line bg-paper px-1">→</kbd> 換月 ·{" "}
                <kbd className="rounded border border-line bg-paper px-1">N</kbd> 新增
              </p>
            </div>
          </div>

          <aside className="no-print space-y-3">
            <DayRail
              selectedDate={selectedDate}
              items={selectedDayItems}
              categories={categoryLookup}
              onToggle={toggleDone}
              onEdit={openEdit}
              onCreate={openCreate}
            />
            <TodoRail
              monthIndex={monthIndex}
              tasks={monthTasks}
              eventCount={monthEventCount}
              categories={categoryLookup}
              onToggle={toggleDone}
              onEdit={openEdit}
              onCreate={(iso) => openCreate(iso, "task")}
            />
            <CategoryRail
              categories={categories}
              counts={categoryCounts}
              hidden={hidden}
              onToggle={toggleCategory}
              onReset={() => setHidden([])}
            />
          </aside>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line/80 pt-4 text-[10px] text-muted">
          <p className="font-display tracking-[0.22em] text-accent/70">WARM PLANNER · 2027</p>
          <p>每個月一頁，寫下你的待辦 · {items.length} 個項目 · {yearDone} 件完成</p>
        </footer>
      </main>

      {dialog ? (
        <EventDialog
          key={dialog.token}
          draft={dialog.draft}
          editingId={dialog.editingId}
          categories={categoryLookup}
          categoryList={categories}
          pending={pending}
          onClose={() => {
            if (!pending) setDialog(null);
          }}
          onSave={saveItem}
          onDelete={removeItem}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 animate-pop rounded-full px-4 py-2 text-[11.5px] font-semibold shadow-[0_16px_40px_-18px_rgba(40,20,10,0.7)] ${
            toast.tone === "ok" ? "bg-ink text-paper" : "bg-[#b23a24] text-white"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
