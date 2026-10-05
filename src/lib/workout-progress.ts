export function getWorkoutCompletionProgress(completedSets: number, totalSets: number) {
  if (totalSets <= 0) return 0;

  const safeCompletedSets = Math.min(Math.max(completedSets, 0), totalSets);
  return (safeCompletedSets / totalSets) * 100;
}