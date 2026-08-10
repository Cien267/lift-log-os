import { db, type MuscleGroup, type WorkoutSet, type Exercise, type Workout } from "./db";

// Epley estimated 1RM
export const e1rm = (weight: number, reps: number) => (reps <= 0 ? 0 : weight * (1 + reps / 30));

/** Cardio exercises are tracked in minutes, not weight × reps. */
export const isCardioExercise = (ex?: Pick<Exercise, "muscleGroup" | "category">) =>
  ex?.muscleGroup === "cardio" || ex?.category === "cardio";

/** Minutes logged for a cardio set (0 when not completed). */
export const setMinutes = (s: WorkoutSet) => (s.completed ? (s.durationMin ?? 0) : 0);

export const setVolume = (s: WorkoutSet) => (s.completed ? s.weight * s.reps : 0);

export function formatWeight(kg: number, unit: "kg" | "lb" = "kg") {
  if (unit === "lb") return `${(kg * 2.20462).toFixed(1)} lb`;
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
}

export function formatMinutes(min: number) {
  const v = Math.round(min * 10) / 10;
  return `${v % 1 === 0 ? v : v.toFixed(1)} min`;
}

/**
 * One-line volume summary for a session: strength volume in kg plus cardio
 * minutes. Falls back to cardio-only when the session had no strength work.
 */
export function formatSessionVolume(w: Pick<Workout, "totalVolume" | "totalCardioMin">) {
  const vol = Math.round(w.totalVolume ?? 0);
  const cardio = w.totalCardioMin ?? 0;
  if (cardio > 0 && vol > 0) return `${formatWeight(vol)} · ${formatMinutes(cardio)}`;
  if (cardio > 0) return formatMinutes(cardio);
  return formatWeight(vol);
}

export function formatDuration(sec: number) {
  if (!sec) return "0m";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function estimateCalories(durationSec: number, totalVolume: number) {
  // Rough: 5 kcal/min base + 0.04 kcal per kg of volume
  const minutes = durationSec / 60;
  return Math.round(minutes * 5 + totalVolume * 0.04);
}


export interface WorkoutAggregate {
  workoutId: string;
  date: string;
  totalVolume: number;
  totalSets: number;
  durationSec: number;
  muscleVolume: Partial<Record<MuscleGroup, number>>;
}

export async function computeWorkoutAggregate(workoutId: string): Promise<WorkoutAggregate> {
  const [workout, entries] = await Promise.all([
    db.workouts.get(workoutId),
    db.workoutExercises.where("workoutId").equals(workoutId).toArray(),
  ]);
  const allSets = await db.workoutSets
    .where("exerciseEntryId")
    .anyOf(entries.map((e) => e.id))
    .toArray();
  const exMap = new Map<string, Exercise>();
  const exIds = [...new Set(entries.map((e) => e.exerciseId))];
  const exs = await db.exercises.bulkGet(exIds);
  exs.forEach((e) => e && exMap.set(e.id, e));

  let totalVolume = 0;
  let totalSets = 0;
  const muscleVolume: Partial<Record<MuscleGroup, number>> = {};
  for (const entry of entries) {
    const ex = exMap.get(entry.exerciseId);
    if (!ex) continue;
    const entrySets = allSets.filter((s) => s.exerciseEntryId === entry.id);
    for (const s of entrySets) {
      if (!s.completed) continue;
      const vol = setVolume(s);
      totalVolume += vol;
      totalSets += 1;
      muscleVolume[ex.muscleGroup] = (muscleVolume[ex.muscleGroup] ?? 0) + vol;
      ex.secondaryMuscles?.forEach((m) => {
        muscleVolume[m] = (muscleVolume[m] ?? 0) + vol * 0.5;
      });
    }
  }
  return {
    workoutId,
    date: workout?.date ?? "",
    totalVolume,
    totalSets,
    durationSec: workout?.durationSec ?? 0,
    muscleVolume,
  };
}

export function getWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
