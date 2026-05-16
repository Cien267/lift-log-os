import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";
import { db, uid, type BodyMeasurement } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

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

function BodyPage() {
  const measurements = useLiveQuery(() => db.measurements.orderBy("date").reverse().toArray()) ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<BodyMeasurement>>({ date: new Date().toISOString().slice(0, 10) });

  const save = async () => {
    if (!form.date) return;
    await db.measurements.add({ id: uid(), date: form.date, ...form } as BodyMeasurement);
    setForm({ date: new Date().toISOString().slice(0, 10) });
    setOpen(false);
  };

  const weightSeries = [...measurements].reverse().filter((m) => m.weight).map((m) => ({ date: m.date.slice(5), v: m.weight }));
  const latest = measurements[0];
  const prev = measurements[1];

  return (
    <AppShell
      title="Body"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Log</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New measurement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block text-xs">Date</Label>
                <Input type="date" value={form.date as string} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FIELDS.map((f) => (
                  <div key={f.key as string}>
                    <Label className="mb-1 block text-xs">{f.label} ({f.unit})</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={(form as any)[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Bodyweight</p>
          <p className="num mt-1 text-3xl font-semibold tracking-tight">
            {latest?.weight ? `${latest.weight} kg` : "—"}
          </p>
          {latest && prev && latest.weight && prev.weight && (
            <p className="num text-xs text-muted-foreground">
              {latest.weight > prev.weight ? "+" : ""}{(latest.weight - prev.weight).toFixed(1)} kg since {prev.date}
            </p>
          )}
          {weightSeries.length > 1 && (
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={weightSeries}>
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={30} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
          {measurements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No measurements logged yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {measurements.map((m) => (
                <li key={m.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="num text-sm font-semibold">{m.date}</p>
                    {m.weight && <p className="num text-sm">{m.weight} kg</p>}
                  </div>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {FIELDS.filter((f) => f.key !== "weight" && (m as any)[f.key]).map((f) => `${f.label} ${(m as any)[f.key]}${f.unit}`).join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
