import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Download, Upload, Sun, Moon, Monitor, Trash2, Languages, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";
import { exportAll, importAll } from "@/lib/workout-service";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_SETTINGS } from "@/lib/seed";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Forge" },
      { name: "description", content: "Customize units, rest timer, theme, and manage your data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, update } = useSettings();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settings)
    return (
      <AppShell title={t("title.settings")}>
        <div />
      </AppShell>
    );

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
      alert(t("settings.importedOk"));
    } catch {
      alert(t("settings.invalidFile"));
    }
  };

  const clearAll = async () => {
    if (!confirm(t("settings.confirmClear"))) return;
    await db.transaction("rw", db.tables, async () => {
      await Promise.all([
        db.workouts.clear(),
        db.workoutExercises.clear(),
        db.workoutSets.clear(),
        db.templates.clear(),
        db.measurements.clear(),
        db.photos.clear(),
        db.recovery.clear(),
        db.prs.clear(),
        db.settings.put(DEFAULT_SETTINGS),
      ]);
    });
  };

  const lang = settings.language ?? "en";

  return (
    <AppShell title={t("title.settings")}>
      <div className="space-y-4">
        <Section title={t("settings.appearance")}>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["dark", t("settings.theme.dark"), Moon],
                ["light", t("settings.theme.light"), Sun],
                ["system", t("settings.theme.auto"), Monitor],
              ] as const
            ).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => update({ theme: val })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium",
                  settings.theme === val
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("settings.language")}>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "vi"] as const).map((code) => (
              <button
                key={code}
                onClick={() => update({ language: code })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium",
                  lang === code
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Languages className="h-4 w-4" />
                {code === "en" ? t("lang.en") : t("lang.vi")}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("settings.aboutMe")}>
          <Row label={t("settings.userName")}>
            <Input
              type="text"
              className="w-full"
              value={settings.userName}
              onChange={(e) => update({ userName: e.target.value })}
            />
          </Row>
        </Section>

        <Section title={t("settings.workout")}>
          <Row
            label={
              <div className="flex items-center gap-1">
                <span>{t("settings.defaultRest")}</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-1" />
                  </PopoverTrigger>

                  <PopoverContent className="w-64 text-sm">
                    {t("settings.defaultRestDescription")}
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <Input
              type="number"
              className="num w-24 text-right"
              value={settings.defaultRest}
              onChange={(e) => update({ defaultRest: Number(e.target.value) || 0 })}
            />
          </Row>
          <Row
            label={
              <div className="flex items-center gap-1">
                <span>{t("settings.weeklyGoal")}</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-1" />
                  </PopoverTrigger>

                  <PopoverContent className="w-64 text-sm">
                    {t("settings.weeklyGoalDescription")}
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <Input
              type="number"
              className="num w-24 text-right"
              value={settings.weeklyGoal ?? 4}
              onChange={(e) => update({ weeklyGoal: Number(e.target.value) || 0 })}
            />
          </Row>
          <Row
            label={
              <div className="flex items-center gap-1">
                <span>{t("settings.targetWeight")}</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-1" />
                  </PopoverTrigger>

                  <PopoverContent className="w-64 text-sm">
                    {t("settings.targetWeightDescription")}
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <Input
              type="number"
              inputMode="decimal"
              className="num w-24 text-right"
              value={settings.targetWeight ?? ""}
              onChange={(e) =>
                update({ targetWeight: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Row>
          <Row
            label={
              <div className="flex items-center gap-1">
                <span>{t("settings.trainingAssistant")}</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground ml-1" />
                  </PopoverTrigger>

                  <PopoverContent className="w-64 text-sm">
                    {t("settings.trainingAssistantDescription")}
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <Switch
              checked={settings.trainingAssistant ?? false}
              onCheckedChange={(checked) => update({ trainingAssistant: checked })}
            />
          </Row>
        </Section>

        <Section title={t("settings.data")}>
          <Button onClick={doExport} variant="secondary" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" /> {t("settings.export")}
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            variant="secondary"
            className="w-full justify-start gap-2"
          >
            <Upload className="h-4 w-4" /> {t("settings.import")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
            }}
          />
          <Button
            onClick={clearAll}
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> {t("settings.deleteAll")}
          </Button>
        </Section>

        <p className="px-1 text-center text-[11px] text-muted-foreground">{t("settings.footer")}</p>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label className="text-sm text-foreground/90">{label}</Label>
      {children}
    </div>
  );
}
