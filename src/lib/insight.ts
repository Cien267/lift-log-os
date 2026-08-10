import { db, type Workout, type Exercise } from "./db";
import { computeWorkoutAggregate, e1rm, isCardioExercise } from "./analytics";

export type ExerciseVerdict = "progress" | "regress" | "same" | "new";

export interface ExerciseInsight {
  exerciseId: string;
  exerciseName: string;
  currentSets: number;
  prevSets: number;
  currentTopWeight: number;
  prevTopWeight: number;
  currentTotalReps: number;
  prevTotalReps: number;
  currentVolume: number;
  prevVolume: number;
  currentBestE1rm: number;
  prevBestE1rm: number;
  /** Cardio exercises are compared by minutes instead of load. */
  isCardio?: boolean;
  currentTotalMinutes?: number;
  prevTotalMinutes?: number;
  verdict: ExerciseVerdict;
}

export interface WorkoutInsight {
  generatedAt: number;
  comparedToWorkoutId?: string;
  comparedToDate?: string;
  compareMode: "template" | "any" | "none";
  current: {
    totalVolume: number;
    totalSets: number;
    durationSec: number;
    totalCardioMin?: number;
  };
  previous?: {
    totalVolume: number;
    totalSets: number;
    durationSec: number;
    totalCardioMin?: number;
  };
  totalVolumeDelta: number;
  totalVolumePct: number;
  totalSetsDelta: number;
  durationDelta: number;
  cardioMinDelta?: number;
  prCount: number;
  headline: string;
  exercises: ExerciseInsight[];
}

async function summarizeEntry(entryId: string, exercise?: Exercise) {
  const sets = await db.workoutSets.where("exerciseEntryId").equals(entryId).toArray();
  const completed = sets.filter((s) => s.completed && !s.isWarmup);
  const cardio = isCardioExercise(exercise);
  const topWeight = cardio ? 0 : completed.reduce((m, s) => Math.max(m, s.weight), 0);
  const totalReps = cardio ? 0 : completed.reduce((a, s) => a + s.reps, 0);
  const volume = cardio ? 0 : completed.reduce((a, s) => a + s.weight * s.reps, 0);
  const bestE1rm = cardio ? 0 : completed.reduce((m, s) => Math.max(m, e1rm(s.weight, s.reps)), 0);
  const totalMinutes = cardio ? completed.reduce((a, s) => a + (s.durationMin ?? 0), 0) : 0;
  return {
    sets: completed.length,
    topWeight,
    totalReps,
    volume,
    bestE1rm,
    totalMinutes,
  };
}


function verdictFor(cur: number, prev: number): ExerciseVerdict {
  if (prev === 0) return "new";
  const diff = (cur - prev) / prev;
  if (diff > 0.01) return "progress";
  if (diff < -0.01) return "regress";
  return "same";
}

