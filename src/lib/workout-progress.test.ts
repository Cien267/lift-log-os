import { describe, expect, it } from "vitest";
import { getWorkoutCompletionProgress } from "./workout-progress";

describe("getWorkoutCompletionProgress", () => {
  it("starts at zero before any set is complete", () => {
    expect(getWorkoutCompletionProgress(0, 3)).toBe(0);
  });

  it("fills in proportion to completed sets", () => {
    expect(getWorkoutCompletionProgress(1, 4)).toBe(25);
  });

  it("reaches full progress when every set is complete", () => {
    expect(getWorkoutCompletionProgress(3, 3)).toBe(100);
  });

  it("recalculates when the total set count changes", () => {
    expect(getWorkoutCompletionProgress(2, 4)).toBe(50);
  });
});