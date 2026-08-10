import { db, type Exercise, type WorkoutSet } from "./db";
import { e1rm, isCardioExercise } from "./analytics";

export type ProgressionVerdict = "increase" | "hold" | "deload" | "new";

export interface SessionSnapshot {
  workoutId: string;
  date: string;
  startTime: number;
  workingWeight: number;
  workingSets: number;
  workingReps: number[];
  totalReps: number;
  bestE1rm: number;
  allSetsCompleted: boolean;
  /** Cardio only: minutes per working set. */
  workingMinutes: number[];
  /** Cardio only: total minutes across working sets. */
  totalMinutes: number;
}

export interface ProgressionSuggestion {
  verdict: ProgressionVerdict;
  /** suggested working weight for today (kg) — always 0 for cardio */
  weight: number;
  /** suggested reps per set for today — always 0 for cardio */
  reps: number;
  /** suggested number of working sets */
  sets: number;
  /** cardio only: suggested minutes per set */
  minutes?: number;
  /** true when the exercise is tracked in minutes instead of weight × reps */
  isCardio?: boolean;
  /** previous session working weight (if any) */
  prevWeight?: number;
  /** previous session median reps (if any) */
  prevReps?: number;
  /** previous session median minutes (cardio only) */
  prevMinutes?: number;
  /** short 1-line reason, localized */
  reason: string;
  /** history depth used */
  sessionsAnalyzed: number;
}


const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
};

/** Choose progression increment (kg) based on the exercise profile. */
function progressionStep(ex?: Exercise): number {
  if (!ex) return 2.5;
  if (ex.category === "cardio" || ex.equipment === "bodyweight") return 0;
  if (ex.equipment === "barbell" && ex.category === "compound") {
    // Larger lifts (squat/deadlift-ish, primary movers on legs/back)
    if (
      ex.muscleGroup === "quads" ||
      ex.muscleGroup === "hamstrings" ||
      ex.muscleGroup === "glutes" ||
      ex.muscleGroup === "back"
    ) {
      return 5;
    }
    return 2.5;
  }
  if (ex.equipment === "machine" || ex.equipment === "cable") return 2.5;
  if (ex.equipment === "dumbbell") return ex.category === "compound" ? 2.5 : 1;
  return 2.5;
}

/** Round to a plate-friendly value. */
function roundToStep(v: number, step: number) {
  if (step <= 0) return Math.max(0, Math.round(v));
  return Math.max(0, Math.round(v / step) * step);
}

/** Build snapshots of the last N sessions of an exercise (newest first). */
export async function getExerciseSessionHistory(
  exerciseId: string,
  excludeWorkoutId?: string,
  limit = 5,
): Promise<SessionSnapshot[]> {
  const entries = await db.workoutExercises.where("exerciseId").equals(exerciseId).toArray();
  if (entries.length === 0) return [];
  const workouts = await db.workouts.bulkGet([...new Set(entries.map((e) => e.workoutId))]);
  const wMap = new Map(workouts.filter(Boolean).map((w) => [w!.id, w!]));

  const rows = entries
    .map((e) => ({ entry: e, workout: wMap.get(e.workoutId) }))
    .filter(
      (r) =>
        r.workout &&
        r.workout.endTime && // only finished workouts
        r.workout.id !== excludeWorkoutId,
    )
    .sort((a, b) => b.workout!.startTime - a.workout!.startTime);

  const exercise = await db.exercises.get(exerciseId);
  const cardio = isCardioExercise(exercise);

  const snapshots: SessionSnapshot[] = [];
  for (const r of rows) {
    if (snapshots.length >= limit) break;
    const sets = await db.workoutSets.where("exerciseEntryId").equals(r.entry.id).toArray();
    const working = sets.filter((s) => !s.isWarmup);
    const completed = working.filter((s) => s.completed);
    if (completed.length === 0) continue;
    const allSetsCompleted = completed.length === working.length && working.length > 0;

    if (cardio) {
      const workingMinutes = completed.map((s) => s.durationMin ?? 0);
      const totalMinutes = workingMinutes.reduce((a, m) => a + m, 0);
      if (totalMinutes <= 0) continue;
      snapshots.push({
        workoutId: r.workout!.id,
        date: r.workout!.date,
        startTime: r.workout!.startTime,
        workingWeight: 0,
        workingSets: completed.length,
        workingReps: [],
        totalReps: 0,
        bestE1rm: 0,
        allSetsCompleted,
        workingMinutes,
        totalMinutes,
      });
      continue;
    }

    const workingWeight = Math.max(...completed.map((s) => s.weight));
    const atWorking = completed.filter((s) => s.weight >= workingWeight - 0.001);
    const workingReps = atWorking.map((s) => s.reps);
    const bestE1rm = Math.max(...completed.map((s) => e1rm(s.weight, s.reps)));
    snapshots.push({
      workoutId: r.workout!.id,
      date: r.workout!.date,
      startTime: r.workout!.startTime,
      workingWeight,
      workingSets: atWorking.length,
      workingReps,
      totalReps: completed.reduce((a, s) => a + s.reps, 0),
      bestE1rm,
      allSetsCompleted,
      workingMinutes: [],
      totalMinutes: 0,
    });
  }

  return snapshots;
}

