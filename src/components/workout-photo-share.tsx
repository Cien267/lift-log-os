import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Download, Share2, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import {
  DEFAULT_OPTIONS,
  FIELD_LABELS,
  buildShareStats,
  renderOverlay,
  loadImageFromFile,
  type FieldKey,
  type OverlayAspect,
  type OverlayOptions,
  type OverlayPosition,
  type OverlayTemplate,
  type ShareStats,
} from "@/lib/photo-overlay";
import { useT } from "@/lib/i18n";

const TEMPLATES: { id: OverlayTemplate; label: string }[] = [
  { id: "premium", label: "Premium" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "poster", label: "Poster" },
  { id: "story", label: "Story" },
];

const COLORS = ["#FFFFFF", "#F5E9D0", "#0B0B0D", "#F97316", "#22D3EE"];
const ASPECTS: OverlayAspect[] = ["4:5", "1:1", "9:16"];
const POSITIONS = (lang: string) => {
  return lang === "vi" ? ["trên", "giữa", "dưới"] : ["top", "center", "bottom"];
};
const SIZES: { label: string; value: number }[] = [
  { label: "S", value: 0.85 },
  { label: "M", value: 1 },
  { label: "L", value: 1.15 },
];

export function WorkoutPhotoShare({
  workoutId,
  variant = "default",
  className,
  label = "Take Photo with Stats",
}: {
  workoutId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* <Button variant={variant} className={cn("gap-2", className)} onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" /> {label}
      </Button>
      {open && <PhotoOverlayEditor workoutId={workoutId} onClose={() => setOpen(false)} />} */}
    </>
  );
}

function PhotoOverlayEditor({ workoutId, onClose }: { workoutId: string; onClose: () => void }) {
  const { settings } = useSettings();
  const { t } = useT();
  const lang = settings?.language ?? "en";
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [opts, setOpts] = useState<OverlayOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buildShareStats(workoutId, lang).then(setStats);
  }, [workoutId, lang]);

  useEffect(() => {
    if (previewRef.current && stats) renderOverlay(previewRef.current, img, stats, opts, 720);
  }, [img, stats, opts]);

  const set = <K extends keyof OverlayOptions>(k: K, v: OverlayOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const onFile = async (file?: File | null) => {
    if (!file) return;
    try {
      setImg(await loadImageFromFile(file));
    } catch {
      toast.error("Could not load that photo");
    }
  };

  const exportBlob = async () => {
    if (!stats) return null;
    const c = document.createElement("canvas");
    renderOverlay(c, img, stats, opts, 1080);
    return await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.94));
  };

  const onShare = async () => {
    setBusy(true);
    try {
      const blob = await exportBlob();
      if (!blob) return;
      const file = new File([blob], "forge-workout.jpg", { type: "image/jpeg" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: stats?.name ?? "Forge workout" });
      } else {
        download(blob);
        toast.success("Image saved — ready to post");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Sharing failed");
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    setBusy(true);
    const blob = await exportBlob();
    if (blob) {
      download(blob);
      toast.success("Saved to your device");
    }
    setBusy(false);
  };

  const previewAspect = useMemo(
    () => (opts.aspect === "1:1" ? "1 / 1" : opts.aspect === "9:16" ? "9 / 16" : "4 / 5"),
    [opts.aspect],
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[92dvh] sm:max-w-lg sm:rounded-3xl sm:border [&>button]:hidden pt-14">
        <DialogTitle className="sr-only">Workout photo overlay</DialogTitle>
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5 pt-safe">
          <Button size="icon" variant="ghost" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("photoShare.shareYourSession")}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {t("photoShare.description")}
            </p>
          </div>
          <Button size="sm" onClick={onShare} disabled={busy} className="shrink-0 gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {t("photoShare.share")}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto pb-safe">
          <div className="bg-secondary/30 px-4 py-4">
            <div
              className="mx-auto max-w-[300px] overflow-hidden rounded-2xl border border-border shadow-lg"
              style={{ aspectRatio: previewAspect }}
            >
              <canvas ref={previewRef} className="h-full w-full" />
            </div>
            <div className="mx-auto mt-3 flex max-w-[300px] gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="h-4 w-4" /> {t("photoShare.camera")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => galleryRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" /> {t("photoShare.gallery")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onDownload}
                disabled={busy}
                aria-label="Save image"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>

          <div className="space-y-5 px-4 py-4">
            <Section title={t("photoShare.template")}>
              <Chips
                items={TEMPLATES.map((t) => ({ id: t.id, label: t.label }))}
                value={opts.template}
                onChange={(v) => set("template", v as OverlayTemplate)}
              />
            </Section>

            <Section title={t("photoShare.frame")}>
              <Chips
                items={ASPECTS.map((a) => ({ id: a, label: a }))}
                value={opts.aspect}
                onChange={(v) => set("aspect", v as OverlayAspect)}
              />
            </Section>

            <Section title={t("photoShare.overlayPosition")}>
              <Chips
                items={POSITIONS(lang).map((p) => ({
                  id: p,
                  label: p[0].toUpperCase() + p.slice(1),
                }))}
                value={opts.position}
                onChange={(v) => set("position", v as OverlayPosition)}
              />
            </Section>

            <Section title={t("photoShare.text")}>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("textColor", c)}
                      aria-label={`Text color ${c}`}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-transform",
                        opts.textColor === c ? "scale-110 border-primary" : "border-border",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="ml-auto flex gap-1.5">
                  {SIZES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => set("fontScale", s.value)}
                      className={cn(
                        "h-7 w-8 rounded-lg border text-xs font-semibold",
                        opts.fontScale === s.value
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section title={t("photoShare.photo")}>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Gym Boost</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("photoShare.extraContrast")}
                    </p>
                  </div>
                </div>
                <Switch checked={opts.gymBoost} onCheckedChange={(v) => set("gymBoost", v)} />
              </div>
              <LabeledSlider
                label={t("photoShare.brightness")}
                value={opts.brightness}
                min={0.7}
                max={1.3}
                onChange={(v) => set("brightness", v)}
              />
              <LabeledSlider
                label={t("photoShare.contrast")}
                value={opts.contrast}
                min={0.7}
                max={1.4}
                onChange={(v) => set("contrast", v)}
              />
              <LabeledSlider
                label={t("photoShare.cropPosition")}
                value={opts.offset}
                min={0}
                max={1}
                onChange={(v) => set("offset", v)}
              />
            </Section>

            <Section title={t("photoShare.statsShown")}>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => set("fields", { ...opts.fields, [k]: !opts.fields[k] })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      opts.fields[k]
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {FIELD_LABELS[k]}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Chips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onChange(i.id)}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
            value === i.id
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

function LabeledSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="num">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={0.01}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-workout-${Date.now()}.jpg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
