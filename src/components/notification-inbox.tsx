import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Bell, CheckCheck, Sparkles, BarChart3, Trash2, Trophy, AlertCircle } from "lucide-react";
import { db, type AppNotification } from "@/lib/db";
import {
  markRead,
  markAllRead,
  deleteNotification,
  type WeeklySummaryPayload,
} from "@/lib/notifications";
import { formatWeight, formatDuration } from "@/lib/analytics";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const items = useLiveQuery(
    () => db.notifications.orderBy("createdAt").reverse().toArray(),
    [],
    [] as AppNotification[],
  );
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:bg-surface"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex min-h-screen p-0 pt-14 w-full flex-col [&>button]:top-18.5 [&>button]:right-4 [&>button]:translate-y-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
          <SheetTitle className="text-base">{t("title.notifications")}</SheetTitle>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs mr-10"
              onClick={() => markAllRead()}
              disabled={unread === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-border bg-surface-elevated">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t("notifications.emptyTitle")}</p>
              <p className="max-w-[26ch] text-xs text-muted-foreground">
                {t("notifications.emptyMessage")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <NotificationCard key={n.id} n={n} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationCard({ n }: { n: AppNotification }) {
  const [expanded, setExpanded] = useState(false);
  const { t, lang } = useT();

  const toggle = () => {
    setExpanded((v) => !v);
    if (!n.read) void markRead(n.id);
  };

  const Icon = n.type === "weekly_summary" ? BarChart3 : Sparkles;

  return (
    <li
      className={`overflow-hidden rounded-xl border transition-colors ${
        n.read ? "border-border bg-card" : "border-primary/30 bg-primary/[0.04]"
      }`}
    >
      <button onClick={toggle} className="flex w-full items-start gap-3 px-3 py-3 text-left">
        <div
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            n.type === "weekly_summary"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-primary/15 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{n.title}</p>
            {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
          </div>
          {n.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{n.subtitle}</p>}
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {relativeTime(n.createdAt, lang)}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          {n.type === "whats_new" ? (
            <p className="text-sm leading-relaxed text-foreground/85">{n.payload?.body}</p>
          ) : n.type === "weekly_summary" ? (
            <WeeklySummaryBody payload={n.payload as WeeklySummaryPayload} />
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => deleteNotification(n.id)}
            >
              <Trash2 className="h-3 w-3" />
              {t("common.delete")}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function WeeklySummaryBody({ payload }: { payload: WeeklySummaryPayload }) {
  const { t } = useT();
  if (!payload) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Metric label={t("home.sessions")} value={String(payload.sessions)} />
        <Metric label={t("common.volume")} value={formatWeight(payload.totalVolume)} />
        <Metric label={t("common.time")} value={formatDuration(payload.totalDurationSec)} />
      </div>

      {payload.muscles.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("common.muscleDistribution")}
          </p>
          <ul className="space-y-1">
            {payload.muscles.map((m) => (
              <li key={m.bucket} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate">{m.label}</span>
                <span className="num w-8 text-right text-muted-foreground tabular-nums">
                  {m.pct}%
                </span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payload.wins.length > 0 && (
        <Insights icon={Trophy} tone="win" title={t("common.achievements")} items={payload.wins} />
      )}
      {payload.improvements.length > 0 && (
        <Insights
          icon={AlertCircle}
          tone="warn"
          title="Room to grow"
          items={payload.improvements}
        />
      )}

      <div className="rounded-lg border border-border bg-surface-elevated p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common.coachNote")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{payload.coachComment}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-2 text-center">
      <p className="num text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Insights({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: any;
  tone: "win" | "warn";
  title: string;
  items: string[];
}) {
  const color =
    tone === "win" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10";
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`grid h-5 w-5 place-items-center rounded ${color}`}>
          <Icon className="h-3 w-3" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <ul className="space-y-1 pl-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-foreground/85">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function relativeTime(ts: number, lang = "en") {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return lang === "en" ? "just now" : "vừa xong";
  if (m < 60) return lang === "en" ? `${m}m ago` : `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "en" ? `${h}h ago` : `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return lang === "en" ? `${d}d ago` : `${d} ngày trước`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
