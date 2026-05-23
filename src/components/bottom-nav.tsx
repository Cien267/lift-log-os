import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Dumbbell,
  History,
  BarChart3,
  User,
  Settings as SettingsIcon,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type TKey } from "@/lib/i18n";

const items: { to: string; key: TKey; icon: typeof Home }[] = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/workout", key: "nav.workout", icon: Dumbbell },
  { to: "/history", key: "nav.history", icon: History },
  { to: "/analytics", key: "nav.stats", icon: BarChart3 },
  { to: "/body", key: "nav.body", icon: User },
  { to: "/templates", key: "nav.plans", icon: LayoutTemplate },
  { to: "/settings", key: "nav.settings", icon: SettingsIcon },
];

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { t } = useT();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border pb-safe">
      <ul className="mx-auto grid max-w-2xl grid-cols-7 px-1 pt-1">
        {items.map((it) => {
          const active = path === it.to || (it.to !== "/" && path.startsWith(it.to));
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex">
              <Link
                to={it.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--color-primary)]")}
                />
                <span>{t(it.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
