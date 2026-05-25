import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Plus, Trash2, MoreVertical, Minus, Copy, Flame, X, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { db, type WorkoutSet } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  addExerciseToWorkout,
  addSet,
  deleteSet,
  discardWorkout,
  finishWorkout,
  getLastPerformance,
  removeExerciseFromWorkout,
  updateSet,
} from "@/lib/workout-service";
import { RestTimerBar, startRest } from "@/components/rest-timer";
import { ExercisePicker } from "@/components/exercise-picker";
import { InsightView } from "@/components/workout-insight";
import type { WorkoutInsight } from "@/lib/insight";
import { formatDuration, formatWeight } from "@/lib/analytics";
import { useSettings } from "@/hooks/use-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const search = z.object({ id: z.string() });

export const Route = createFileRoute("/workout/active")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Active workout — Forge" },
      { name: "description", content: "Log sets, rest, and crush PRs in live workout mode." },
    ],
  }),
  component: ActiveWorkoutPage,
});

function ActiveWorkoutPage() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const { settings } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [insight, setInsight] = useState<WorkoutInsight | null>(null);

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
  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  useEffect(() => {
    if (!workout) return;
    setElapsed(Math.max(0, Math.floor((Date.now() - workout.startTime) / 1000)));
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - workout.startTime) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [workout?.startTime]);

  if (!workout) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Workout not found.</div>;
  }

  const totalVolume = sets.filter((s) => s.completed).reduce((a, s) => a + s.weight * s.reps, 0);
  const completedSets = sets.filter((s) => s.completed).length;

  const onPick = async (exerciseId: string) => {
    await addExerciseToWorkout(id, exerciseId);
  };

  const onFinish = async () => {
    const result = await finishWorkout(id);
    if (result) setInsight(result);
    else nav({ to: "/history" });
  };

  const onDiscard = async () => {
    await discardWorkout(id);
    nav({ to: "/" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-30 glass border-b border-border pt-safe">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/" })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {workout.name ?? `${workout.location} workout`}
            </p>
            <p className="num text-[11px] text-muted-foreground">
              {formatDuration(elapsed)} · {completedSets} sets ·{" "}
              {formatWeight(Math.round(totalVolume))}
            </p>
          </div>
          <Button size="sm" onClick={onFinish} className="gap-1.5">
            <Check className="h-4 w-4" />
            Finish
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95%]">
              <AlertDialogHeader>
                <AlertDialogTitle>Discard workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all sets logged in this session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep training</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDiscard}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-3 pb-32 pt-3">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No exercises yet.</p>
            <Button onClick={() => setPickerOpen(true)} className="mt-3 gap-1.5">
              <Plus className="h-4 w-4" /> Add exercise
            </Button>
          </div>
        )}

        {entries.map((entry) => {
          const ex = exMap.get(entry.exerciseId);
          const entrySets = sets.filter((s) => s.exerciseEntryId === entry.id);
          return (
            <ExerciseCard
              key={entry.id}
              workoutId={id}
              entryId={entry.id}
              exerciseName={ex?.name ?? "Exercise"}
              muscleGroup={ex?.muscleGroup}
              sets={entrySets}
              defaultRest={entry.restPreset ?? settings?.defaultRest ?? 120}
              targetSets={entry.targetSets}
              onRemove={() => removeExerciseFromWorkout(entry.id)}
            />
          );
        })}

        {entries.length > 0 && (
          <Button variant="outline" onClick={() => setPickerOpen(true)} className="w-full gap-1.5">
            <Plus className="h-4 w-4" /> Add exercise
          </Button>
        )}
      </main>

      <RestTimerBar />
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onPick} />

      {insight && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background pt-safe">
          <header className="sticky top-0 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Workout complete
            </p>
            <h2 className="text-lg font-bold">Your session insight</h2>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <InsightView insight={insight} />
          </div>
          <div className="sticky bottom-0 border-t border-border bg-background/95 p-4 pb-safe backdrop-blur">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setInsight(null);
                nav({ to: "/history" });
              }}
            >
              <Check className="h-4 w-4" /> Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  workoutId,
  entryId,
  exerciseName,
  muscleGroup,
  sets,
  defaultRest,
  targetSets,
  onRemove,
}: {
  workoutId: string;
  entryId: string;
  exerciseName: string;
  muscleGroup?: string;
  sets: WorkoutSet[];
  defaultRest: number;
  targetSets?: number;
  onRemove: () => void;
}) {
  const prefillRef = useRef(false);

  useEffect(() => {
    if (sets.length === 0 && !prefillRef.current) {
      prefillRef.current = true;
      (async () => {
        const entry = await db.workoutExercises.get(entryId);
        if (!entry) return;
        const prev = await getLastPerformance(entry.exerciseId, workoutId);
        const count = Math.max(targetSets ?? 0, prev?.sets.length ?? 0, 1);
        for (let i = 0; i < count; i++) {
          const ref = prev?.sets[i] ?? prev?.sets[prev.sets.length - 1];
          await addSet(entryId, ref ? { weight: ref.weight, reps: ref.reps } : {});
        }
      })();
    }
  }, [sets.length, entryId, workoutId, targetSets]);

  const sorted = [...sets].sort((a, b) => a.timestamp - b.timestamp);

  const onComplete = async (set: WorkoutSet) => {
    const next = !set.completed;
    await updateSet(set.id, { completed: next, timestamp: Date.now() });
    if (next) {
      try {
        navigator.vibrate?.(40);
      } catch (e: any) {
        console.error("Vibration failed:", e);
      }
      startRest(defaultRest);
    }
  };

  const onAdd = async () => {
    const last = sorted[sorted.length - 1];
    await addSet(entryId, last ? { weight: last.weight, reps: last.reps } : {});
  };

  const onDuplicate = async (s: WorkoutSet) => {
    await addSet(entryId, { weight: s.weight, reps: s.reps });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{exerciseName}</h3>
          {muscleGroup && (
            <p className="text-[11px] capitalize text-muted-foreground">{muscleGroup}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRemove} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="px-3">
        <div className="grid grid-cols-[28px_1fr_1fr_44px_44px] items-center gap-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Set</span>
          <span className="text-center">Weight</span>
          <span className="text-center">Reps</span>
          <span />
          <span />
        </div>

        <ul className="space-y-1.5">
          {sorted.map((s, i) => (
            <SetRow
              key={s.id}
              index={i + 1}
              set={s}
              onChange={(patch) => updateSet(s.id, patch)}
              onComplete={() => onComplete(s)}
              onDuplicate={() => onDuplicate(s)}
              onDelete={() => deleteSet(s.id)}
            />
          ))}
        </ul>

        <Button
          onClick={onAdd}
          variant="ghost"
          size="sm"
          className="my-2 w-full justify-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Add set
        </Button>
      </div>
    </section>
  );
}

function SetRow({
  index,
  set,
  onChange,
  onComplete,
  onDuplicate,
  onDelete,
}: {
  index: number;
  set: WorkoutSet;
  onChange: (p: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const done = set.completed;

  return (
    <li
      className={
        "grid grid-cols-[28px_1fr_1fr_44px_44px] items-center gap-2 rounded-lg px-1 py-1 transition-colors " +
        (done ? "bg-primary/10" : "")
      }
    >
      <span className="num text-center text-xs font-bold text-muted-foreground">{index}</span>
      <NumberField
        value={set.weight}
        onChange={(v) => onChange({ weight: v })}
        step={2.5}
        suffix="kg"
      />
      <NumberField value={set.reps} onChange={(v) => onChange({ reps: v })} step={1} />
      <button
        onClick={onComplete}
        className={
          "grid h-9 w-9 place-items-center justify-self-center rounded-lg border transition-all " +
          (done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-secondary text-muted-foreground hover:text-foreground")
        }
        aria-label="Complete set"
      >
        <Check className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="grid h-9 w-9 place-items-center justify-self-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Set options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ isWarmup: !set.isWarmup })}>
            <Flame className="mr-2 h-4 w-4" />
            {set.isWarmup ? "Unmark warmup" : "Mark as warmup"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function NumberField({
  value,
  onChange,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="relative flex items-center rounded-lg border border-border bg-secondary">
      <button
        onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
        className="grid h-9 w-8 place-items-center text-muted-foreground hover:text-foreground"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="num h-9 w-full bg-transparent text-center text-base font-semibold focus:outline-none"
        placeholder="0"
      />
      <button
        onClick={() => onChange(+(value + step).toFixed(2))}
        className="grid h-9 w-8 place-items-center text-muted-foreground hover:text-foreground"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {suffix && (
        <span className="pointer-events-none absolute bottom-0 right-6 text-[8px] uppercase text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
