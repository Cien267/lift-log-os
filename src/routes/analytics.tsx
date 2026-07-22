import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { db, type MuscleGroup } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { e1rm, formatWeight, getWeekStart, setVolume } from "@/lib/analytics";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Forge" },
      {
        name: "description",
        content: "Strength progression, volume trends, muscle balance, and insights.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
];

function AnalyticsPage() {
  const { t } = useT();
  const workouts = useLiveQuery(() => db.workouts.orderBy("startTime").toArray()) ?? [];
  const entries = useLiveQuery(() => db.workoutExercises.toArray()) ?? [];
  const sets = useLiveQuery(() => db.workoutSets.toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];

  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  // Weekly volume (last 12 weeks)
  const weeklyVolume = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = getWeekStart();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const w of workouts) {
      if (!w.endTime || !w.totalVolume) continue;
      const ws = getWeekStart(new Date(w.startTime)).toISOString().slice(0, 10);
      if (buckets.has(ws)) buckets.set(ws, buckets.get(ws)! + w.totalVolume);
    }
    return [...buckets.entries()].map(([k, v]) => ({
      week: k.slice(5),
      volume: Math.round(v),
    }));
  }, [workouts]);

  // Muscle volume distribution (last 30 days)
  const muscleVol = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400_000;
    const map: Record<string, number> = {};
    for (const s of sets) {
      if (!s.completed) continue;
      const entry = entryMap.get(s.exerciseEntryId);
      if (!entry) continue;
      const w = workouts.find((w) => w.id === entry.workoutId);
      if (!w || w.startTime < cutoff) continue;
      const ex = exMap.get(entry.exerciseId);
      if (!ex) continue;
      const v = setVolume(s);
      map[ex.muscleGroup] = (map[ex.muscleGroup] ?? 0) + v;
      ex.secondaryMuscles?.forEach((m) => {
        map[m] = (map[m] ?? 0) + v * 0.5;
      });
    }
    return MUSCLES.map((m) => ({ muscle: m.slice(0, 4), volume: Math.round(map[m] ?? 0) }));
  }, [sets, entryMap, workouts, exMap]);

  // Top lifts e1RM trend (top 3 by sessions)
  const topLifts = useMemo(() => {
    const byEx = new Map<string, { date: string; e1rm: number }[]>();
    for (const s of sets) {
      if (!s.completed || s.isWarmup) continue;
      const entry = entryMap.get(s.exerciseEntryId);
      if (!entry) continue;
      const w = workouts.find((w) => w.id === entry.workoutId);
      if (!w?.endTime) continue;
      const v = e1rm(s.weight, s.reps);
      const list = byEx.get(entry.exerciseId) ?? [];
      list.push({ date: w.date, e1rm: v });
      byEx.set(entry.exerciseId, list);
    }
    const top = [...byEx.entries()]
      .map(([id, points]) => ({ id, name: exMap.get(id)?.name ?? "", points }))
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 3);
    for (const t of top) {
      // best per date
      const map = new Map<string, number>();
      for (const p of t.points) map.set(p.date, Math.max(map.get(p.date) ?? 0, p.e1rm));
      t.points = [...map.entries()]
        .map(([date, v]) => ({ date, e1rm: Math.round(v) }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return top;
  }, [sets, entryMap, workouts, exMap]);

  const totalWorkouts = workouts.filter((w) => w.endTime).length;
  const totalVolume = workouts.reduce((a, w) => a + (w.totalVolume ?? 0), 0);
  const consistency = computeConsistency(workouts.map((w) => w.date));

  return (
    <AppShell title={t("title.analytics")}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Mini label={t("analytics.workouts")} value={String(totalWorkouts)} />
          <Mini label={t("common.volume")} value={formatWeight(Math.round(totalVolume))} />
          <Mini label={t("analytics.consistency")} value={`${consistency}%`} />
        </div>

        <Card title={t("analytics.weeklyVolume")} subtitle={t("analytics.last12Weeks")}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={weeklyVolume}>
              <XAxis
                dataKey="week"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="volume" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.muscleVolume")} subtitle={t("analytics.last30Days")}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={muscleVol} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                dataKey="muscle"
                type="category"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="volume" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {topLifts.length > 0 && (
          <Card title={t("analytics.topLifts")} subtitle={t("analytics.e1RM")}>
            <div className="space-y-3">
              {topLifts.map((t) => (
                <div key={t.id}>
                  <p className="mb-1 text-xs font-semibold">{t.name}</p>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={t.points}>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="e1rm"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Insights workouts={workouts} muscleVol={muscleVol} />
      </div>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="num mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Insights({
  workouts,
  muscleVol,
}: {
  workouts: any[];
  muscleVol: { muscle: string; volume: number }[];
}) {
  const { t } = useT();
  const insights: string[] = [];
  const lastWeekStart = getWeekStart();
  const prevWeekStart = new Date(lastWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const lastWeek = workouts.filter((w) => w.startTime >= lastWeekStart.getTime()).length;
  const prevWeek = workouts.filter(
    (w) => w.startTime >= prevWeekStart.getTime() && w.startTime < lastWeekStart.getTime(),
  ).length;
  if (prevWeek > 0 && lastWeek < prevWeek)
    insights.push(
      `${t("analytics.insightFrequencyDrop")} ${lastWeek} ${t("common.from")} ${prevWeek} ${t("common.lastWeek")}.`,
    );
  if (lastWeek >= 4)
    insights.push(
      `${t("analytics.insightStrongWeek")} ${lastWeek} ${t("analytics.insightSessionCompleted")}.`,
    );
  const lows = muscleVol.filter((m) => m.volume === 0);
  if (lows.length > 0)
    insights.push(`${t("analytics.insightNotTrain")} ${lows.map((l) => l.muscle).join(", ")}.`);
  if (insights.length === 0) insights.push("Log a few workouts to unlock personalized insights.");
  return (
    <Card title="Insights">
      <ul className="space-y-1.5 text-sm">
        {insights.map((i, k) => (
          <li key={k} className="text-foreground/90">
            • {i}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function computeConsistency(dates: string[]) {
  const set = new Set(dates);
  let hit = 0;
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (set.has(d.toISOString().slice(0, 10))) hit++;
  }
  return Math.round((hit / 12) * 100); // ~3x/wk goal over 4 wks
}
