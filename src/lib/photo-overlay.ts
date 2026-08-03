import { db, type MuscleGroup } from "./db";
import { computeWorkoutAggregate, formatDuration, formatWeight } from "./analytics";

export type OverlayTemplate = "minimal" | "bold" | "premium" | "poster" | "story";
export type OverlayPosition = "top" | "center" | "bottom";
export type OverlayAspect = "4:5" | "1:1" | "9:16";

export interface ShareStats {
  name: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  volumeLabel: string;
  exerciseCount: number;
  setCount: number;
  muscles: string[];
}

export interface OverlayField {
  key: keyof typeof FIELD_LABELS;
  label: string;
}

export const FIELD_LABELS = {
  name: "Workout name",
  date: "Date & time",
  duration: "Duration",
  volume: "Volume",
  exercises: "Exercises",
  sets: "Sets",
  muscles: "Muscle groups",
} as const;

export type FieldKey = keyof typeof FIELD_LABELS;

const GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Arms",
  triceps: "Arms",
  forearms: "Arms",
  quads: "Legs",
  hamstrings: "Legs",
  glutes: "Glutes",
  adductors: "Legs",
  calves: "Calves",
  core: "Core",
  cardio: "Cardio",
};

export async function buildShareStats(workoutId: string, lang: "en" | "vi" = "en"): Promise<ShareStats> {
  const [workout, entries, agg] = await Promise.all([
    db.workouts.get(workoutId),
    db.workoutExercises.where("workoutId").equals(workoutId).toArray(),
    computeWorkoutAggregate(workoutId),
  ]);

  const start = new Date(workout?.startTime ?? Date.now());
  const dateFmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const muscles = Object.entries(agg.muscleVolume)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([m]) => GROUP_LABEL[m as MuscleGroup])
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .slice(0, 3);

  return {
    name: workout?.name ?? `${workout?.location ?? "Gym"} workout`,
    dateLabel: dateFmt.format(start),
    timeLabel: timeFmt.format(start),
    durationLabel: formatDuration(agg.durationSec || workout?.durationSec || 0),
    volumeLabel: formatWeight(Math.round(agg.totalVolume)),
    exerciseCount: entries.length,
    setCount: agg.totalSets,
    muscles,
  };
}

export interface OverlayOptions {
  template: OverlayTemplate;
  position: OverlayPosition;
  aspect: OverlayAspect;
  textColor: string;
  fontScale: number;
  brightness: number; // 1 = neutral
  contrast: number; // 1 = neutral
  gymBoost: boolean;
  offset: number; // 0..1 vertical pan of the crop
  fields: Record<FieldKey, boolean>;
}

export const DEFAULT_OPTIONS: OverlayOptions = {
  template: "premium",
  position: "bottom",
  aspect: "4:5",
  textColor: "#FFFFFF",
  fontScale: 1,
  brightness: 1,
  contrast: 1,
  gymBoost: true,
  offset: 0.5,
  fields: {
    name: true,
    date: true,
    duration: true,
    volume: true,
    exercises: true,
    sets: true,
    muscles: true,
  },
};

export function aspectRatio(a: OverlayAspect) {
  if (a === "1:1") return 1;
  if (a === "9:16") return 9 / 16;
  return 4 / 5;
}

const FONT = (weight: number, size: number) =>
  `${weight} ${size}px "Inter", system-ui, -apple-system, "Segoe UI", sans-serif`;

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  offset: number,
) {
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (W - w) / 2;
  const y = (H - h) * Math.min(1, Math.max(0, offset));
  ctx.drawImage(img, x, y, w, h);
}

