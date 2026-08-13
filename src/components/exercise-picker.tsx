import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, X, Plus, Pencil, Trash2, Camera, ImageIcon } from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { motion } from "framer-motion";
import { ExercisePreview } from "./exercise-preview";

const GROUPS: ("all" | MuscleGroup)[] = [
  "all",
  "cardio",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
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
  "adductors",
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

type Draft = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  category: Exercise["category"];
  guideImage?: string;
};

const emptyDraft: Draft = {
  name: "",
  muscleGroup: "chest",
  equipment: "barbell",
  category: "compound",
  guideImage: undefined,
};

const MAX_IMAGE_DIM = 1280;
const IMAGE_QUALITY = 0.82;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Image decode failed"));
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
}

export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
  filterEquipment,
  selectedExerciseIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (exerciseId: string) => void;
  filterEquipment?: Equipment[];
  selectedExerciseIds?: string[];
}) {
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const { t, lang } = useT();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<"all" | MuscleGroup>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<Exercise | null>(null);
  const [effects, setEffects] = useState<any[]>([]);
  const [numberAnimating, setNumberAnimating] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      name: q.trim(),
      muscleGroup: group === "all" ? "chest" : group,
    });
    setEditorOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setDraft({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      category: ex.category,
      guideImage: ex.guideImage,
    });
    setEditorOpen(true);
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setDraft((d) => ({ ...d, guideImage: dataUrl }));
    } catch {
      toast.error("Could not load image");
    }
  };

  const saveExercise = async () => {
    const name = draft.name.trim();
    if (!name) return;
    if (editingId) {
      await db.exercises.update(editingId, {
        name,
        muscleGroup: draft.muscleGroup,
        equipment: draft.equipment,
        category: draft.category,
        guideImage: draft.guideImage,
      });
      setEditorOpen(false);
      toast.success("Exercise updated");
    } else {
      const ex: Exercise = {
        id: uid(),
        name,
        muscleGroup: draft.muscleGroup,
        equipment: draft.equipment,
        category: draft.category,
        guideImage: draft.guideImage,
        custom: true,
      };
      await db.exercises.add(ex);
      setEditorOpen(false);
      onSelect(ex.id);
    }
  };

  const deleteExercise = async (ex: Exercise) => {
    await db.exercises.delete(ex.id);
    setConfirmDelete(null);
    toast.success(`Deleted "${ex.name}"`);
  };

  const handleAnimation = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const id = Date.now();

    setEffects((prev) => [
      ...prev,
      {
        id,
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    ]);

    setTimeout(() => {
      setEffects((prev) => prev.filter((item) => item.id !== id));
    }, 1000);

    triggerNumberAnimation();
  };

  const triggerNumberAnimation = () => {
    setNumberAnimating(true);

    setTimeout(() => {
      setNumberAnimating(false);
    }, 1000);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>
              {t("common.add")} {t("common.exercise")}
              {(selectedExerciseIds?.length || 0) > 0 && (
                <div className="text-sm font-normal text-muted-foreground mt-2">
                  <span
                    className={cn(
                      "font-extrabold inline-block",
                      numberAnimating && "animate-bounce text-primary transition-all",
                    )}
                  >
                    {selectedExerciseIds?.length}
                  </span>{" "}
                  {t("exercise.selected")}
                </div>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("exercise.searchPlaceholder")}
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
              <Plus className="h-4 w-4" /> {t("common.create")} {t("common.exercise")}
              {q.trim() ? ` "${q.trim()}"` : ""}
            </Button>
          </div>
          <div className="h-[calc(85vh-12.5rem)] overflow-y-auto pb-8">
            <ul className="divide-y divide-border">
              {filtered.map((ex) => (
                <li key={ex.id} className="flex items-center gap-1 pr-2 hover:bg-surface">
                  <button
                    onClick={(e) => {
                      handleAnimation(e);
                      onSelect(ex.id);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                  >
                    {ex.guideImage ? (
                      <img
                        src={ex.guideImage}
                        alt={ex.muscleGroup}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-xs font-bold uppercase text-muted-foreground">
                        {ex.muscleGroup.slice(0, 2)}
                      </div>
                    )}
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
                  {effects.map((effect) => (
                    <motion.div
                      key={`${effect.x}-${effect.y}`}
                      initial={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      animate={{
                        opacity: 0,
                        y: -60,
                        scale: 1.3,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                      }}
                      className="fixed text-xl font-bold text-primary pointer-events-none"
                      style={{
                        left: effect.x,
                        top: effect.y,
                      }}
                    >
                      +1
                    </motion.div>
                  ))}
                  {ex.guideImage && <ExercisePreview exercise={ex} />}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(ex);
                    }}
                    aria-label={`Edit ${ex.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(ex);
                    }}
                    aria-label={`Delete ${ex.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("exercise.emptySearch")}
                </li>
              )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("common.edit") : t("common.new")} {t("common.exercise")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">{t("common.name")}</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={`${lang === "vi" ? "Ví dụ: Đẩy ngực ghế dốc" : "e.g. Bulgarian split squat"}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">{t("exercise.muscleGroup")}</Label>
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
                <Label className="mb-1 block text-xs">{t("exercise.equipment")}</Label>
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
              <Label className="mb-1 block text-xs">{t("exercise.category")}</Label>
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
            <div>
              <Label className="mb-1 block text-xs">{t("exercise.guideImage")}</Label>
              {draft.guideImage ? (
                <div className="relative overflow-hidden rounded-md border border-border">
                  <img
                    src={draft.guideImage}
                    alt="Guide"
                    className="max-h-48 w-full object-contain bg-secondary"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setDraft({ ...draft, guideImage: undefined })}
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" /> {t("photoShare.camera")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" /> {t("photoShare.gallery")}
                  </Button>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleImageFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveExercise} disabled={!draft.name.trim()}>
              {editingId ? t("common.save") : t("common.createAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent className="w-[95%]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.delete")} "{confirmDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>{t("exercise.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteExercise(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
