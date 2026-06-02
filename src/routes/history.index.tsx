import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { formatDuration, formatWeight } from "@/lib/analytics";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

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
  const { settings } = useSettings();
  const lang = settings?.language ?? "en";

  const groups =
    useLiveQuery(async () => {
      const workouts = await db.workouts.orderBy("startTime").reverse().toArray();
      const done = workouts.filter((w) => w.endTime);
      const templateIds = [
        ...new Set(done.map((w) => w.templateId).filter((id): id is string => !!id)),
      ];
      const templates = await db.templates.bulkGet(templateIds);

      const templateMap = new Map(
        templates.filter(Boolean).map((template) => [template!.id, template]),
      );

      const grouped = new Map<
        string,
        Array<
          (typeof done)[number] & {
            template: any;
          }
        >
      >();

      for (const w of done) {
        const month = w.date.slice(0, 7);

        if (!grouped.has(month)) {
          grouped.set(month, []);
        }

        grouped.get(month)!.push({
          ...w,
          template: w.templateId ? templateMap.get(w.templateId) : null,
        });
      }

      return grouped;
    }, []) ?? new Map();
  const isEmpty = groups.size === 0;

  return (
    <AppShell title={t("title.history")}>
      {isEmpty ? (
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
                {list.map((w: any) => (
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
                        <p className="truncate text-sm font-semibold uppercase">
                          {w.name ?? `${w.location} workout`}

                          {w.template?.name && (
                            <span className="text-muted-foreground"> ({w.template.name})</span>
                          )}
                        </p>

                        <p className="num text-xs text-muted-foreground">
                          {formatDate(w.date, lang)} · {formatDuration(w.durationSec ?? 0)} ·{" "}
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
