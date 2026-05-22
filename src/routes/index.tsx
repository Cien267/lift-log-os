import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Flame, TrendingUp, Calendar, Dumbbell, Play, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { formatDuration, formatWeight, getWeekStart } from "@/lib/analytics";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Forge" },
      {
        name: "description",
        content: "Your training overview: streaks, PRs, weekly volume, and what's next.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useSettings();
  const workouts =
    useLiveQuery(() => db.workouts.orderBy("startTime").reverse().limit(50).toArray()) ?? [];
  const prs = useLiveQuery(() => db.prs.orderBy("date").reverse().limit(5).toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const measurements =
    useLiveQuery(() => db.measurements.orderBy("date").reverse().limit(2).toArray()) ?? [];

  const weekStart = getWeekStart();
  const weekWorkouts = workouts.filter((w) => w.startTime >= weekStart.getTime() && w.endTime);
  const weekVolume = weekWorkouts.reduce((a, w) => a + (w.totalVolume ?? 0), 0);
  const streak = computeStreak(workouts.map((w) => w.date));
  const last = workouts.find((w) => w.endTime);
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const bw = measurements[0]?.weight;
  const bwPrev = measurements[1]?.weight;

  return (
    <AppShell title="Forge">
      <div className="space-y-4">
        <HeroCard streak={streak} />

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="This week"
            value={String(weekWorkouts.length)}
            sub="sessions"
            icon={Calendar}
          />
          <Stat
            label="Volume"
            value={formatWeight(Math.round(weekVolume))}
            sub="this week"
            icon={TrendingUp}
          />
          <Stat
            label="Last session"
            value={last ? formatDuration(last.durationSec ?? 0) : "—"}
            sub={last?.date ?? "no data"}
            icon={Dumbbell}
          />
          <Stat
            label="Bodyweight"
            value={bw ? formatWeight(bw) : "—"}
            sub={
              bw && bwPrev ? `${bw > bwPrev ? "+" : ""}${(bw - bwPrev).toFixed(1)} kg` : "log it"
            }
            icon={TrendingUp}
          />
        </div>

        <Section
          title="Recent PRs"
          right={
            <Link to="/analytics" className="text-xs text-muted-foreground">
              View all
            </Link>
          }
        >
          {prs.length === 0 ? (
            <Empty hint="Finish a workout to start logging PRs." />
          ) : (
            <ul className="divide-y divide-border">
              {prs.map((pr) => (
                <li key={pr.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {exMap.get(pr.exerciseId)?.name ?? "Exercise"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pr.type === "weight"
                        ? `${formatWeight(pr.value)} max`
                        : pr.type === "e1rm"
                          ? `${formatWeight(Math.round(pr.value))} e1RM`
                          : `${formatWeight(Math.round(pr.value))} volume`}
                    </p>
                  </div>
                  <span className="num text-xs text-muted-foreground">{pr.date}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent activity">
          {workouts.length === 0 ? (
            <Empty hint="Tap Start workout to begin." />
          ) : (
            <ul className="divide-y divide-border">
              {workouts.slice(0, 6).map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground/80">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {w.name ?? `${w.location} workout`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.date} · {w.endTime ? formatDuration(w.durationSec ?? 0) : "in progress"}
                    </p>
                  </div>
                  <span className="num text-xs text-muted-foreground">
                    {w.totalVolume ? formatWeight(Math.round(w.totalVolume)) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </AppShell>
  );
}

function HeroCard({ streak }: { streak: number }) {
  return (
    <Link to="/workout" className="block">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-surface-elevated to-surface p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Today</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
              Train with intent.
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-warning" />
              <span className="num">{streak}</span> day streak
            </p>
          </div>
          <Button size="lg" className="shrink-0 gap-2">
            <Play className="h-4 w-4 fill-current" />
            Start
          </Button>
        </div>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="num mt-1.5 text-xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="num text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card px-4 pb-2 pt-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/90">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Empty({ hint }: { hint: string }) {
  return <p className="py-4 text-center text-xs text-muted-foreground">{hint}</p>;
}

function computeStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  while (true) {
    const k = cur.toISOString().slice(0, 10);
    if (set.has(k)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (streak === 0) {
      cur.setDate(cur.getDate() - 1);
      // allow today to be skipped
      const k2 = cur.toISOString().slice(0, 10);
      if (!set.has(k2)) break;
    } else break;
  }
  return streak;
}
