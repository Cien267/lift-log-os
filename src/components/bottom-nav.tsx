import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Dumbbell, History, BarChart3, User, Settings as SettingsIcon, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/body", label: "Body", icon: User },
  { to: "/templates", label: "Plans", icon: LayoutTemplate },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
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
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--color-primary)]")} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
