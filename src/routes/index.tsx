import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Flame, TrendingUp, Calendar, Dumbbell, Play } from "lucide-react";
import { MuscleDistribution } from "@/components/muscle-distribution";
import { NotificationBell } from "@/components/notification-inbox";
import { db } from "@/lib/db";
import { formatDuration, formatWeight, getWeekStart } from "@/lib/analytics";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Forge" },
      {
        name: "description",
        content: "Your training overview: streaks, PRs, weekly volume, and what's next.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useT();
  useSettings();
  const { settings } = useSettings();
  const lang = settings?.language ?? "en";
  const workouts =
    useLiveQuery(() => db.workouts.orderBy("startTime").reverse().limit(50).toArray()) ?? [];

  const measurements =
    useLiveQuery(() => db.measurements.orderBy("date").reverse().limit(2).toArray()) ?? [];

  const weekStart = getWeekStart();
  const weekWorkouts = workouts.filter((w) => w.startTime >= weekStart.getTime() && w.endTime);
  const weekVolume = weekWorkouts.reduce((a, w) => a + (w.totalVolume ?? 0), 0);
  const weeklyGoal = settings?.weeklyGoal ?? 0;
  const streak = computeStreak(
    workouts.filter((w) => w.endTime).map((w) => w.date),
    weeklyGoal,
  );
  const last = workouts.find((w) => w.endTime);

  const bw = measurements[0]?.weight;
  const bwPrev = measurements[1]?.weight;

  return (
    <AppShell
      title="Forge"
      action={<NotificationBell />}
      header={
        settings?.userName ? (
          <div className="flex items-center justify-between px-4 py-3">
            <Welcome userName={settings.userName} lang={lang} />
            <NotificationBell />
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <HeroCard streak={streak} />

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label={t("home.thisWeek")}
            value={
              weeklyGoal > 0
                ? `${weekWorkouts.length} / ${weeklyGoal}`
                : String(weekWorkouts.length)
            }
            valueChildren={
              <>
                {weeklyGoal > 0 ? (
                  <>
                    <span
                      className={
                        weekWorkouts.length > weeklyGoal
                          ? "text-green-500"
                          : weekWorkouts.length == weeklyGoal
                            ? "text-sky-500"
                            : "text-muted-foreground"
                      }
                    >
                      {weekWorkouts.length}
                    </span>{" "}
                    / {weeklyGoal}
                  </>
                ) : (
                  String(weekWorkouts.length)
                )}
              </>
            }
            sub={t("home.sessions")}
            icon={Calendar}
          />
          <Stat
            label={t("common.volume")}
            value={formatWeight(Math.round(weekVolume))}
            sub={t("home.thisWeek")}
            icon={TrendingUp}
          />
          <Stat
            label={t("home.lastSession")}
            value={last ? formatDuration(last.durationSec ?? 0) : "—"}
            sub={formatDate(last?.date, lang) ?? "no data"}
            icon={Dumbbell}
          />
          <Stat
            label={t("common.bodyWeight")}
            value={bw ? formatWeight(bw) : "—"}
            sub={
              bw && settings?.targetWeight
                ? `${t("body.target")} ${formatWeight(settings.targetWeight)} · ${bw - settings.targetWeight > 0 ? "+" : ""}${(bw - settings.targetWeight).toFixed(1)} kg`
                : bw && bwPrev
                  ? `${bw > bwPrev ? "+" : ""}${(bw - bwPrev).toFixed(1)} kg`
                  : "log it"
            }
            icon={TrendingUp}
          />
        </div>

        <MuscleDistribution />

        <Section title={t("home.recentActivity")}>
          {workouts.length === 0 ? (
            <Empty hint={t("home.recentActivityHint")} />
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
                      {formatDate(w.date, lang)} ·{" "}
                      {w.endTime ? formatDuration(w.durationSec ?? 0) : "in progress"}
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

function Welcome({ userName, lang }: { userName: string; lang: string }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? lang === "en"
        ? "Good morning"
        : "Chào ngày mới"
      : hour < 18
        ? lang === "en"
          ? "Good afternoon"
          : "Buổi chiều vui vẻ"
        : lang === "en"
          ? "Good evening"
          : "Buổi tối vui vẻ";

  return (
    <div className="flex min-w-0 items-center justify-start text-lg font-semibold tracking-tight">
      {greeting}
      <span className="truncate max-w-1/2">{`, ${userName}`}</span> 👋
    </div>
  );
}

function HeroCard({ streak }: { streak: number }) {
  const { t } = useT();
  return (
    <Link to="/workout" className="block">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-surface-elevated to-surface p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("home.today")}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
              {t("home.slogan")}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-warning" />
              <span className="num">{streak}</span> {t("home.streak")}
            </p>
          </div>
          <Button size="lg" className="shrink-0 gap-2">
            <Play className="h-4 w-4 fill-current" />
            {t("common.start")}
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
  valueChildren,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  valueChildren?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="num mt-1.5 text-xl font-semibold tracking-tight">{valueChildren ?? value}</p>
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

function computeStreak(dates: string[], weeklyGoal: number) {
  // Day-streak fallback when no weekly goal is configured.
  if (!weeklyGoal || weeklyGoal <= 0) {
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
        const k2 = cur.toISOString().slice(0, 10);
        if (!set.has(k2)) break;
      } else break;
    }
    return streak;
  }

  // Week-streak: count consecutive weeks (Mon–Sun) hitting the weekly goal.
  // The current week is in progress: if it has not yet met the goal it does
  // not break the streak, it just doesn't add to it.
  const counts = new Map<string, number>();
  for (const d of dates) {
    const ws = getWeekStart(new Date(d));
    const key = ws.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let streak = 0;
  const cur = getWeekStart();
  const curKey = cur.toISOString().slice(0, 10);
  if ((counts.get(curKey) ?? 0) >= weeklyGoal) {
    streak++;
  }
  cur.setDate(cur.getDate() - 7);
  while ((counts.get(cur.toISOString().slice(0, 10)) ?? 0) >= weeklyGoal) {
    streak++;
    cur.setDate(cur.getDate() - 7);
  }
  return streak;
}
