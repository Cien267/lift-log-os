import { TrendingUp, Minus, TrendingDown, Sparkles, Check } from "lucide-react";
import type { ProgressionSuggestion, ProgressionVerdict } from "@/lib/progression";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface Props {
  suggestion: ProgressionSuggestion;
  currentWeight?: number;
  currentReps?: number;
  currentMinutes?: number;
  onApply: () => void;
  onDismiss: () => void;
}


const styleFor = (v: ProgressionVerdict) => {
  switch (v) {
    case "increase":
      return {
        Icon: TrendingUp,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/30",
        dot: "bg-success",
      };
    case "deload":
      return {
        Icon: TrendingDown,
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/30",
        dot: "bg-warning",
      };
    case "new":
      return {
        Icon: Sparkles,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30",
        dot: "bg-primary",
      };
    default:
      return {
        Icon: Minus,
        color: "text-muted-foreground",
        bg: "bg-secondary/60",
        border: "border-border",
        dot: "bg-muted-foreground",
      };
  }
};

const labelFor = (v: ProgressionVerdict, lang: "en" | "vi") => {
  const L = {
    en: { increase: "Push it", hold: "Hold steady", deload: "Ease back", new: "Warm start" },
    vi: {
      increase: "Tăng lên",
      hold: "Giữ vững",
      deload: "Chậm lại",
      new: "Khởi đầu",
    },
  } as const;
  return L[lang][v];
};

export function CoachSuggestion({
  suggestion,
  currentWeight,
  currentReps,
  currentMinutes,
  onApply,
  onDismiss,
}: Props) {
  const { lang } = useT();
  const s = styleFor(suggestion.verdict);
  const { Icon } = s;
  const cardio = !!suggestion.isCardio;
  const suggestedMinutes = suggestion.minutes ?? 0;

  const alreadyApplied = cardio
    ? currentMinutes !== undefined && Math.abs(currentMinutes - suggestedMinutes) < 0.001
    : currentWeight !== undefined &&
      currentReps !== undefined &&
      Math.abs(currentWeight - suggestion.weight) < 0.001 &&
      currentReps === suggestion.reps;

  const applyLabel = lang === "vi" ? "Áp dụng" : "Apply";
  const dismissLabel = lang === "vi" ? "Ẩn" : "Dismiss";
  const appliedLabel = lang === "vi" ? "Đã áp dụng" : "Applied";
  const targetLabel = lang === "vi" ? "Gợi ý" : "Suggested";
  const setsWord = lang === "vi" ? "sets" : "sets";
  const minWord = lang === "vi" ? "phút" : "min";

  // Cardio targets are expressed in minutes per set, never in kg × reps.
  const targetText = cardio
    ? `${suggestedMinutes % 1 === 0 ? suggestedMinutes : suggestedMinutes.toFixed(1)} ${minWord} · ${suggestion.sets} ${setsWord}`
    : `${suggestion.weight % 1 === 0 ? suggestion.weight : suggestion.weight.toFixed(1)} kg × ${suggestion.reps} · ${suggestion.sets} ${setsWord}`;

  return (
    <div className={`mx-3 mt-2 mb-4 rounded-xl border ${s.border} ${s.bg} px-3 py-2.5`}>
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.bg} ${s.color}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.color}`}>
              {labelFor(suggestion.verdict, lang)}
            </p>
            <p className="num text-[11px] text-muted-foreground">
              {targetLabel}: {targetText}
            </p>
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-foreground/85">{suggestion.reason}</p>
        </div>
      </div>

          <p className="mt-0.5 text-[12px] leading-snug text-foreground/85">{suggestion.reason}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5">
        {alreadyApplied ? (
          <>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3" /> {appliedLabel}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] ml-3"
              onClick={onDismiss}
            >
              {dismissLabel}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={onDismiss}>
              {dismissLabel}
            </Button>
            <Button size="sm" className="h-7 px-2 text-[11px]" onClick={onApply}>
              {applyLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
