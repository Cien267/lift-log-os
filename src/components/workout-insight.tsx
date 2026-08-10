import { TrendingUp, TrendingDown, Minus, Trophy, Sparkles } from "lucide-react";
import type { WorkoutInsight, ExerciseInsight } from "@/lib/insight";
import { formatDuration, formatWeight } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

function fmtPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function VerdictIcon({ v }: { v: ExerciseInsight["verdict"] }) {
  if (v === "progress") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (v === "regress") return <TrendingDown className="h-4 w-4 text-orange-500" />;
  if (v === "new") return <Sparkles className="h-4 w-4 text-primary" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function Stat({
  label,
  cur,
  prev,
  suffix,
}: {
  label: string;
  cur: string | number;
  prev?: string | number;
  suffix?: string;
}) {
  const { t } = useT();
  return (
    <div className="rounded-lg bg-secondary/50 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="num text-sm font-semibold">
        {cur}
        {suffix}
      </p>
      {prev !== undefined && (
        <p className="num text-[10px] text-muted-foreground">
          {t("common.prev")}: {prev}
          {suffix}
        </p>
      )}
    </div>
  );
}

export function InsightView({
  insight,
  compact = false,
}: {
  insight: WorkoutInsight;
  compact?: boolean;
}) {
  const { t } = useT();
  const { settings } = useSettings();
  const lang = settings?.language ?? "en";
  const hasPrev = !!insight.previous;
  const volColor =
    insight.totalVolumeDelta > 0
      ? "text-emerald-500"
      : insight.totalVolumeDelta < 0
        ? "text-orange-500"
        : "text-muted-foreground";

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          {insight.prCount > 0 ? (
            <Trophy className="h-5 w-5 text-primary" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
          <p className="text-sm font-semibold">{t("history.sessionInsight")}</p>
        </div>
        <p className="mt-1 text-base font-bold leading-snug">{insight.headline}</p>
        {hasPrev && insight.comparedToDate && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("common.comparedTo")} {formatDate(insight.comparedToDate, lang)}
            {insight.compareMode === "template" ? " · same plan" : ""}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("common.volume")}
          </p>
          <p className="num text-base font-bold">
            {formatSessionVolume({
              totalVolume: insight.current.totalVolume,
              totalCardioMin: insight.current.totalCardioMin,
            })}
          </p>
          {hasPrev && insight.current.totalVolume > 0 && (
            <p className={cn("num text-[11px] font-medium", volColor)}>
              {fmtPct(insight.totalVolumePct)}
            </p>
          )}
          {hasPrev && insight.current.totalVolume === 0 && !!insight.cardioMinDelta && (
            <p className="num text-[11px] text-muted-foreground">
              {insight.cardioMinDelta > 0 ? "+" : ""}
              {Math.round(insight.cardioMinDelta)}m {t("common.vsLast")}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sets</p>
          <p className="num text-base font-bold">{insight.current.totalSets}</p>
          {hasPrev && (
            <p className="num text-[11px] text-muted-foreground">
              {insight.totalSetsDelta > 0 ? "+" : ""}
              {insight.totalSetsDelta} {t("common.vsLast")}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("common.duration")}
          </p>
          <p className="num text-base font-bold">{formatDuration(insight.current.durationSec)}</p>
          {hasPrev && (
            <p className="num text-[11px] text-muted-foreground">
              {insight.durationDelta > 0 ? "+" : ""}
              {Math.round(insight.durationDelta / 60)}m {t("common.vsLast")}
            </p>
          )}
        </div>
      </div>

      {insight.exercises.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("common.perExercise")}
          </p>
          {insight.exercises.map((e) => (
            <div key={e.exerciseId} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{e.exerciseName}</p>
                <VerdictIcon v={e.verdict} />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                <Stat
                  label="Top"
                  cur={formatWeight(e.currentTopWeight)}
                  prev={e.verdict !== "new" ? formatWeight(e.prevTopWeight) : undefined}
                />
                <Stat
                  label="Sets"
                  cur={e.currentSets}
                  prev={e.verdict !== "new" ? e.prevSets : undefined}
                />
                <Stat
                  label="Reps"
                  cur={e.currentTotalReps}
                  prev={e.verdict !== "new" ? e.prevTotalReps : undefined}
                />
                <Stat
                  label="e1RM"
                  cur={Math.round(e.currentBestE1rm)}
                  prev={e.verdict !== "new" ? Math.round(e.prevBestE1rm) : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
