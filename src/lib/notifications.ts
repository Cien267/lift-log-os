import { db, uid, type AppNotification, type NotificationType, type MuscleGroup } from "./db";
import { computeWorkoutAggregate, getWeekStart, formatWeight, formatDuration } from "./analytics";
import { format, parseISO } from "date-fns";

// Bump this when publishing new features that should show a "What's New" card.
export const APP_VERSION = "1.1.0";

interface WhatsNewEntry {
  version: string;
  title: string;
  subtitle: string;
  body: string;
}

// Ordered newest → oldest. Add new entries to the top.
const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: "1.1.0",
    title: "Notifications are here",
    subtitle: "A quieter way to catch up on your training",
    body:
      "Forge now has an inbox. You'll receive a weekly training summary every Monday " +
      "with your sessions, muscle distribution, PRs, and coaching notes. " +
      "This is where future insights, achievements, and app updates will live too.",
  },
];

export async function createNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "read"> & { createdAt?: number },
): Promise<AppNotification | null> {
  if (n.key) {
    const existing = await db.notifications.where("key").equals(n.key).first();
    if (existing) return null;
  }
  const record: AppNotification = {
    id: uid(),
    createdAt: n.createdAt ?? Date.now(),
    read: false,
    type: n.type,
    key: n.key,
    title: n.title,
    subtitle: n.subtitle,
    payload: n.payload,
  };
  await db.notifications.put(record);
  return record;
}

export async function markRead(id: string) {
  await db.notifications.update(id, { read: true });
}

export async function markAllRead() {
  const list = await db.notifications.toArray();
  await Promise.all(
    list.filter((n) => !n.read).map((n) => db.notifications.update(n.id, { read: true })),
  );
}

export async function deleteNotification(id: string) {
  await db.notifications.delete(id);
}

// -------- What's New --------
async function ensureWhatsNew() {
  for (const entry of WHATS_NEW) {
    await createNotification({
      type: "whats_new",
      key: `whats_new:${entry.version}`,
      title: entry.title,
      subtitle: entry.subtitle,
      payload: { version: entry.version, body: entry.body },
    });
  }
}

// -------- Weekly summary --------
type Bucket = "legs" | "back" | "chest" | "shoulders" | "arms" | "core" | "cardio";
const BUCKET: Record<MuscleGroup, Bucket> = {
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  back: "back",
  chest: "chest",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  core: "core",
  cardio: "cardio",
};
const BUCKET_LABEL: Record<Bucket, string> = {
  legs: "Legs",
  back: "Back",
  chest: "Chest",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
};

export interface WeeklySummaryPayload {
  weekStart: string; // ISO date (Mon)
  weekEnd: string; // ISO date (Sun)
  sessions: number;
  weeklyGoal?: number;
  totalVolume: number;
  totalDurationSec: number;
  muscles: { bucket: Bucket; label: string; value: number; pct: number }[];
  neglected: string[];
  prCount: number;
  goalMet?: boolean;
  coachComment: string;
  improvements: string[];
  wins: string[];
}

function fmtISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

