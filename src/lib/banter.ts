import { toast } from "sonner";

/**
 * Forge banter — a lightweight, extensible personality layer.
 *
 * Add a new trigger by:
 *   1. Extending the BanterTrigger union.
 *   2. Adding an entry to MESSAGES with an array of strings (or context-aware fns).
 *   3. Calling `banter("your-trigger", ctx)` from wherever the event happens.
 */

export type BanterTrigger =
  | "exercise.removed"
  | "exercise.added"
  | "set.extra" // added a set beyond the plan's target
  | "set.warmupMarked"
  | "workout.discarded"
  | "workout.finishedClean" // all sets completed
  | "workout.finishedIncomplete"
  | "workout.longBreakReturn"
  | "workout.newPR"
  | "workout.marathon" // very long session
  | "rest.skipped";

type Ctx = Record<string, any>;
type Line = string | ((ctx: Ctx) => string);

const MESSAGES: Record<BanterTrigger, Line[]> = {
  "exercise.removed": [
    (c) => `${c.name ?? "That one"}? Bold move. We'll pretend it never existed.`,
    "Ghosted. Your triceps just breathed a sigh of relief.",
    "Deleted. The iron will remember.",
    (c) => `Skipping ${c.name ?? "that"}? Coach raises an eyebrow.`,
    "One less exercise. One more excuse.",
  ],
  "exercise.added": [
    "Ambitious. I like it.",
    "Adding fuel to the fire.",
    "One more? Someone's feeling spicy today.",
  ],
  "set.extra": [
    "Extra set unlocked. Someone's showing off.",
    "One more? Okay, tough guy.",
    "Bonus reps. Future you says thanks.",
    "That's the good stuff.",
  ],
  "set.warmupMarked": ["Warm-up flagged. Smart cookie.", "Prime the engine first. I approve."],
  "workout.discarded": [
    "Poof. Gone. We won't speak of this.",
    "Session discarded. Even the best days have restarts.",
    "Fresh slate. See you tomorrow, champ.",
  ],
  "workout.finishedClean": [
    "Every set closed. Textbook execution.",
    "Clean sweep. You just made your future self smug.",
    "No leftovers. Chef's kiss.",
    "Perfect card. Bank it.",
  ],
  "workout.finishedIncomplete": [
    (c) => `${c.incomplete ?? "A few"} sets left on the table. Still counts. Barely.`,
    (c) => `Almost — ${c.incomplete ?? "some"} loose sets. We'll finish them next time.`,
    "Half-eaten sandwich energy. But hey, you showed up.",
    "Progress > perfection. But also, finish the sets.",
  ],
  "workout.longBreakReturn": [
    (c) => `${c.days ?? "Many"} days off, huh? The bar missed you.`,
    (c) => `Welcome back, stranger. It's been ${c.days ?? "a while"} days.`,
    "Ah, a wild lifter appears. Ease in — no ego lifts today.",
    "The gym remembers. Start light, build back up.",
  ],
  "workout.newPR": [
    (c) =>
      c.count > 1
        ? `${c.count} PRs today?! Someone call the record book.`
        : "New PR. Absolute unit.",
    "PR landed. The iron bows.",
    "That's a record. Screenshot it, frame it, brag about it.",
    "Numbers went up. Serotonin went up. Beautiful.",
  ],
  "workout.marathon": [
    (c) => `${c.minutes ?? "That"} minutes in the gym. Hydrate, hero.`,
    "Long session. The couch will feel divine tonight.",
  ],
  "rest.skipped": ["Skipping rest? Living dangerously.", "No rest for the ambitious."],
};

function pick(trigger: BanterTrigger, ctx: Ctx): string | null {
  const pool = MESSAGES[trigger];
  if (!pool || pool.length === 0) return null;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return typeof line === "function" ? line(ctx) : line;
}

// Anti-spam: don't repeat the same trigger within N ms.
const lastFired: Record<string, number> = {};
const DEDUPE_MS = 1500;

export function banter(trigger: BanterTrigger, ctx: Ctx = {}) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (lastFired[trigger] && now - lastFired[trigger] < DEDUPE_MS) return;
  lastFired[trigger] = now;
  const msg = pick(trigger, ctx);
  if (!msg) return;
  toast(msg, { duration: 3200, position: "bottom-right" });
}

/** Register additional messages at runtime (for future extensions). */
export function registerBanterLines(trigger: BanterTrigger, lines: Line[]) {
  const existing = MESSAGES[trigger] ?? [];
  MESSAGES[trigger] = [...existing, ...lines];
}
