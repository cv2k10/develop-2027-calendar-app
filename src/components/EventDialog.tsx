"use client";

import { useEffect, useState } from "react";
import { categoryOf, type CategoryLookup, type Draft } from "./shared";
import { Close, Sparkle, Trash } from "./icons";
import { YEAR, formatDateFull } from "@/lib/calendar";

type Props = {
  draft: Draft;
  editingId: number | null;
  categories: CategoryLookup;
  categoryList: { slug: string; name: string; color: string }[];
  pending: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
  onDelete: (id: number) => void;
};

export function EventDialog({
  draft,
  editingId,
  categories,
  categoryList,
  pending,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Draft>(draft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(draft);
    setError(null);
  }, [draft]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const activeCategory = categoryOf(categories, form.categorySlug);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!form.title.trim()) {
      setError("請先寫下行程名稱");
      return;
    }
    if (form.eventDate < `${YEAR}-01-01` || form.eventDate > `${YEAR}-12-31`) {
      setError("2027 行事曆僅收錄 2027 年的日期");
      return;
    }
    if (!form.allDay && form.startTime && form.endTime && form.endTime < form.startTime) {
      setError("結束時間不能早於開始時間");
      return;
    }
    onSave({ ...form, title: form.title.trim(), notes: form.notes.trim() });
  }

  const weekdayLabel = form.eventDate.length === 10 ? formatDateFull(form.eventDate) : "選擇日期";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3 pt-10 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="關閉視窗"
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-ink/35 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editingId ? "編輯行程" : "新增行程"}
        className="animate-pop relative z-10 max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-[26px] border border-line bg-paper p-5 shadow-[0_40px_90px_-30px_rgba(60,30,15,0.55)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.28em] text-accent">
              <Sparkle className="h-3 w-3" /> {editingId ? "EDIT ENTRY" : "NEW ENTRY"}
            </p>
            <h2 className="mt-1.5 font-display text-[24px] font-black leading-none tracking-tight text-ink">
              {editingId ? "編輯行程" : "新增行程"}
            </h2>
            <p className="mt-1.5 text-[11.5px] text-muted">
              2027 · {weekdayLabel}
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="關閉">
            <Close className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="inline-flex w-full rounded-full border border-line bg-cream/50 p-1">
            {(
              [
                { value: "event", label: "行程", hint: "有時間的約定" },
                { value: "task", label: "待辦", hint: "想完成的事" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update("kind", option.value)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                  form.kind === option.value ? "bg-paper text-accent shadow-sm" : "text-muted hover:text-ink/70"
                }`}
              >
                {option.label}
                <span className="ml-1.5 hidden text-[9.5px] font-normal opacity-70 sm:inline">{option.hint}</span>
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="event-title" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              名稱
            </label>
            <input
              id="event-title"
              autoFocus
              value={form.title}
              maxLength={120}
              onChange={(event) => update("title", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="例：季報截止、健身、和家人晚餐"
              className="field !py-2.5 !text-[15px] font-medium"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="event-date" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                日期
              </label>
              <input
                id="event-date"
                type="date"
                min={`${YEAR}-01-01`}
                max={`${YEAR}-12-31`}
                value={form.eventDate}
                onChange={(event) => update("eventDate", event.target.value)}
                className="field"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">時間</span>
              <button
                type="button"
                onClick={() => update("allDay", !form.allDay)}
                className={`flex w-full items-center justify-between rounded-[14px] border px-3 py-2.5 text-[12px] font-medium transition ${
                  form.allDay
                    ? "border-line bg-cream/40 text-ink/70"
                    : "border-accent/40 bg-accent-soft/40 text-accent"
                }`}
              >
                <span>{form.allDay ? "全天行程" : "指定時間"}</span>
                <span
                  className={`relative h-4 w-7 rounded-full transition ${form.allDay ? "bg-[#dccabd]" : "bg-accent"}`}
                >
                  <span
                    className={`absolute top-[2px] h-3 w-3 rounded-full bg-white transition-all ${
                      form.allDay ? "left-[2px]" : "left-[14px]"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {!form.allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="event-start" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  開始
                </label>
                <input
                  id="event-start"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => update("startTime", event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="event-end" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  結束
                </label>
                <input
                  id="event-end"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => update("endTime", event.target.value)}
                  className="field"
                />
              </div>
            </div>
          ) : null}

          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">分類</span>
            <div className="flex flex-wrap gap-1.5">
              {categoryList.map((category) => {
                const selected = form.categorySlug === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => update("categorySlug", category.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition"
                    style={{
                      borderColor: selected ? category.color : "#ecdfd4",
                      background: selected ? `${category.color}14` : "#fffdfb",
                      color: selected ? category.color : "#7b6a5f",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: category.color }} />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="event-notes" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              備註
            </label>
            <textarea
              id="event-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="地點、需要帶的東西、提醒自己的事…"
              className="field resize-none"
            />
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={() => update("done", !form.done)}
              className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink/70 transition hover:border-accent/40 hover:text-accent"
            >
              <span
                className="grid h-3.5 w-3.5 place-items-center rounded-full border"
                style={{
                  borderColor: form.done ? activeCategory.color : "#dccabd",
                  background: form.done ? activeCategory.color : "transparent",
                }}
              >
                {form.done ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
              </span>
              {form.done ? "已完成" : "標示為完成"}
            </button>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-[#fdeceb] px-3 py-2 text-[11.5px] text-[#b23a24]">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          {editingId ? (
            <button
              type="button"
              onClick={() => onDelete(editingId)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-[#b23a24] transition hover:bg-[#fdeceb]"
            >
              <Trash className="h-3.5 w-3.5" /> 刪除
            </button>
          ) : (
            <span className="text-[10.5px] text-muted">Esc 關閉 · Enter 儲存</span>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              取消
            </button>
            <button type="button" onClick={submit} disabled={pending} className="btn-accent !px-4 !py-2 !text-[12px]">
              {pending ? "儲存中…" : editingId ? "儲存變更" : "加入行事曆"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


