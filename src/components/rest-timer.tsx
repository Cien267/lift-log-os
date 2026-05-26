import { useEffect, useRef, useState } from "react";
import { Timer, X, Plus, Minus, Minimize2, Maximize2 } from "lucide-react";
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
  } catch {
    return null;
  }
}
function write(s: RestState | null) {
  if (typeof localStorage === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("forge:rest"));
}

export const startRest = (duration: number) => {
  write({ endsAt: Date.now() + duration * 1000, duration });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("forge:rest:expand"));
  }
};
export const stopRest = () => write(null);

const fmt = (s: number) => `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, "0")}`;

export function RestTimerBar() {
  const [state, setState] = useState<RestState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const beeped = useRef(false);

  useEffect(() => {
    const sync = () => setState(read());
    const expand = () => setMinimized(false);
    sync();
    window.addEventListener("forge:rest", sync);
    window.addEventListener("forge:rest:expand", expand);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("forge:rest", sync);
      window.removeEventListener("forge:rest:expand", expand);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    beeped.current = false;
    const tick = () => {
      const r = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0 && !beeped.current) {
        beeped.current = true;
        try {
          navigator.vibrate?.([180, 80, 180]);
        } catch (e: any) {
          console.error("error: ", e);
        }
        // auto-close after brief moment so user notices it hit zero
        setTimeout(() => stopRest(), 600);
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [state]);

  if (!state) return null;
  const pct = Math.max(0, Math.min(1, remaining / state.duration));

  if (minimized) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-2xl px-3">
        <div className="glass relative overflow-hidden rounded-2xl border border-border shadow-lg">
          <div
            className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-300"
            style={{ width: `${pct * 100}%` }}
          />
          <div
            className="relative flex items-center gap-2 px-3 py-2.5"
            onClick={() => setMinimized(false)}
          >
            <Timer className="h-4 w-4 text-primary" />
            <span className="num text-base font-semibold tracking-tight">{fmt(remaining)}</span>
            <span className="text-xs text-muted-foreground">rest</span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Expand">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={stopRest}
                aria-label="Stop"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen overlay
  const size = 260;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl py-6">
      <div className="flex items-center justify-between px-4 pt-safe pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4 text-primary" />
          Rest
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMinimized(true)}
          aria-label="Minimize"
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="var(--color-border)"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="var(--color-primary)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-6xl font-semibold tracking-tight tabular-nums">
              {fmt(remaining)}
            </span>
            <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              remaining
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => startRest(Math.max(0, remaining - 15))}
            className="gap-1"
          >
            <Minus className="h-4 w-4" /> 15s
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => startRest(Math.max(15, remaining + 15))}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> 15s
          </Button>
        </div>

        <Button variant="ghost" onClick={stopRest} className="text-muted-foreground">
          Skip rest
        </Button>
      </div>
    </div>
  );
}
