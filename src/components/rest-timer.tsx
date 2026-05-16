import { useEffect, useRef, useState } from "react";
import { Timer, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "forge.restTimer";

interface RestState {
  endsAt: number;
  duration: number;
}

function read(): RestState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function write(s: RestState | null) {
  if (typeof localStorage === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("forge:rest"));
}

export const startRest = (duration: number) => {
  write({ endsAt: Date.now() + duration * 1000, duration });
};
export const stopRest = () => write(null);

export function RestTimerBar() {
  const [state, setState] = useState<RestState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const beeped = useRef(false);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    window.addEventListener("forge:rest", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("forge:rest", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    beeped.current = false;
    const t = setInterval(() => {
      const r = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0 && !beeped.current) {
        beeped.current = true;
        try { navigator.vibrate?.([180, 80, 180]); } catch {}
      }
    }, 250);
    return () => clearInterval(t);
  }, [state]);

  if (!state) return null;
  const pct = Math.max(0, Math.min(1, remaining / state.duration));

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-2xl px-3">
      <div className="glass relative overflow-hidden rounded-2xl border border-border shadow-lg">
        <div
          className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-300"
          style={{ width: `${pct * 100}%` }}
        />
        <div className="relative flex items-center gap-2 px-3 py-2.5">
          <Timer className="h-4 w-4 text-primary" />
          <span className="num text-base font-semibold tracking-tight">
            {String(Math.floor(remaining / 60)).padStart(1, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">rest</span>
          <div className="ml-auto flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startRest(Math.max(15, remaining + 15))}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startRest(Math.max(0, remaining - 15))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={stopRest}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
