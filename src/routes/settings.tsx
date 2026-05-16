import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Download, Upload, Sun, Moon, Monitor, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";
import { exportAll, importAll } from "@/lib/workout-service";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Forge" },
      { name: "description", content: "Customize units, rest timer, theme, and manage your data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, update } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settings) return <AppShell title="Settings"><div /></AppShell>;

  const doExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await importAll(data);
      alert("Backup imported.");
    } catch {
      alert("Invalid backup file.");
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL workouts, templates, and measurements? This cannot be undone.")) return;
    await db.transaction("rw", db.tables, async () => {
      await Promise.all([
        db.workouts.clear(), db.workoutExercises.clear(), db.workoutSets.clear(),
        db.templates.clear(), db.measurements.clear(), db.photos.clear(),
        db.recovery.clear(), db.prs.clear(),
      ]);
    });
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-4">
        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-2">
            {([
              ["dark", "Dark", Moon],
              ["light", "Light", Sun],
              ["system", "Auto", Monitor],
            ] as const).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => update({ theme: val })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium",
                  settings.theme === val ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Workout">
          <Row label="Default rest (seconds)">
            <Input
              type="number"
              className="num w-24 text-right"
              value={settings.defaultRest}
              onChange={(e) => update({ defaultRest: Number(e.target.value) || 0 })}
            />
          </Row>
          <Row label="Weekly goal (sessions)">
            <Input
              type="number"
              className="num w-24 text-right"
              value={settings.weeklyGoal ?? 4}
              onChange={(e) => update({ weeklyGoal: Number(e.target.value) || 0 })}
            />
          </Row>
        </Section>

        <Section title="Data">
          <Button onClick={doExport} variant="secondary" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" /> Export backup (.json)
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="secondary" className="w-full justify-start gap-2">
            <Upload className="h-4 w-4" /> Import backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); }} />
          <Button onClick={clearAll} variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete all data
          </Button>
        </Section>

        <p className="px-1 text-center text-[11px] text-muted-foreground">
          Forge stores everything locally on this device. Export regularly to keep a backup safe.
        </p>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label className="text-sm text-foreground/90">{label}</Label>
      {children}
    </div>
  );
}
