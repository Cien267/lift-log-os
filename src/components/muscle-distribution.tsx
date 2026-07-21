import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Sparkles } from "lucide-react";
import { db, type MuscleGroup } from "@/lib/db";
import { computeWorkoutAggregate, formatWeight, getWeekStart } from "@/lib/analytics";
import { useT } from "@/lib/i18n";

type Bucket = "legs" | "back" | "chest" | "shoulders" | "arms" | "core" | "cardio";

const GROUP: Record<MuscleGroup, Bucket> = {
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  back: "back",
  chest: "chest",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  core: "core",
  cardio: "cardio",
};

// Muted, premium palette — Apple Fitness / Linear inspired.
const COLORS: Record<Bucket, { from: string; to: string; solid: string; label: string }> = {
  legs: { from: "#34d399", to: "#059669", solid: "#10b981", label: "Legs" },
  back: { from: "#60a5fa", to: "#2563eb", solid: "#3b82f6", label: "Back" },
  chest: { from: "#fb923c", to: "#ea580c", solid: "#f97316", label: "Chest" },
  shoulders: { from: "#fde047", to: "#ca8a04", solid: "#eab308", label: "Shoulders" },
  arms: { from: "#c084fc", to: "#7c3aed", solid: "#a855f7", label: "Arms" },
  core: { from: "#67e8f9", to: "#0891b2", solid: "#06b6d4", label: "Core" },
  cardio: { from: "#94a3b8", to: "#475569", solid: "#64748b", label: "Cardio" },
};

const ORDER: Bucket[] = ["legs", "back", "chest", "shoulders", "arms", "core", "cardio"];

export function MuscleDistribution() {
  const { t } = useT();
  const [data, setData] = useState<{ bucket: Bucket; value: number }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weekStart = getWeekStart().getTime();
      const workouts = await db.workouts.where("startTime").aboveOrEqual(weekStart).toArray();
      const done = workouts.filter((w) => w.endTime);
      const totals: Partial<Record<Bucket, number>> = {};
      for (const w of done) {
        const agg = await computeWorkoutAggregate(w.id);
        for (const [mg, vol] of Object.entries(agg.muscleVolume)) {
          const b = GROUP[mg as MuscleGroup];
          totals[b] = (totals[b] ?? 0) + (vol ?? 0);
        }
      }
      if (cancelled) return;
      const arr = ORDER.map((b) => ({ bucket: b, value: Math.round(totals[b] ?? 0) })).filter(
        (d) => d.value > 0,
      );
      setData(arr);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = data?.reduce((a, d) => a + d.value, 0) ?? 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground/90">
            {t("common.muscleDistribution")}
          </h3>
          <p className="text-[11px] text-muted-foreground">{t("home.thisWeek")}</p>
        </div>
        {total > 0 && (
          <span className="num text-[11px] text-muted-foreground">
            {formatWeight(total)} {t("muscleDistribution.totalVolume")}
          </span>
        )}
      </div>

      {data === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      ) : data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,60%)_1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {ORDER.map((b) => (
                    <linearGradient key={b} id={`md-grad-${b}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={COLORS[b].from} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={COLORS[b].to} stopOpacity={0.95} />
                    </linearGradient>
                  ))}
                  <filter id="md-soft" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.2" />
                  </filter>
                </defs>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="bucket"
                  innerRadius="68%"
                  outerRadius="98%"
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                  animationDuration={700}
                >
                  {data.map((d) => (
                    <Cell key={d.bucket} fill={`url(#md-grad-${d.bucket})`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-2xl font-semibold tracking-tight">{data.length}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("muscleDistribution.muscleGroup")}
              </span>
            </div>
          </div>

          <ul className="space-y-2">
            {data
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((d) => {
                const pct = Math.round((d.value / total) * 100);
                const c = COLORS[d.bucket];
                return (
                  <li key={d.bucket} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                      }}
                    />
                    <span className="flex-1 truncate text-sm text-foreground/90">{c.label}</span>
                    <span className="num w-9 text-right text-sm font-medium tabular-nums">
                      {pct}%
                    </span>
                    <span className="num w-16 text-right text-[11px] text-muted-foreground tabular-nums">
                      {formatWeight(d.value)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="relative grid h-14 w-14 place-items-center rounded-full border border-border bg-gradient-to-br from-surface-elevated to-surface">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground/90">{t("muscleDistribution.empty")}</p>
      <p className="max-w-[24ch] text-xs text-muted-foreground">
        {t("muscleDistribution.emptyMessage")}
      </p>
    </div>
  );
}
