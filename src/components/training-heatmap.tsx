import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "@tanstack/react-router";
import { db } from "@/lib/db";
import { formatWeight, formatMinutes } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type RangeKey = "3m" | "6m" | "12m";

const RANGES: { key: RangeKey; months: number; label: string }[] = [
  { key: "3m", months: 3, label: "3M" },
  { key: "6m", months: 6, label: "6M" },
  { key: "12m", months: 12, label: "12M" },
];

interface DayCell {
  date: string; // YYYY-MM-DD
  sessions: number;
  volume: number;
  cardioMin: number;
  sets: number;
  load: number;
  firstWorkoutId?: string;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const iso = (d: Date) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate(),
  ).padStart(2, "0")}`;
};

/** Sunday-index -> Monday-first index */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export function TrainingHeatmap() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("12m");
  const [active, setActive] = useState<string | null>(null);

  const workouts = useLiveQuery(() => db.workouts.orderBy("startTime").toArray()) ?? [];

  const locale = lang === "vi" ? "vi-VN" : "en-US";

  const { weeks, monthLabels, levels, total } = useMemo(() => {
    const months = RANGES.find((r) => r.key === range)!.months;
    const today = startOfDay(new Date());
    const start = startOfDay(new Date(today));
    start.setMonth(start.getMonth() - months);
    // align to Monday
    start.setDate(start.getDate() - mondayIndex(start));

    const byDate = new Map<string, DayCell>();
    for (const w of workouts) {
      if (!w.endTime) continue;
      const key = w.date;
      const cell =
        byDate.get(key) ??
        ({
          date: key,
          sessions: 0,
          volume: 0,
          cardioMin: 0,
          sets: 0,
          load: 0,
          firstWorkoutId: w.id,
        } as DayCell);
      cell.sessions += 1;
      cell.volume += w.totalVolume ?? 0;
      cell.cardioMin += w.totalCardioMin ?? 0;
      cell.firstWorkoutId ??= w.id;
      byDate.set(key, cell);
    }

    // Training load: strength volume + cardio minutes weighted so a
    // cardio-only session registers meaningfully against lifting volume.
    const cells: DayCell[] = [];
    const cols: DayCell[][] = [];
    let cursor = new Date(start);
    let col: DayCell[] = [];
    while (cursor <= today) {
      const key = iso(cursor);
      const found = byDate.get(key);
      const cell: DayCell =
        found ??
        ({ date: key, sessions: 0, volume: 0, cardioMin: 0, sets: 0, load: 0 } as DayCell);
      cell.load = cell.volume + cell.cardioMin * 100;
      col.push(cell);
      cells.push(cell);
      if (mondayIndex(cursor) === 6) {
        cols.push(col);
        col = [];
      }
      cursor = new Date(cursor.getTime() + 86400_000);
    }
    if (col.length) cols.push(col);

    const loads = cells.filter((c) => c.load > 0).map((c) => c.load).sort((a, b) => a - b);
    const q = (p: number) => (loads.length ? loads[Math.floor((loads.length - 1) * p)] : 0);
    const thresholds = [q(0.25), q(0.5), q(0.75)];

    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    let lastLabelCol = -99;
    cols.forEach((c, i) => {
      const first = c[0];
      if (!first) return;
      const d = new Date(`${first.date}T00:00:00`);
      const m = d.getMonth();
      if (m === lastMonth) return;
      lastMonth = m;
      // only label a column when the month actually starts inside that week,
      // and keep enough spacing so labels never collide
      if (d.getDate() > 7) return;
      if (i - lastLabelCol < 4) return;
      lastLabelCol = i;
      labels.push({
        col: i,
        label: d.toLocaleDateString(locale, { month: "short" }),
      });
    });

    return {
      weeks: cols,
      monthLabels: labels,
      levels: thresholds,
      total: cells.reduce((a, c) => a + c.sessions, 0),
    };
  }, [workouts, range, locale]);

  const levelOf = (cell: DayCell) => {
    if (cell.load <= 0) return 0;
    if (cell.load <= levels[0]!) return 1;
    if (cell.load <= levels[1]!) return 2;
    if (cell.load <= levels[2]!) return 3;
    return 4;
  };

  const activeCell = useMemo(
    () => weeks.flat().find((c) => c.date === active) ?? null,
    [weeks, active],
  );

  const onPick = (cell: DayCell) => {
    setActive((prev) => (prev === cell.date ? null : cell.date));
  };

  const openDay = (cell: DayCell) => {
    if (!cell.firstWorkoutId) return;
    navigate({ to: "/history/$id", params: { id: cell.firstWorkoutId } });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t("analytics.heatmap")}</h2>
          <p className="text-[11px] text-muted-foreground">
            {total} {t("analytics.heatmapSessions")}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-max">
          <div className="mb-1 flex gap-[3px] pl-6">
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.col === i);
              return (
                <div
                  key={i}
                  className="w-[12px] shrink-0 text-[9px] leading-none text-muted-foreground"
                >
                  {label ? <span className="whitespace-nowrap">{label.label}</span> : null}
                </div>
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-5 flex-col gap-[3px] pt-[1px]">
              {["M", "", "W", "", "F", "", "S"].map((d, i) => (
                <span
                  key={i}
                  className="h-[12px] text-[9px] leading-[12px] text-muted-foreground"
                >
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => {
                  const lvl = levelOf(cell);
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      aria-label={cell.date}
                      onMouseEnter={() => setActive(cell.date)}
                      onMouseLeave={() => setActive((p) => (p === cell.date ? null : p))}
                      onClick={() => (cell.sessions ? openDay(cell) : onPick(cell))}
                      onTouchStart={() => onPick(cell)}
                      className={cn(
                        "size-[12px] shrink-0 rounded-[3px] transition-transform",
                        active === cell.date && "ring-1 ring-ring",
                        cell.sessions ? "cursor-pointer active:scale-90" : "cursor-default",
                      )}
                      style={{
                        background:
                          lvl === 0
                            ? "color-mix(in oklab, var(--color-muted) 60%, transparent)"
                            : `color-mix(in oklab, var(--color-primary) ${lvl * 25}%, var(--color-card))`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-h-[34px] flex-1 text-[11px]">
          {activeCell ? (
            <div className="rounded-lg border border-border bg-popover px-2 py-1.5">
              <p className="font-semibold">
                {new Date(`${activeCell.date}T00:00:00`).toLocaleDateString(locale, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-muted-foreground">
                {activeCell.sessions} {t("analytics.heatmapSessions")}
                {activeCell.volume > 0 && ` · ${formatWeight(Math.round(activeCell.volume))}`}
                {activeCell.cardioMin > 0 && ` · ${formatMinutes(activeCell.cardioMin)}`}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">{t("analytics.heatmapHint")}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <span>{t("analytics.heatmapLess")}</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              className="size-[10px] rounded-[3px]"
              style={{
                background:
                  lvl === 0
                    ? "color-mix(in oklab, var(--color-muted) 60%, transparent)"
                    : `color-mix(in oklab, var(--color-primary) ${lvl * 25}%, var(--color-card))`,
              }}
            />
          ))}
          <span>{t("analytics.heatmapMore")}</span>
        </div>
      </div>
    </div>
  );
}
