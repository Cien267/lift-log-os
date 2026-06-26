import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Exercise } from "@/lib/db";
import { Info } from "lucide-react";
import { useT } from "@/lib/i18n";

interface ExercisePreviewProps {
  exercise: Exercise;
}

export function ExercisePreview({ exercise }: ExercisePreviewProps) {
  const { t } = useT();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen(true);
        }}
        aria-label={`Preview ${exercise.name}`}
      >
        <Info className="h-4 w-4" />
      </Button>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95%]">
          <DialogHeader>
            <DialogTitle>{exercise.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <img className="rounded-md" src={exercise.guideImage} alt={exercise.name} />
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>{t("common.gotIt")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
