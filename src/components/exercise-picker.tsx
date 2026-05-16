import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, X } from "lucide-react";
import { db, type Equipment, type MuscleGroup } from "@/lib/db";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GROUPS: ("all" | MuscleGroup)[] = [
  "all", "chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core",
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

  const filtered = useMemo(() => {
    let list = exercises;
    if (filterEquipment?.length) list = list.filter((e) => filterEquipment.includes(e.equipment));
    if (group !== "all") list = list.filter((e) => e.muscleGroup === group);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(s) || e.aliases?.some((a) => a.toLowerCase().includes(s)));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, q, group, filterEquipment]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>Add exercise</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises..." className="pl-9" autoFocus />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground">
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
                    : "border-border bg-secondary text-muted-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[calc(85vh-9.5rem)] overflow-y-auto pb-8">
          <ul className="divide-y divide-border">
            {filtered.map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => { onSelect(ex.id); onOpenChange(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-xs font-bold uppercase text-muted-foreground">
                    {ex.muscleGroup.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ex.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{ex.muscleGroup} · {ex.equipment}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{ex.category}</Badge>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No exercises found.</li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