async function buildWeeklySummary(weekStart: Date): Promise<WeeklySummaryPayload | null> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startMs = weekStart.getTime();
  const endMs = new Date(weekStart).setDate(weekStart.getDate() + 7);

  const workouts = await db.workouts
    .where("startTime")
    .between(startMs, endMs, true, false)
    .toArray();
  const done = workouts.filter((w) => w.endTime);
  if (done.length === 0) return null;

  let totalVolume = 0;
  let totalDur = 0;
  const buckets: Partial<Record<Bucket, number>> = {};
  for (const w of done) {
    const agg = await computeWorkoutAggregate(w.id);
    totalVolume += agg.totalVolume;
    totalDur += agg.durationSec;
    for (const [mg, vol] of Object.entries(agg.muscleVolume)) {
      const b = BUCKET[mg as MuscleGroup];
      buckets[b] = (buckets[b] ?? 0) + (vol ?? 0);
    }
  }
  const totalBucketVol = Object.values(buckets).reduce((a, b) => a! + (b ?? 0), 0)!;
  const muscles = (Object.entries(buckets) as [Bucket, number][])
    .filter(([, v]) => v > 0)
    .map(([bucket, value]) => ({
      bucket,
      label: BUCKET_LABEL[bucket],
      value: Math.round(value),
      pct: totalBucketVol > 0 ? Math.round((value / totalBucketVol) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const trained = new Set(muscles.map((m) => m.bucket));
  const neglected = (["legs", "back", "chest", "shoulders", "arms", "core"] as Bucket[])
    .filter((b) => !trained.has(b))
    .map((b) => BUCKET_LABEL[b]);

  const prCount = await db.prs
    .where("date")
    .between(fmtISO(weekStart), fmtISO(weekEnd), true, true)
    .count();

  const settings = await db.settings.get("app");
  const weeklyGoal = settings?.weeklyGoal ?? 0;
  const goalMet = weeklyGoal > 0 ? done.length >= weeklyGoal : undefined;

  const wins: string[] = [];
  if (done.length >= 4) wins.push(`Strong consistency with ${done.length} sessions.`);
  if (prCount > 0) wins.push(`${prCount} personal record${prCount > 1 ? "s" : ""} set.`);
  if (goalMet) wins.push(`Weekly goal of ${weeklyGoal} sessions reached.`);
  if (muscles[0]) wins.push(`Top focus: ${muscles[0].label} (${muscles[0].pct}%).`);

  const improvements: string[] = [];
  if (weeklyGoal > 0 && !goalMet)
    improvements.push(`Missed weekly goal — ${done.length}/${weeklyGoal} sessions.`);
  if (neglected.length > 0) improvements.push(`No volume on: ${neglected.slice(0, 3).join(", ")}.`);
  if (muscles[0] && muscles[0].pct > 55)
    improvements.push(
      `Distribution leans heavy on ${muscles[0].label} (${muscles[0].pct}%). Consider balancing.`,
    );

  let coachComment: string;
  if (goalMet && prCount > 0)
    coachComment = "Excellent week — consistent and pushing new ground. Recover well.";
  else if (goalMet)
    coachComment = "You showed up. That's the foundation everything else is built on.";
  else if (done.length >= 3)
    coachComment = "Solid work. Keep the rhythm and the numbers will follow.";
  else if (done.length >= 1)
    coachComment = "A short week — every session still counts. Aim for one more next week.";
  else coachComment = "Quiet week. When you're ready, ease back in with something light.";

  return {
    weekStart: fmtISO(weekStart),
    weekEnd: fmtISO(weekEnd),
    sessions: done.length,
    weeklyGoal: weeklyGoal || undefined,
    totalVolume: Math.round(totalVolume),
    totalDurationSec: totalDur,
    muscles,
    neglected,
    prCount,
    goalMet,
    coachComment,
    improvements,
    wins,
  };
}

async function ensureWeeklySummary() {
  // Generate the summary for LAST week, once, at the start of the current week.
  const currentWeek = getWeekStart();
  const lastWeek = new Date(currentWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const key = `weekly_summary:${fmtISO(lastWeek)}`;

  const existing = await db.notifications.where("key").equals(key).first();
  if (existing) return;

  const payload = await buildWeeklySummary(lastWeek);
  if (!payload) return; // no activity — skip
  const rangeLabel = `${format(parseISO(payload.weekStart), "MMM d")} – ${format(parseISO(payload.weekEnd), "MMM d")}`;

  await createNotification({
    type: "weekly_summary",
    key,
    title: "Last week in review",
    subtitle: `${rangeLabel} · ${payload.sessions} session${payload.sessions > 1 ? "s" : ""} · ${formatWeight(payload.totalVolume)} · ${formatDuration(payload.totalDurationSec)}`,
    payload,
  });
}

// Called once from the app root on mount.
let ran = false;
export async function runNotificationJobs() {
  if (ran) return;
  ran = true;
  try {
    await ensureWhatsNew();
    await ensureWeeklySummary();
  } catch (err) {
    console.error("notification jobs failed", err);
  }
}