interface Localized {
  new: string;
  increaseReady: (w: number) => string;
  increaseStreak: (n: number) => string;
  holdBuild: (reps: number) => string;
  holdConsolidate: string;
  deloadDrop: (pct: number) => string;
  deloadInconsistent: string;
  firstSteady: string;
}

const L: Record<"en" | "vi", Localized> = {
  en: {
    new: "First time logging this - start light, focus on form.",
    increaseReady: (w) =>
      `You cleared every set last session - ready to add ${w % 1 === 0 ? w : w.toFixed(1)} kg.`,
    increaseStreak: (n) =>
      `Same weight held clean for ${n} sessions - a small bump is well earned.`,
    holdBuild: (reps) => `Repeat this weight and aim for ${reps}+ reps to unlock progression.`,
    holdConsolidate: "Reps still climbing at this weight - keep building before adding load.",
    deloadDrop: (pct) => `Reps dropped ~${pct}% last time - hold or lighten to reset the pattern.`,
    deloadInconsistent: "Recent sessions look uneven - stay at this weight until it feels solid.",
    firstSteady: "One session on record - repeat the weight and see how it moves.",
  },
  vi: {
    new: "Lần đầu tập bài này - bắt đầu nhẹ, tập trung vào kỹ thuật.",
    increaseReady: (w) =>
      `Bạn hoàn thành toàn bộ set buổi trước - sẵn sàng tăng ${w % 1 === 0 ? w : w.toFixed(1)} kg.`,
    increaseStreak: (n) => `Giữ cùng mức tạ ${n} buổi - có thể tăng nhẹ để tiến bộ.`,
    holdBuild: (reps) => `Giữ mức này và cố đạt ${reps}+ reps để mở khoá tăng tạ.`,
    holdConsolidate: "Reps đang tăng dần ở mức này - tiếp tục củng cố trước khi thêm tạ.",
    deloadDrop: (pct) => `Reps giảm ~${pct}% buổi trước - giữ nguyên hoặc giảm để lấy lại nhịp.`,
    deloadInconsistent: "Vài buổi gần đây chưa ổn định - ở lại mức này cho đến khi thấy chắc.",
    firstSteady: "Mới có một buổi - lặp lại mức tạ này để xem tiến triển.",
  },
};

export interface ComputeOptions {
  targetSets?: number;
  lang?: "en" | "vi";
}

