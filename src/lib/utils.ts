import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { getAudioCtx } from "@/lib/audioCtx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date?: Date | string, language: "en" | "vi" = "en") => {
  if (!date) return "-";

  const locale = language === "vi" ? vi : enUS;
  const pattern = language === "vi" ? "EEE, dd/MM/yyyy" : "EEE, MM/dd/yyyy";

  return format(new Date(date), pattern, { locale });
};

export const schoolBellSound = () => {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const bell = (start: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // tiếng kim loại "ringy"
      osc.type = "sawtooth";

      filter.type = "bandpass";
      filter.frequency.value = freq * 2;
      filter.Q.value = 10;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // envelope kiểu chuông trường học (rõ + vang dài)
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 1.2);

      osc.frequency.setValueAtTime(freq, start);

      osc.start(start);
      osc.stop(start + 1.3);
    };

    const base = 880; // A5 - nghe giống chuông trường

    // 3 hồi chuông rõ ràng
    bell(now + 0.0, base);
    bell(now + 0.2, base);
    bell(now + 0.4, base);

    // thêm 1 tiếng cuối dài hơn (optional "tan học!")
    bell(now + 0.6, base * 0.75);

    setTimeout(() => ctx.close(), 5000);
  } catch (e) {
    console.error("school bell error:", e);
  }
};
