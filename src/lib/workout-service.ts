import { db, uid, type Workout, type WorkoutExercise, type WorkoutSet, type WorkoutTemplate, type PersonalRecord } from "./db";
import { computeWorkoutAggregate, e1rm, estimateCalories } from "./analytics";

const ACTIVE_KEY = "forge.activeWorkoutId";

export const getActiveWorkoutId = () =>
  typeof localStorage !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;

export const setActiveWorkoutId = (id: string | null) => {
  if (typeof localStorage === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
};

export async function startWorkout(opts: { location?: Workout["location"]; templateId?: string; name?: string } = {}) {
  const id = uid();
  const now = Date.now();
  const w: Workout = {
    id,
    date: new Date(now).toISOString().slice(0, 10),
    startTime: now,
    location: opts.location ?? "gym",
    templateId: opts.templateId,
    name: opts.name,
  };
  await db.workouts.add(w);
  if (opts.templateId) {
    const t = await db.templates.get(opts.templateId);
    if (t) {
      for (const te of t.exercises) {
        await db.workoutExercises.add({
          id: uid(),
          workoutId: id,
          exerciseId: te.exerciseId,
          order: te.order,
          restPreset: te.restPreset,
          supersetGroup: te.supersetGroup,
        });
      }
    }
  }
  setActiveWorkoutId(id);
  return id;
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const existing = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  const entry: WorkoutExercise = {
    id: uid(),
    workoutId,
    exerciseId,
    order: existing.length,
  };
  await db.workoutExercises.add(entry);
  return entry;
}

export async function removeExerciseFromWorkout(entryId: string) {
  const sets = await db.workoutSets.where("exerciseEntryId").equals(entryId).primaryKeys();
  await db.workoutSets.bulkDelete(sets);
  await db.workoutExercises.delete(entryId);
}

export async function addSet(entryId: string, init?: Partial<WorkoutSet>) {
  const s: WorkoutSet = {
    id: uid(),
    exerciseEntryId: entryId,
    weight: init?.weight ?? 0,
    reps: init?.reps ?? 0,
    rir: init?.rir,
    rpe: init?.rpe,
    restTime: init?.restTime,
    completed: false,
    isWarmup: init?.isWarmup,
    notes: init?.notes,
    timestamp: Date.now(),
  };
  await db.workoutSets.add(s);
  return s;
}

export async function updateSet(id: string, patch: Partial<WorkoutSet>) {
  await db.workoutSets.update(id, patch);
}

export async function deleteSet(id: string) {
  await db.workoutSets.delete(id);
}

export async function getLastPerformance(exerciseId: string, excludeWorkoutId?: string) {
  const entries = await db.workoutExercises.where("exerciseId").equals(exerciseId).toArray();
  if (entries.length === 0) return null;
  const workouts = await db.workouts.bulkGet([...new Set(entries.map((e) => e.workoutId))]);
  const sorted = entries
    .map((e) => {
      const w = workouts.find((w) => w?.id === e.workoutId) ?? null;
      return { entry: e, workout: w };
    })
    .filter((x) => x.workout && x.workout.id !== excludeWorkoutId)
    .sort((a, b) => (b.workout!.startTime - a.workout!.startTime));
  for (const x of sorted) {
    const sets = await db.workoutSets.where("exerciseEntryId").equals(x.entry.id).toArray();
    const completed = sets.filter((s) => s.completed && !s.isWarmup);
    if (completed.length > 0) return { workout: x.workout!, sets: completed };
  }
  return null;
}

export async function finishWorkout(workoutId: string) {
  const agg = await computeWorkoutAggregate(workoutId);
  const w = await db.workouts.get(workoutId);
  if (!w) return;
  const end = Date.now();
  const durationSec = Math.floor((end - w.startTime) / 1000);
  await db.workouts.update(workoutId, {
    endTime: end,
    durationSec,
    totalVolume: agg.totalVolume,
    estimatedCalories: estimateCalories(durationSec, agg.totalVolume),
  });
  await detectPRs(workoutId);
  if (getActiveWorkoutId() === workoutId) setActiveWorkoutId(null);
}

export async function discardWorkout(workoutId: string) {
  const entries = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  for (const e of entries) {
    const setKeys = await db.workoutSets.where("exerciseEntryId").equals(e.id).primaryKeys();
    await db.workoutSets.bulkDelete(setKeys);
  }
  await db.workoutExercises.bulkDelete(entries.map((e) => e.id));
  await db.workouts.delete(workoutId);
  if (getActiveWorkoutId() === workoutId) setActiveWorkoutId(null);
}

async function detectPRs(workoutId: string) {
  const w = await db.workouts.get(workoutId);
  if (!w) return;
  const entries = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  for (const entry of entries) {
    const sets = await db.workoutSets.where("exerciseEntryId").equals(entry.id).toArray();
    const completed = sets.filter((s) => s.completed && !s.isWarmup);
    if (completed.length === 0) continue;
    const allPrev = await db.prs.where("exerciseId").equals(entry.exerciseId).toArray();
    const bestWeight = Math.max(...completed.map((s) => s.weight));
    const bestE1rm = Math.max(...completed.map((s) => e1rm(s.weight, s.reps)));
    const totalVol = completed.reduce((a, s) => a + s.weight * s.reps, 0);

    const checks: { type: PersonalRecord["type"]; value: number; weight?: number; reps?: number }[] = [
      { type: "weight", value: bestWeight, weight: bestWeight },
      { type: "e1rm", value: bestE1rm },
      { type: "volume", value: totalVol },
    ];
    for (const c of checks) {
      const prev = allPrev.filter((p) => p.type === c.type).sort((a, b) => b.value - a.value)[0];
      if (!prev || c.value > prev.value) {
        await db.prs.add({
          id: uid(),
          exerciseId: entry.exerciseId,
          type: c.type,
          value: c.value,
          weight: c.weight,
          reps: c.reps,
          date: w.date,
          workoutId,
        });
      }
    }
  }
}

export async function createTemplateFromWorkout(workoutId: string, name: string) {
  const entries = (await db.workoutExercises.where("workoutId").equals(workoutId).toArray())
    .sort((a, b) => a.order - b.order);
  const counts = await Promise.all(entries.map(async (e) => {
    const sets = await db.workoutSets.where("exerciseEntryId").equals(e.id).count();
    return sets;
  }));
  const w = await db.workouts.get(workoutId);
  const t: WorkoutTemplate = {
    id: uid(),
    name,
    location: w?.location ?? "gym",
    exercises: entries.map((e, i) => ({
      exerciseId: e.exerciseId,
      order: i,
      targetSets: counts[i] || 3,
      restPreset: e.restPreset,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.templates.add(t);
  return t.id;
}

export async function exportAll() {
  const [exercises, workouts, workoutExercises, workoutSets, templates, measurements, recovery, prs, settings] =
    await Promise.all([
      db.exercises.toArray(), db.workouts.toArray(), db.workoutExercises.toArray(),
      db.workoutSets.toArray(), db.templates.toArray(), db.measurements.toArray(),
      db.recovery.toArray(), db.prs.toArray(), db.settings.toArray(),
    ]);
  return {
    version: 1, exportedAt: new Date().toISOString(),
    exercises, workouts, workoutExercises, workoutSets, templates, measurements, recovery, prs, settings,
  };
}

export async function importAll(data: any) {
  await db.transaction("rw", db.tables, async () => {
    if (data.exercises) await db.exercises.bulkPut(data.exercises);
    if (data.workouts) await db.workouts.bulkPut(data.workouts);
    if (data.workoutExercises) await db.workoutExercises.bulkPut(data.workoutExercises);
    if (data.workoutSets) await db.workoutSets.bulkPut(data.workoutSets);
    if (data.templates) await db.templates.bulkPut(data.templates);
    if (data.measurements) await db.measurements.bulkPut(data.measurements);
    if (data.recovery) await db.recovery.bulkPut(data.recovery);
    if (data.prs) await db.prs.bulkPut(data.prs);
    if (data.settings) await db.settings.bulkPut(data.settings);
  });
}