export async function computeWorkoutInsight(workoutId: string): Promise<WorkoutInsight | null> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) throw new Error("Workout not found");

  // Find previous workout to compare to
  let prev: Workout | undefined;
  let mode: WorkoutInsight["compareMode"] = "none";
  if (workout.templateId) {
    const candidates = (await db.workouts.where("templateId").equals(workout.templateId).toArray())
      .filter((w) => w.id !== workoutId && w.endTime)
      .sort((a, b) => b.startTime - a.startTime);
    if (candidates.length > 0) {
      prev = candidates[0];
      mode = "template";
    }
  }
  if (!prev || !workout.templateId) {
    return null;
  }

  const curAgg = await computeWorkoutAggregate(workoutId);
  const curEntries = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  const exIds = [...new Set(curEntries.map((e) => e.exerciseId))];
  const exs = await db.exercises.bulkGet(exIds);
  const exMap = new Map(exs.filter(Boolean).map((e) => [e!.id, e!]));

  let prevAgg: Awaited<ReturnType<typeof computeWorkoutAggregate>> | undefined;
  const prevEntryByExId = new Map<string, string>();
  if (prev) {
    prevAgg = await computeWorkoutAggregate(prev.id);
    const prevEntries = await db.workoutExercises.where("workoutId").equals(prev.id).toArray();
    for (const e of prevEntries) prevEntryByExId.set(e.exerciseId, e.id);
  }

  const exercises: ExerciseInsight[] = [];
  for (const entry of curEntries) {
    const ex = exMap.get(entry.exerciseId);
    const cardio = isCardioExercise(ex);
    const cur = await summarizeEntry(entry.id, ex);
    if (cur.sets === 0) continue;
    const prevEntryId = prevEntryByExId.get(entry.exerciseId);
    const prevSum = prevEntryId
      ? await summarizeEntry(prevEntryId, ex)
      : { sets: 0, topWeight: 0, totalReps: 0, volume: 0, bestE1rm: 0, totalMinutes: 0 };
    // Cardio progress is judged on minutes, strength on e1RM/volume.
    const verdict = cardio
      ? verdictFor(cur.totalMinutes, prevSum.totalMinutes)
      : verdictFor(cur.bestE1rm || cur.volume, prevSum.bestE1rm || prevSum.volume);
    exercises.push({
      exerciseId: entry.exerciseId,
      exerciseName: ex?.name ?? "Exercise",
      currentSets: cur.sets,
      prevSets: prevSum.sets,
      currentTopWeight: cur.topWeight,
      prevTopWeight: prevSum.topWeight,
      currentTotalReps: cur.totalReps,
      prevTotalReps: prevSum.totalReps,
      currentVolume: cur.volume,
      prevVolume: prevSum.volume,
      currentBestE1rm: cur.bestE1rm,
      prevBestE1rm: prevSum.bestE1rm,
      isCardio: cardio || undefined,
      currentTotalMinutes: cardio ? cur.totalMinutes : undefined,
      prevTotalMinutes: cardio ? prevSum.totalMinutes : undefined,
      verdict,
    });
  }


  // PR count: PRs whose workoutId matches current
  const prs = (await db.prs.toArray()).filter((p) => p.workoutId === workoutId).length;

  const curDur = workout.durationSec ?? Math.floor((Date.now() - workout.startTime) / 1000);
  const prevDur = prev?.durationSec ?? 0;
  const totalVolumeDelta = curAgg.totalVolume - (prevAgg?.totalVolume ?? 0);
  const totalVolumePct =
    prevAgg && prevAgg.totalVolume > 0 ? (totalVolumeDelta / prevAgg.totalVolume) * 100 : 0;
  const totalSetsDelta = curAgg.totalSets - (prevAgg?.totalSets ?? 0);
  const durationDelta = curDur - prevDur;
  const cardioMinDelta = curAgg.totalCardioMin - (prevAgg?.totalCardioMin ?? 0);
  const cardioOnly = curAgg.totalVolume === 0 && curAgg.totalCardioMin > 0;

  let headline: string;
  if (!prev) {
    headline = "Baseline session logged. Future workouts will be compared to this one.";
  } else {
    const progress = exercises.filter((e) => e.verdict === "progress").length;
    const regress = exercises.filter((e) => e.verdict === "regress").length;
    if (prs > 0) {
      headline = `${prs} new personal record${prs > 1 ? "s" : ""}!`;
    } else if (cardioOnly) {
      // Cardio sessions are compared by minutes, not kilograms.
      const min = Math.round(curAgg.totalCardioMin);
      headline =
        cardioMinDelta > 0
          ? `Longer cardio session — ${min} min, +${Math.round(cardioMinDelta)} min vs last time.`
          : cardioMinDelta < 0
            ? `Shorter cardio session — ${min} min, ${Math.round(cardioMinDelta)} min vs last time.`
            : `Steady cardio session — ${min} min logged.`;
    } else if (totalVolumeDelta > 0 && progress >= regress) {
      headline = `Stronger session — +${Math.round(totalVolumePct)}% volume vs last time.`;
    } else if (totalVolumeDelta < 0) {
      headline = `Lighter session — ${Math.round(totalVolumePct)}% volume vs last time.`;
    } else {
      headline = "Solid, consistent session.";
    }
  }

  return {
    generatedAt: Date.now(),
    comparedToWorkoutId: prev?.id,
    comparedToDate: prev?.date,
    compareMode: mode,
    current: {
      totalVolume: curAgg.totalVolume,
      totalSets: curAgg.totalSets,
      durationSec: curDur,
      totalCardioMin: curAgg.totalCardioMin,
    },
    previous: prevAgg
      ? {
          totalVolume: prevAgg.totalVolume,
          totalSets: prevAgg.totalSets,
          durationSec: prevDur,
          totalCardioMin: prevAgg.totalCardioMin,
        }
      : undefined,
    totalVolumeDelta,
    totalVolumePct,
    totalSetsDelta,
    durationDelta,
    cardioMinDelta,
    prCount: prs,

    headline,
    exercises,
  };
}
