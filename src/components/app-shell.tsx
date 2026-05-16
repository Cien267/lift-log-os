import { type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      {title && (
        <header className="sticky top-0 z-30 glass border-b border-border pt-safe">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {action}
          </div>
        </header>
      )}
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
