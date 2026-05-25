import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatDuration, formatWeight, e1rm } from "@/lib/analytics";
import { createTemplateFromWorkout, discardWorkout } from "@/lib/workout-service";
import { useState } from "react";
import { InsightView } from "@/components/workout-insight";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/history/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Workout — Forge` },
      { name: "description", content: `Workout session details for ${params.id}` },
    ],
  }),
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const workout = useLiveQuery(() => db.workouts.get(id), [id]);
  const entries =
    useLiveQuery(() => db.workoutExercises.where("workoutId").equals(id).sortBy("order"), [id]) ??
    [];
  const sets =
    useLiveQuery(
      () =>
        db.workoutSets
          .where("exerciseEntryId")
          .anyOf(entries.map((e) => e.id))
          .toArray(),
      [entries.map((e) => e.id).join(",")],
    ) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const [tplName, setTplName] = useState("");
  const [open, setOpen] = useState(false);

  if (!workout)
    return <div className="p-8 text-center text-sm text-muted-foreground">Not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 pt-safe">
      <header className="flex items-center gap-2 py-3">
        <Button size="icon" variant="ghost" onClick={() => nav({ to: "/history" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{workout.name ?? `${workout.location} workout`}</h1>
          <p className="num text-xs text-muted-foreground">
            {workout.date} · {formatDuration(workout.durationSec ?? 0)} ·{" "}
            {formatWeight(Math.round(workout.totalVolume ?? 0))}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost">
              <Save className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%]">
            <DialogHeader>
              <DialogTitle>Save as a new plan</DialogTitle>
            </DialogHeader>
            <Input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Plan name"
            />
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (tplName.trim()) {
                    await createTemplateFromWorkout(id, tplName.trim());
                    setTplName("");
                    setOpen(false);
                  }
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          size="icon"
          variant="ghost"
          onClick={async () => {
            await discardWorkout(id);
            nav({ to: "/history" });
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </header>

      {workout.insight && (
        <div className="mb-4">
          <InsightView insight={workout.insight} />
        </div>
      )}

      <div className="space-y-3">
        {entries.map((e) => {
          const ex = exMap.get(e.exerciseId);
          const entrySets = sets
            .filter((s) => s.exerciseEntryId === e.id)
            .sort((a, b) => a.timestamp - b.timestamp);
          const best = entrySets
            .filter((s) => s.completed)
            .reduce((m, s) => Math.max(m, e1rm(s.weight, s.reps)), 0);
          return (
            <section key={e.id} className="rounded-2xl border border-border bg-card p-3">
              <header className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{ex?.name}</h2>
                  <p className="text-[11px] capitalize text-muted-foreground">{ex?.muscleGroup}</p>
                </div>
                {best > 0 && (
                  <span className="num text-xs text-muted-foreground">
                    e1RM {formatWeight(Math.round(best))}
                  </span>
                )}
              </header>
              <ul className="space-y-1">
                {entrySets.map((s, i) => (
                  <li
                    key={s.id}
                    className={
                      "num grid grid-cols-[24px_1fr_1fr] gap-2 rounded-md px-2 py-1.5 text-sm " +
                      (s.completed ? "bg-primary/5" : "opacity-50")
                    }
                  >
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                    <span>{formatWeight(s.weight)}</span>
                    <span>{s.reps} reps</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