export function computeProgressionSuggestion(
  exercise: Exercise | undefined,
  history: SessionSnapshot[],
  opts: ComputeOptions = {},
): ProgressionSuggestion {
  const lang = opts.lang ?? "en";
  const loc = L[lang];
  const step = progressionStep(exercise);
  const isBodyweight = exercise?.equipment === "bodyweight" || exercise?.category === "cardio";

  // No history
  if (history.length === 0) {
    return {
      verdict: "new",
      weight: 0,
      reps: exercise?.category === "cardio" ? 0 : 8,
      sets: opts.targetSets ?? 3,
      reason: loc.new,
      sessionsAnalyzed: 0,
    };
  }

  const last = history[0];
  const prevWeight = last.workingWeight;
  const prevRepsMedian = Math.round(median(last.workingReps));
  const minReps = Math.min(...last.workingReps);
  const targetSets = opts.targetSets ?? Math.max(last.workingSets, 3);

  // Only 1 session
  if (history.length === 1) {
    return {
      verdict: "hold",
      weight: prevWeight,
      reps: prevRepsMedian,
      sets: targetSets,
      prevWeight,
      prevReps: prevRepsMedian,
      reason: loc.firstSteady,
      sessionsAnalyzed: 1,
    };
  }

  const prev = history[1];

  // Detect regression: reps or weight dropped meaningfully
  const repDropPct =
    prev.workingReps.length > 0
      ? Math.max(
          0,
          Math.round(
            ((median(prev.workingReps) - median(last.workingReps)) /
              Math.max(1, median(prev.workingReps))) *
              100,
          ),
        )
      : 0;
  const weightDropped = last.workingWeight < prev.workingWeight - 0.001;
  const e1rmDropped = last.bestE1rm < prev.bestE1rm * 0.95;

  if (weightDropped || repDropPct >= 15 || e1rmDropped) {
    return {
      verdict: "deload",
      weight: prevWeight,
      reps: prevRepsMedian,
      sets: targetSets,
      prevWeight,
      prevReps: prevRepsMedian,
      reason: repDropPct >= 15 ? loc.deloadDrop(repDropPct) : loc.deloadInconsistent,
      sessionsAnalyzed: history.length,
    };
  }

  // Rep range for the current weight. Progression to a heavier weight is only
  // unlocked once the athlete owns the top of this range across consecutive
  // sessions — the low end is where a new weight starts.
  const readyRepFloor = exercise?.category === "compound" ? 5 : 8;
  const readyRepCeiling = isBodyweight ? 15 : exercise?.category === "compound" ? 8 : 12;

  // Count consecutive recent sessions performed at the current working weight.
  const sessionsAtWeight = (() => {
    let n = 0;
    for (const h of history) {
      if (Math.abs(h.workingWeight - prevWeight) < 0.001) n += 1;
      else break;
    }
    return n;
  })();

  // Mastery of the current weight: all sets completed AND every working set
  // reached the top of the rep range.
  const masteredLast = last.allSetsCompleted && minReps >= readyRepCeiling;
  const prevMin = Math.min(...prev.workingReps);
  const sameWeightPrev = Math.abs(prev.workingWeight - last.workingWeight) < 0.001;
  const masteredPrev = sameWeightPrev && prev.allSetsCompleted && prevMin >= readyRepCeiling;

  // Only increase when the athlete has demonstrated the top of the range for
  // at least two consecutive sessions at the same weight. This prevents a
  // weight bump the workout right after a freshly-introduced load.
  if (masteredLast && masteredPrev && sessionsAtWeight >= 2) {
    if (isBodyweight) {
      return {
        verdict: "increase",
        weight: prevWeight,
        reps: prevRepsMedian + 1,
        sets: targetSets,
        prevWeight,
        prevReps: prevRepsMedian,
        reason: loc.increaseReady(1),
        sessionsAnalyzed: history.length,
      };
    }
    const nextWeight = roundToStep(prevWeight + step, step);
    // Fresh weight — reset reps to the bottom of the range and rebuild up.
    const nextReps = readyRepFloor;
    return {
      verdict: "increase",
      weight: nextWeight,
      reps: nextReps,
      sets: targetSets,
      prevWeight,
      prevReps: prevRepsMedian,
      reason:
        sessionsAtWeight >= 3 ? loc.increaseStreak(sessionsAtWeight) : loc.increaseReady(step),
      sessionsAnalyzed: history.length,
    };
  }

  // Otherwise: hold at the current weight and chase one more rep. The target
  // climbs from the last session's reps toward the ceiling, so the assistant
  // guides the athlete up the rep range before adding load again.
  const nextRepTarget = Math.min(readyRepCeiling, Math.max(prevRepsMedian + 1, readyRepFloor));
  return {
    verdict: "hold",
    weight: prevWeight,
    reps: nextRepTarget,
    sets: targetSets,
    prevWeight,
    prevReps: prevRepsMedian,
    reason: prevRepsMedian < readyRepCeiling ? loc.holdBuild(readyRepCeiling) : loc.holdConsolidate,
    sessionsAnalyzed: history.length,
  };
}

export async function getProgressionSuggestion(
  exerciseId: string,
  excludeWorkoutId?: string,
  opts: ComputeOptions = {},
): Promise<ProgressionSuggestion> {
  const [ex, history] = await Promise.all([
    db.exercises.get(exerciseId),
    getExerciseSessionHistory(exerciseId, excludeWorkoutId, 5),
  ]);
  return computeProgressionSuggestion(ex, history, opts);
}

/**
 * Get the previous session's non-warmup sets for an exercise, in the order they
 * were performed. Used purely for prefill — independent of the progression engine.
 */
export async function getPreviousSessionSets(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<Array<{ weight: number; reps: number; isWarmup?: boolean }>> {
  const entries = await db.workoutExercises.where("exerciseId").equals(exerciseId).toArray();
  if (entries.length === 0) return [];
  const workouts = await db.workouts.bulkGet([...new Set(entries.map((e) => e.workoutId))]);
  const wMap = new Map(workouts.filter(Boolean).map((w) => [w!.id, w!]));
  const rows = entries
    .map((e) => ({ entry: e, workout: wMap.get(e.workoutId) }))
    .filter((r) => r.workout && r.workout.endTime && r.workout.id !== excludeWorkoutId)
    .sort((a, b) => b.workout!.startTime - a.workout!.startTime);
  for (const r of rows) {
    const sets = await db.workoutSets.where("exerciseEntryId").equals(r.entry.id).toArray();
    const working = sets.filter((s) => !s.isWarmup).sort((a, b) => a.timestamp - b.timestamp);
    if (working.length === 0) continue;
    return working.map((s) => ({ weight: s.weight, reps: s.reps, isWarmup: s.isWarmup }));
  }
  return [];
}
