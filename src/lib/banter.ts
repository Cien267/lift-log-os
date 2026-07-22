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

const MESSAGES_EN: Record<BanterTrigger, Line[]> = {
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

const MESSAGES_VI: Record<BanterTrigger, Line[]> = {
  "exercise.removed": [
    (c) => `${c.name ?? "Bài này"} à? Thôi bỏ cũng được.`,
    (c) => `Cho ${c.name ?? "bài này"} nghỉ hưu luôn nhỉ.`,
    "Xóa rồi. Thanh tạ sẽ nhớ bạn.",
    "Bớt một bài. Bớt một cái cớ.",
    "Cơ bắp nào đó vừa thở phào.",
  ],

  "exercise.added": [
    "Thêm bài nữa à? Quyết tâm ghê.",
    "Được đấy, chơi lớn luôn.",
    "Thêm tí thử thách. Thích rồi đó.",
    "Thêm vào. Đốt thêm chút nào.",
  ],

  "set.extra": [
    "Thêm một set. Có vẻ còn sung.",
    "Set bonus luôn à?",
    "Cố thêm chút nữa. Tương lai sẽ cảm ơn bạn.",
    "Đúng bài. Đúng chất.",
  ],

  "set.warmupMarked": [
    "Đánh dấu khởi động. Hợp lý.",
    "Khởi động trước đi rồi chiến.",
    "Máy đã nổ. Vào việc thôi.",
  ],

  "workout.discarded": [
    "Xóa buổi tập rồi. Làm lại từ đầu nhé.",
    "Không sao, hôm khác chiến tiếp.",
    "Reset. Mai quay lại mạnh hơn.",
  ],

  "workout.finishedClean": [
    "Hoàn thành hết. Đẹp.",
    "Không sót set nào. Quá gọn.",
    "Kết thúc chuẩn chỉnh.",
    "Buổi tập này đáng điểm 10.",
  ],

  "workout.finishedIncomplete": [
    (c) => `Còn ${c.incomplete ?? "vài"} set chưa làm. Lần sau chốt nốt nhé.`,
    (c) => `${c.incomplete ?? "Vài"} set còn dang dở. Không sao, vẫn hơn nằm nhà.`,
    "Hơi tiếc một chút. Nhưng có tập là thắng rồi.",
    "Tiến bộ quan trọng hơn hoàn hảo.",
  ],

  "workout.longBreakReturn": [
    (c) => `${c.days ?? "Mấy"} ngày mới quay lại. Thanh tạ nhớ bạn lắm.`,
    (c) => `Chào mừng trở lại sau ${c.days ?? "một thời gian"} ngày.`,
    "Quay lại là tốt rồi. Nhẹ trước, khỏe sau.",
    "Đừng sĩ diện. Hôm nay cứ vào nhịp lại đã.",
  ],

  "workout.newPR": [
    (c) =>
      c.count > 1 ? `${c.count} PR trong một buổi? Hôm nay cháy thật đấy.` : "PR mới! Quá đã.",
    "Kỷ lục mới. Xứng đáng ăn mừng.",
    "Con số đẹp lên rồi.",
    "Sức mạnh vừa lên level.",
  ],

  "workout.marathon": [
    (c) => `${c.minutes ?? "Khá nhiều"} phút trong phòng gym. Nhớ uống nước nhé.`,
    "Buổi tập dài phết. Tối nay ngủ ngon đây.",
    "Chiến lâu thế này thì cơ bắp phải biết điều thôi.",
  ],

  "rest.skipped": [
    "Bỏ nghỉ luôn à? Máu đấy.",
    "Không nghỉ luôn? Ghê thật.",
    "Nhớ đừng quá sức nhé.",
  ],
};

function pick(trigger: BanterTrigger, ctx: Ctx, lang: string): string | null {
  const pool = lang === "vi" ? MESSAGES_VI[trigger] : MESSAGES_EN[trigger];
  if (!pool || pool.length === 0) return null;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return typeof line === "function" ? line(ctx) : line;
}

// Anti-spam: don't repeat the same trigger within N ms.
const lastFired: Record<string, number> = {};
const DEDUPE_MS = 1500;

export function banter(trigger: BanterTrigger, ctx: Ctx = {}, lang: string = "en") {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (lastFired[trigger] && now - lastFired[trigger] < DEDUPE_MS) return;
  lastFired[trigger] = now;
  const msg = pick(trigger, ctx, lang);
  if (!msg) return;
  toast(msg, { duration: 3000, position: "bottom-right" });
}

/** Register additional messages at runtime (for future extensions). */
export function registerBanterLines(trigger: BanterTrigger, lines: Line[], lang: string) {
  const existing = lang === "vi" ? (MESSAGES_VI[trigger] ?? []) : (MESSAGES_EN[trigger] ?? []);
  if (lang === "vi") {
    MESSAGES_VI[trigger] = [...existing, ...lines];
  } else {
    MESSAGES_EN[trigger] = [...existing, ...lines];
  }
}
