import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, X, Plus } from "lucide-react";
import { db, uid, type Equipment, type Exercise, type MuscleGroup } from "@/lib/db";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GROUPS: ("all" | MuscleGroup)[] = [
  "all",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
];

const MUSCLE_OPTIONS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "forearms",
  "cardio",
];
const EQUIPMENT_OPTIONS: Equipment[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "pullup-bar",
  "bench",
  "other",
];

export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
  filterEquipment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (exerciseId: string) => void;
  filterEquipment?: Equipment[];
}) {
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<"all" | MuscleGroup>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    muscleGroup: MuscleGroup;
    equipment: Equipment;
    category: Exercise["category"];
  }>({
    name: "",
    muscleGroup: "chest",
    equipment: "barbell",
    category: "compound",
  });

  const filtered = useMemo(() => {
    let list = exercises;
    if (filterEquipment?.length) list = list.filter((e) => filterEquipment.includes(e.equipment));
    if (group !== "all") list = list.filter((e) => e.muscleGroup === group);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(s) || e.aliases?.some((a) => a.toLowerCase().includes(s)),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, q, group, filterEquipment]);

  const openCreate = () => {
    setDraft({
      name: q.trim(),
      muscleGroup: group === "all" ? "chest" : group,
      equipment: "barbell",
      category: "compound",
    });
    setCreateOpen(true);
  };

  const saveCustom = async () => {
    const name = draft.name.trim();
    if (!name) return;
    const ex: Exercise = {
      id: uid(),
      name,
      muscleGroup: draft.muscleGroup,
      equipment: draft.equipment,
      category: draft.category,
      custom: true,
    };
    await db.exercises.add(ex);
    setCreateOpen(false);
    onSelect(ex.id);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Add exercise</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search exercises..."
                className="pl-9"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
              {GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                    group === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-muted-foreground",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <Button onClick={openCreate} variant="outline" size="sm" className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Create new exercise{q.trim() ? ` "${q.trim()}"` : ""}
            </Button>
          </div>
          <div className="h-[calc(85vh-12.5rem)] overflow-y-auto pb-8">
            <ul className="divide-y divide-border">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => {
                      onSelect(ex.id);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-xs font-bold uppercase text-muted-foreground">
                      {ex.muscleGroup.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ex.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {ex.muscleGroup} · {ex.equipment}
                      </p>
                    </div>
                    {ex.custom && (
                      <Badge variant="secondary" className="text-[10px]">
                        Custom
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {ex.category}
                    </Badge>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No exercises found. Tap "Create new exercise" above.
                </li>
              )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Name</Label>
              <Input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Bulgarian split squat"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Muscle group</Label>
                <Select
                  value={draft.muscleGroup}
                  onValueChange={(v) => setDraft({ ...draft, muscleGroup: v as MuscleGroup })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Equipment</Label>
                <Select
                  value={draft.equipment}
                  onValueChange={(v) => setDraft({ ...draft, equipment: v as Equipment })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e} className="capitalize">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v as Exercise["category"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compound">Compound</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustom} disabled={!draft.name.trim()}>
              Create & add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
