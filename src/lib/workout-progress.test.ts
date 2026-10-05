import { getWorkoutCompletionProgress } from "./workout-progress";

function expectProgress(completedSets: number, totalSets: number, expected: number) {
  const actual = getWorkoutCompletionProgress(completedSets, totalSets);
  if (actual !== expected) {
    throw new Error(`Expected ${expected}% progress, received ${actual}%`);
  }
}

expectProgress(0, 3, 0);
expectProgress(1, 4, 25);
expectProgress(3, 3, 100);
expectProgress(2, 4, 50);