/** Average luminance of a region, used to auto-adapt scrims. */
function regionLuminance(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  try {
    const data = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h)).data;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4 * 64) {
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      n++;
    }
    return n ? sum / n / 255 : 0.5;
  } catch {
    return 0.5;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface Stat {
  label: string;
  value: string;
}

function statList(stats: ShareStats, o: OverlayOptions): Stat[] {
  const out: Stat[] = [];
  if (o.fields.duration) out.push({ label: "TIME", value: stats.durationLabel });
  if (o.fields.volume) out.push({ label: "VOLUME", value: stats.volumeLabel });
  if (o.fields.sets) out.push({ label: "SETS", value: String(stats.setCount) });
  if (o.fields.exercises) out.push({ label: "EXERCISES", value: String(stats.exerciseCount) });
  return out;
}

/**
 * Renders the photo + overlay into `canvas` at the given width.
 * Same routine is used for the live preview and the exported image.
 */
export function renderOverlay(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  stats: ShareStats,
  o: OverlayOptions,
  width = 1080,
) {
  const W = width;
  const H = Math.round(width / aspectRatio(o.aspect));
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const u = W / 1080; // unit scale

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);

  if (img) {
    const boost = o.gymBoost ? " contrast(1.12) saturate(1.06) brightness(0.98)" : "";
    ctx.filter = `brightness(${o.brightness}) contrast(${o.contrast})${boost}`;
    drawCover(ctx, img, W, H, o.offset);
    ctx.filter = "none";
    if (o.gymBoost) {
      // subtle clarity: soft dark vignette adds depth / definition
      const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.78);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.34)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const pad = Math.round(72 * u);
  const blockH = Math.round((o.template === "poster" ? 0.5 : 0.4) * H);
  const blockY = o.position === "top" ? 0 : o.position === "center" ? (H - blockH) / 2 : H - blockH;

  // Auto-adaptive readability layer
  const lum = img ? regionLuminance(ctx, 0, Math.max(0, blockY), W, blockH) : 0;
  const dark = lum > 0.55; // bright photo -> darker scrim
  const strength = dark ? 0.78 : 0.62;

  if (o.template === "premium" || o.template === "story") {
    const g = ctx.createLinearGradient(
      0,
      o.position === "top" ? 0 : blockY,
      0,
      o.position === "top" ? blockH : blockY + blockH,
    );
    if (o.position === "top") {
      g.addColorStop(0, `rgba(6,6,8,${strength})`);
      g.addColorStop(1, "rgba(6,6,8,0)");
    } else {
      g.addColorStop(0, "rgba(6,6,8,0)");
      g.addColorStop(1, `rgba(6,6,8,${strength + 0.14})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, blockY, W, blockH);
  } else if (o.template === "minimal") {
    const g = ctx.createLinearGradient(0, blockY, 0, blockY + blockH);
    g.addColorStop(0, o.position === "bottom" ? "rgba(6,6,8,0)" : `rgba(6,6,8,${strength * 0.7})`);
    g.addColorStop(1, o.position === "bottom" ? `rgba(6,6,8,${strength * 0.8})` : "rgba(6,6,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, blockY, W, blockH);
  } else if (o.template === "bold") {
    ctx.fillStyle = `rgba(8,8,10,${dark ? 0.62 : 0.5})`;
    ctx.fillRect(0, blockY, W, blockH);
  } else if (o.template === "poster") {
    ctx.fillStyle = `rgba(8,8,10,${dark ? 0.7 : 0.58})`;
    ctx.fillRect(0, blockY, W, blockH);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(pad * 0.5, blockY + pad * 0.5, W - pad, blockH - pad);
  }

  const text = o.textColor;
  const muted = hexAlpha(text, 0.62);
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18 * u;
  ctx.shadowOffsetY = 2 * u;

  const fs = (n: number) => Math.round(n * u * o.fontScale);
  let y = blockY + (o.position === "top" ? pad + fs(40) : blockH - pad * 0.9);
  const stack: Array<() => void> = [];

  const isPoster = o.template === "poster";
  const items = statList(stats, o);

  // Build from bottom up for bottom/center, top-down for top position
  const drawBrand = () => {
    ctx.font = FONT(800, fs(26));
    ctx.fillStyle = hexAlpha(text, 0.9);
    (ctx as any).letterSpacing = `${Math.round(3 * u)}px`;
    const bw = ctx.measureText("FORGE").width;
    ctx.fillText("FORGE", pad, y);
    (ctx as any).letterSpacing = "0px";
    ctx.font = FONT(500, fs(24));
    ctx.fillStyle = muted;
    ctx.fillText("· strength log", pad + bw + 22 * u, y);
  };

  const drawStats = () => {
    if (!items.length) return;
    const colW = (W - pad * 2) / items.length;
    items.forEach((s, i) => {
      const x = pad + colW * i;
      ctx.textAlign = "left";
      ctx.font = FONT(800, fs(isPoster ? 62 : 56));
      ctx.fillStyle = text;
      ctx.fillText(s.value, x, y);
      ctx.font = FONT(600, fs(20));
      ctx.fillStyle = muted;
      (ctx as any).letterSpacing = `${Math.round(2 * u)}px`;
      ctx.fillText(s.label, x, y - fs(isPoster ? 56 : 52));
      (ctx as any).letterSpacing = "0px";
    });
  };

  const drawMuscles = () => {
    if (!o.fields.muscles || !stats.muscles.length) return;
    let x = pad;
    stats.muscles.forEach((m) => {
      ctx.font = FONT(700, fs(22));
      const w = ctx.measureText(m.toUpperCase()).width + 34 * u;
      const h = fs(46);
      ctx.fillStyle = hexAlpha(text, 0.14);
      roundRect(ctx, x, y - h + fs(12), w, h, h / 2);
      ctx.fill();
      ctx.strokeStyle = hexAlpha(text, 0.28);
      ctx.lineWidth = 1.5 * u;
      ctx.stroke();
      ctx.fillStyle = text;
      (ctx as any).letterSpacing = `${Math.round(1.5 * u)}px`;
      ctx.fillText(m.toUpperCase(), x + 17 * u, y);
      (ctx as any).letterSpacing = "0px";
      x += w + 14 * u;
    });
  };

  const drawName = () => {
    if (!o.fields.name) return;
    ctx.font = FONT(800, fs(isPoster || o.template === "bold" ? 82 : 68));
    ctx.fillStyle = text;
    const name = fit(ctx, stats.name, W - pad * 2);
    ctx.fillText(name, pad, y);
  };

  const drawDate = () => {
    if (!o.fields.date) return;
    ctx.font = FONT(600, fs(26));
    ctx.fillStyle = muted;
    (ctx as any).letterSpacing = `${Math.round(2 * u)}px`;
    ctx.fillText(`${stats.dateLabel.toUpperCase()} · ${stats.timeLabel}`, pad, y);
    (ctx as any).letterSpacing = "0px";
  };

  // ordering per template
  const order: Array<[() => void, number]> =
    o.template === "poster"
      ? [
          [drawDate, 46],
          [drawName, 110],
          [drawMuscles, 118],
          [drawStats, 132],
          [drawBrand, 68],
        ]
      : o.template === "bold"
        ? [
            [drawName, 108],
            [drawStats, 126],
            [drawBrand, 64],
          ]
        : [
            [drawDate, 46],
            [drawName, 100],
            [drawMuscles, 114],
            [drawStats, 126],
            [drawBrand, 64],
          ];

  if (o.position === "top") {
    for (const [fn, gap] of order) {
      fn();
      y += fs(gap);
    }
  } else {
    // draw bottom-up so the block hugs the bottom edge
    for (let i = order.length - 1; i >= 0; i--) {
      const [fn, gap] = order[i];
      fn();
      y -= fs(gap);
    }
  }

  void stack;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function fit(ctx: CanvasRenderingContext2D, str: string, max: number) {
  let s = str;
  while (ctx.measureText(s).width > max && s.length > 4) s = s.slice(0, -2);
  return s === str ? s : s.trimEnd() + "…";
}

function hexAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    // keep the object URL alive for the image lifetime; revoked by GC on page unload
  }
}
