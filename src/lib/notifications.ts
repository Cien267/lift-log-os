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
const WHATS_NEW = (lang = "en"): WhatsNewEntry[] => [
  {
    version: "1.1.0",
    title: lang === "en" ? "Notifications are here" : "Thông báo đã có mặt",
    subtitle:
      lang === "en"
        ? "A quieter way to catch up on your training"
        : "Một cách yên tĩnh hơn để theo dõi việc tập luyện của bạn",
    body:
      lang === "en"
        ? "Forge now has an inbox. You'll receive a weekly training summary every Monday " +
          "with your sessions, muscle distribution, PRs, and coaching notes. " +
          "This is where future insights, achievements, and app updates will live too."
        : "Forge hiện có hộp thư đến. Bạn sẽ nhận được tóm tắt đào tạo hàng tuần vào mỗi thứ Hai " +
          "với các buổi tập của bạn, phân phối cơ bắp, kỉ lục cá nhân và ghi chú huấn luyện. " +
          "Đây cũng là nơi lưu trữ các thông tin chi tiết, thành tựu và cập nhật ứng dụng trong tương lai.",
  },
  {
    version: "1.1.1",
    title: lang === "en" ? "New muscle group added" : "Đã thêm nhóm cơ mới",
    subtitle:
      lang === "en"
        ? "Track your Adductor training more accurately"
        : "Theo dõi bài tập cơ khép đùi chính xác hơn",
    body:
      lang === "en"
        ? "Forge now includes a dedicated Adductors muscle group. Hip Adduction exercises and other adductor-focused movements can now be logged separately for more accurate muscle distribution and training statistics."
        : "Forge hiện đã bổ sung nhóm cơ Adductors (cơ khép đùi). Các bài tập Hip Adduction và những bài tập tập trung vào cơ khép đùi giờ đây có thể được ghi lại rõ ràng, giúp thống kê phân bổ nhóm cơ và quá trình tập luyện chính xác hơn.",
  },
  {
    version: "1.1.2",
    title:
      lang === "en"
        ? "Your progress deserves to be seen"
        : "Thành quả của bạn xứng đáng được chia sẻ",
    subtitle:
      lang === "en" ? "A new way to share every workout" : "Một cách mới để chia sẻ mỗi buổi tập",
    body:
      lang === "en"
        ? "Capture your best post-workout photo and let Forge automatically overlay your workout summary. You can also create a shareable image from any previous workout in History. Multiple layouts, customizable colors, and social-ready exports are included. Finish your next workout to unlock and try this feature."
        : "Chụp lại khoảnh khắc sau buổi tập và để Forge tự động thêm các chỉ số tập luyện lên ảnh. Bạn cũng có thể tạo ảnh từ bất kỳ buổi tập nào trong Lịch sử. Hỗ trợ nhiều bố cục, tùy chỉnh màu sắc và xuất ảnh sẵn sàng để chia sẻ lên mạng xã hội. Hoàn thành buổi tập tiếp theo để mở khóa và trải nghiệm tính năng này.",
  },
  {
    version: "1.2.3",
    title: lang === "en" ? "Cardio tracking is here" : "Đã hỗ trợ theo dõi Cardio",
    subtitle:
      lang === "en"
        ? "Track cardio by time, not reps"
        : "Theo dõi Cardio theo thời gian thay vì số reps",
    body:
      lang === "en"
        ? "Forge now supports Cardio as a dedicated training type. Cardio exercises use minutes instead of reps and no longer require weight, making it easier to track running, cycling, walking, and other time-based cardio sessions."
        : "Forge giờ đây hỗ trợ Cardio như một loại hình tập luyện riêng. Các bài Cardio sử dụng số phút thay vì số reps và không yêu cầu mức tạ, giúp bạn dễ dàng theo dõi chạy bộ, đạp xe, đi bộ và các bài tập Cardio dựa trên thời gian.",
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
async function ensureWhatsNew(lang: string) {
  for (const entry of WHATS_NEW(lang)) {
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
  adductors: "legs",
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

async function buildWeeklySummary(
  weekStart: Date,
  lang: string,
): Promise<WeeklySummaryPayload | null> {
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
  if (done.length >= 4) {
    wins.push(
      lang === "en"
        ? `Strong consistency with ${done.length} sessions.`
        : `Kiên trì tập luyện với ${done.length} buổi.`,
    );
  }
  if (prCount > 0) {
    wins.push(
      lang === "en"
        ? `${prCount} personal record${prCount > 1 ? "s" : ""} set.`
        : `Đã thiết lập ${prCount} kỷ lục cá nhân.`,
    );
  }
  if (goalMet) {
    wins.push(
      lang === "en"
        ? `Weekly goal of ${weeklyGoal} sessions reached.`
        : `Đã hoàn thành mục tiêu ${weeklyGoal} buổi trong tuần.`,
    );
  }
  if (muscles[0]) {
    wins.push(
      lang === "en"
        ? `Top focus: ${muscles[0].label} (${muscles[0].pct}%).`
        : `Trọng tâm hàng đầu: ${muscles[0].label} (${muscles[0].pct}%).`,
    );
  }

  const improvements: string[] = [];
  if (weeklyGoal > 0 && !goalMet) {
    improvements.push(
      lang === "en"
        ? `Missed weekly goal — ${done.length}/${weeklyGoal} sessions.`
        : `Đã bỏ lỡ mục tiêu hàng tuần — ${done.length}/${weeklyGoal} buổi.`,
    );
  }

  if (neglected.length > 0) {
    improvements.push(
      lang === "en"
        ? `No volume on: ${neglected.slice(0, 3).join(", ")}.`
        : `Không có khối lượng trên: ${neglected.slice(0, 3).join(", ")}.`,
    );
  }
  if (muscles[0] && muscles[0].pct > 55) {
    improvements.push(
      lang === "en"
        ? `Distribution leans heavy on ${muscles[0].label} (${muscles[0].pct}%). Consider balancing.`
        : `Phân bổ nặng nghiêng về ${muscles[0].label} (${muscles[0].pct}%). Cân nhắc cân bằng các nhóm cơ.`,
    );
  }

  let coachComment: string;
  if (goalMet && prCount > 0)
    coachComment =
      lang === "en"
        ? "Excellent week — consistent and pushing new ground. Recover well."
        : "Một tuần xuất sắc — nhất quán và đạt được những thành tựu mới. Hãy hồi phục tốt.";
  else if (goalMet)
    coachComment =
      lang === "en"
        ? "You showed up. That's the foundation everything else is built on."
        : "Bạn đã đến phòng tập. Đó là nền tảng cho mọi thứ khác.";
  else if (done.length >= 3)
    coachComment =
      lang === "en"
        ? "Solid work. Keep the rhythm and the numbers will follow."
        : "Làm tốt lắm. Hãy duy trì nhịp độ, kết quả sẽ đến.";
  else if (done.length >= 1)
    coachComment =
      lang === "en"
        ? "A short week — every session still counts. Aim for one more next week."
        : "Một tuần ngắn — mỗi buổi tập vẫn có giá trị. Hãy đặt mục tiêu thêm một buổi nữa vào tuần tới.";
  else
    coachComment =
      lang === "en"
        ? "Quiet week. When you're ready, ease back in with something light."
        : "Tuần hơi trầm. Khi bạn đã sẵn sàng, hãy trở lại với một cái gì đó nhẹ nhàng.";

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

async function ensureWeeklySummary(lang = "en") {
  // Generate the summary for LAST week, once, at the start of the current week.
  const currentWeek = getWeekStart();
  const lastWeek = new Date(currentWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const key = `weekly_summary:${fmtISO(lastWeek)}`;

  const existing = await db.notifications.where("key").equals(key).first();
  if (existing) return;

  const payload = await buildWeeklySummary(lastWeek, lang);
  if (!payload) return; // no activity — skip
  const rangeLabel = `${format(parseISO(payload.weekStart), "MMM d")} – ${format(parseISO(payload.weekEnd), "MMM d")}`;

  await createNotification({
    type: "weekly_summary",
    key,
    title: lang === "en" ? "Last week in review" : "Xem lại tuần trước",
    subtitle: `${rangeLabel} · ${payload.sessions} session${payload.sessions > 1 ? "s" : ""} · ${formatWeight(payload.totalVolume)} · ${formatDuration(payload.totalDurationSec)}`,
    payload,
  });
}

// Called once from the app root on mount.
let ran = false;
export async function runNotificationJobs(lang = "en") {
  if (ran) return;
  ran = true;
  try {
    await ensureWhatsNew(lang);
    await ensureWeeklySummary(lang);
  } catch (err) {
    console.error("notification jobs failed", err);
  }
}
