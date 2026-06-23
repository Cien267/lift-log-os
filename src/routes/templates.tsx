import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronRight, X, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db, uid, type WorkoutTemplate, type TemplateExercise } from "@/lib/db";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExercisePicker } from "@/components/exercise-picker";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Plans — Forge" },
      { name: "description", content: "Build and manage workout templates." },
    ],
  }),
  component: TemplatesPage,
});

interface SortableExerciseProps {
  id: string;
  te: TemplateExercise;
  idx: number;
  name: string;
  onSetsChange: (idx: number, value: number) => void;
  onSetsBlur: (idx: number) => void;
  onRemove: (idx: number) => void;
}

function SortableExercise({
  id,
  te,
  idx,
  name,
  onSetsChange,
  onSetsBlur,
  onRemove,
}: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-secondary p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="wrap-break-word text-sm">{name}</p>
        <p className="text-[11px] text-muted-foreground">{te.targetSets} sets</p>
      </div>
      <Input
        type="text"
        inputMode="numeric"
        value={Number.isFinite(te.targetSets) ? String(te.targetSets) : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          onSetsChange(idx, raw === "" ? (NaN as any) : Number(raw));
        }}
        onBlur={() => onSetsBlur(idx)}
        className="num h-8 w-14 text-center"
      />
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemove(idx)}>
        <X className="h-4 w-4" />
      </Button>
    </li>
  );
}

function TemplatesPage() {
  const { t } = useT();
  const rawTemplates = useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray());
  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);
  const groupedTemplates = useMemo(() => {
    return templates.reduce(
      (acc, template) => {
        (acc[template.location] ??= []).push(template);
        return acc;
      },
      {} as Record<string, WorkoutTemplate[]>,
    );
  }, [templates]);
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editing || !over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    const next = arrayMove(editing.exercises, from, to).map((e, i) => ({ ...e, order: i }));
    setEditing({ ...editing, exercises: next });
  };

  const updateSets = (idx: number, value: number) => {
    if (!editing) return;
    const next = [...editing.exercises];
    next[idx] = { ...next[idx], targetSets: value };
    setEditing({ ...editing, exercises: next });
  };

  const blurSets = (idx: number) => {
    if (!editing) return;
    const te = editing.exercises[idx];
    if (!Number.isFinite(te.targetSets) || te.targetSets < 1) {
      const next = [...editing.exercises];
      next[idx] = { ...te, targetSets: 1 };
      setEditing({ ...editing, exercises: next });
    }
  };

  const removeAt = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, exercises: editing.exercises.filter((_, i) => i !== idx) });
  };

  const create = () => {
    const t: WorkoutTemplate = {
      id: uid(),
      name: "New plan",
      location: "gym",
      exercises: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
      title={t("title.plans")}
      action={
        <Button size="sm" onClick={create} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("common.new")}
        </Button>
      }
    >
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("plan.empty")}
        </div>
      ) : (
        <ul className="space-y-4">
          {Object.entries(groupedTemplates).map(([location, templates]) => (
            <ul key={location} className="space-y-2">
              <h2 className="uppercase text-sm font-semibold">📍 {location}</h2>
              {templates.map((template) => (
                <li key={template.id}>
                  <button
                    onClick={() => setEditing(template)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{template.name}</p>

                      <p className="text-xs capitalize text-muted-foreground">
                        {template.location} · {template.exercises.length} {t("common.exercises")}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95%]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("plan.edit")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block text-xs">{t("common.name")}</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">{t("common.location")}</Label>
                <Select
                  value={editing.location}
                  onValueChange={(v) => setEditing({ ...editing, location: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">{t("common.exercises")}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPickerOpen(true)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("common.add")}
                  </Button>
                </div>
                <ul className="space-y-1.5">
                  {editing.exercises.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      {t("exercise.empty")}
                    </li>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={editing.exercises.map((_, i) => String(i))}
                      strategy={verticalListSortingStrategy}
                    >
                      {editing.exercises.map((te, idx) => (
                        <SortableExercise
                          key={`${te.exerciseId}-${idx}`}
                          id={String(idx)}
                          te={te}
                          idx={idx}
                          name={exMap.get(te.exerciseId)?.name ?? "?"}
                          onSetsChange={updateSets}
                          onSetsBlur={blurSets}
                          onRemove={removeAt}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between gap-2">
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={async () => {
                if (editing) {
                  await db.templates.delete(editing.id);
                  setEditing(null);
                }
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {t("common.delete")}
            </Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(exerciseId) => {
          if (!editing) return;
          const te: TemplateExercise = {
            exerciseId,
            order: editing.exercises.length,
            targetSets: 3,
          };
          setEditing({ ...editing, exercises: [...editing.exercises, te] });
        }}
        selectedExerciseIds={editing?.exercises.map((te) => te.exerciseId)}
      />
    </AppShell>
  );
}
