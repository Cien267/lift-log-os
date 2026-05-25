import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Play, Home, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getActiveWorkoutId, startWorkout } from "@/lib/workout-service";
import { useSettings } from "@/hooks/use-settings";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Workout — Forge" },
      { name: "description", content: "Start a new workout from a template or empty session." },
    ],
  }),
  component: WorkoutLanding,
});

function WorkoutLanding() {
  const { t } = useT();
  const nav = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const templates = useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray()) ?? [];
  useSettings();

  useEffect(() => {
    const id = getActiveWorkoutId();
    if (id) {
      nav({ to: "/workout/active", search: { id } as any });
    } else {
      setActive(null);
    }
  }, []);

  const begin = async (opts: { location: "gym" | "home"; templateId?: string }) => {
    const id = await startWorkout(opts);
    nav({ to: "/workout/active", search: { id } as any });
  };

  return (
    <AppShell title={t("title.startWorkout")}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => begin({ location: "gym" })}
            className="group rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-card p-4 text-left transition-transform active:scale-95"
          >
            <Building2 className="h-6 w-6 text-primary" />
            <p className="mt-3 text-sm font-semibold">{t("common.empty")} · Gym</p>
            <p className="text-xs text-muted-foreground">{t("workout.startFresh")}</p>
          </button>
          <button
            onClick={() => begin({ location: "home" })}
            className="group rounded-2xl border border-border bg-gradient-to-br from-accent/15 to-card p-4 text-left transition-transform active:scale-95"
          >
            <Home className="h-6 w-6 text-accent" />
            <p className="mt-3 text-sm font-semibold">{t("common.empty")} · Home</p>
            <p className="text-xs text-muted-foreground">{t("workout.startFresh")}</p>
          </button>
        </div>

        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("workout.fromTemplate")}
          </h2>
          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {t("workout.emptyTemplate")}
            </div>
          ) : (
            <ul className="space-y-2">
              {templates.map((temp) => (
                <li key={temp.id}>
                  <button
                    onClick={() =>
                      begin({ location: temp.location as "gym" | "home", templateId: temp.id })
                    }
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-surface"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{temp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {temp.exercises.length} exercises · {temp.location}
                      </p>
                    </div>
                    <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium">
                      {t("common.start")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
