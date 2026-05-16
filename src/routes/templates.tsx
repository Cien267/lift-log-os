import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Plus, Trash2, ChevronRight, X } from "lucide-react";
import { db, uid, type WorkoutTemplate, type TemplateExercise } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExercisePicker } from "@/components/exercise-picker";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Plans — Forge" },
      { name: "description", content: "Build and manage workout templates." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const templates = useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const create = () => {
    const t: WorkoutTemplate = {
      id: uid(), name: "New plan", location: "gym", exercises: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setEditing(t);
  };

  const save = async () => {
    if (!editing) return;
    await db.templates.put({ ...editing, updatedAt: Date.now() });
    setEditing(null);
  };

  return (
    <AppShell
      title="Plans"
      action={<Button size="sm" onClick={create} className="gap-1.5"><Plus className="h-4 w-4" />New</Button>}
    >
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No plans yet. Build one to repeat workouts easily.
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setEditing(t)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{t.location} · {t.exercises.length} exercises</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit plan</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block text-xs">Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Location</Label>
                <Select value={editing.location} onValueChange={(v) => setEditing({ ...editing, location: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">Exercises</Label>
                  <Button size="sm" variant="ghost" onClick={() => setPickerOpen(true)} className="gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <ul className="space-y-1.5">
                  {editing.exercises.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No exercises yet.</li>
                  )}
                  {editing.exercises.map((te, idx) => (
                    <li key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-secondary p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{exMap.get(te.exerciseId)?.name ?? "?"}</p>
                        <p className="text-[11px] text-muted-foreground">{te.targetSets} sets</p>
                      </div>
                      <Input
                        type="number"
                        value={te.targetSets}
                        onChange={(e) => {
                          const next = [...editing.exercises];
                          next[idx] = { ...te, targetSets: Number(e.target.value) || 1 };
                          setEditing({ ...editing, exercises: next });
                        }}
                        className="num h-8 w-14 text-center"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        setEditing({ ...editing, exercises: editing.exercises.filter((_, i) => i !== idx) });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between gap-2">
            <Button variant="ghost" className="text-destructive" onClick={async () => {
              if (editing) { await db.templates.delete(editing.id); setEditing(null); }
            }}>
              <Trash2 className="mr-1.5 h-4 w-4" />Delete
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(exerciseId) => {
          if (!editing) return;
          const te: TemplateExercise = { exerciseId, order: editing.exercises.length, targetSets: 3 };
          setEditing({ ...editing, exercises: [...editing.exercises, te] });
        }}
      />
    </AppShell>
  );
}
