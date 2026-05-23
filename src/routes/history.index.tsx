import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { formatDuration, formatWeight } from "@/lib/analytics";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/history/")({
  head: () => ({
    meta: [
      { title: "History — Forge" },
      { name: "description", content: "Browse every workout you've completed." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t } = useT();
  const workouts = useLiveQuery(() => db.workouts.orderBy("startTime").reverse().toArray()) ?? [];
  const done = workouts.filter((w) => w.endTime);

  const groups = new Map<string, typeof done>();
  for (const w of done) {
    const month = w.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month)!.push(w);
  }

  return (
    <AppShell title={t("title.history")}>
      {done.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("history.empty")}
        </div>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {new Date(month + "-01").toLocaleDateString(t("common.locale"), {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <ul className="space-y-2">
                {list.map((w) => (
                  <li key={w.id}>
                    <Link
                      to="/history/$id"
                      params={{ id: w.id }}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-surface"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {w.name ?? `${w.location} workout`}
                        </p>
                        <p className="num text-xs text-muted-foreground">
                          {w.date} · {formatDuration(w.durationSec ?? 0)} ·{" "}
                          {formatWeight(Math.round(w.totalVolume ?? 0))}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
