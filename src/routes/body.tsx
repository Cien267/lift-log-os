import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { db, uid, type BodyMeasurement } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/body")({
  head: () => ({
    meta: [
      { title: "Body — Forge" },
      { name: "description", content: "Track bodyweight, measurements, and progression." },
    ],
  }),
  component: BodyPage,
});

const FIELDS: { key: keyof BodyMeasurement; label: string; unit: string }[] = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "bodyFat", label: "Body fat", unit: "%" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "arm", label: "Arm", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "shoulder", label: "Shoulder", unit: "cm" },
];

const emptyForm = (): Partial<BodyMeasurement> => ({
  date: new Date().toISOString().slice(0, 10),
});

function BodyPage() {
  const { t } = useT();
  const { settings } = useSettings();
  const lang = settings?.language ?? "en";
  const measurements =
    useLiveQuery(() => db.measurements.orderBy("date").reverse().toArray()) ?? [];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BodyMeasurement>>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (m: BodyMeasurement) => {
    setEditingId(m.id);
    setForm({ ...m });
    setOpen(true);
  };

  const save = async () => {
    if (!form.date) return;
    if (editingId) {
      await db.measurements.update(editingId, form);
    } else {
      await db.measurements.add({ id: uid(), ...form } as BodyMeasurement);
    }
    setForm(emptyForm());
    setEditingId(null);
    setOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await db.measurements.delete(deleteId);
    setDeleteId(null);
  };

  const weightSeries = [...measurements]
    .reverse()
    .filter((m) => m.weight)
    .map((m) => ({ date: m.date.slice(5), v: m.weight }));
  const latest = measurements[0];
  const prev = measurements[1];

  return (
    <AppShell
      title={t("title.body")}
      action={
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" />
          {t("common.log")}
        </Button>
      }
    >
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingId(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("body.editMeasurement") : t("body.createMeasurement")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Date</Label>
              <Input
                type="date"
                value={form.date as string}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key as string}>
                  <Label className="mb-1 block text-xs">
                    {f.label} ({f.unit})
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={(form as any)[f.key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>{editingId ? t("common.update") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("common.bodyWeight")}
          </p>
          <p className="num mt-1 text-3xl font-semibold tracking-tight">
            {latest?.weight ? `${latest.weight} kg` : "—"}
          </p>
          {latest && prev && latest.weight && prev.weight && (
            <p className="num text-xs text-muted-foreground mt-1">
              {latest.weight > prev.weight ? "+" : ""}
              {(latest.weight - prev.weight).toFixed(1)} kg {t("common.since")}{" "}
              {formatDate(prev.date, lang)}
            </p>
          )}
          {weightSeries.length > 1 && (
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={weightSeries}>
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.history")}
          </h2>
          {measurements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {t("body.emptyMeasurements")}
            </div>
          ) : (
            <ul className="space-y-2">
              {measurements.map((m) => (
                <li key={m.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="num text-sm font-semibold">{formatDate(m.date, lang)}</p>
                    <div className="flex items-center gap-1">
                      {m.weight && <p className="num mr-1 text-sm">{m.weight} kg</p>}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(m)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(m.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {FIELDS.filter((f) => f.key !== "weight" && (m as any)[f.key])
                      .map((f) => `${f.label} ${(m as any)[f.key]}${f.unit}`)
                      .join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="w-[95%]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("body.deleteMeasurement")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.deleteMessage")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
