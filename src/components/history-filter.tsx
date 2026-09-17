import { useMemo, useState } from "react";
import { Funnel } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  readHistoryFilter,
  writeHistoryFilter,
  isHistoryFilterEmpty,
  clearHistoryFilter,
  defaultFilter,
  type HistoryFilter,
} from "@/lib/history-filter";
import { Label } from "./ui/label";

export function HistoryFilter() {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const [filters, setFilters] = useState<HistoryFilter>(() => readHistoryFilter());
  const isEmpty = useMemo(() => isHistoryFilterEmpty(filters), [filters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative grid h-6 w-6 place-items-center text-foreground/80 transition-colors hover:bg-surface"
          aria-label="History Filters"
        >
          <Funnel className={`h-4 w-4 ${!isEmpty ? "text-primary" : ""}`} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex min-h-screen p-0 pt-14 w-full flex-col [&>button]:top-18.5 [&>button]:right-4 [&>button]:translate-y-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
          <SheetTitle className="text-base">{t("title.historyFilters")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 flex flex-col px-3 py-3">
          <div className="flex-1 overflow-y-auto">
            <Filters filters={filters} setFilters={setFilters} />
          </div>
          <div className="shrink-0 pb-8">
            <ActionButtons setFilters={setFilters} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Filters({
  filters,
  setFilters,
}: {
  filters: HistoryFilter;
  setFilters: React.Dispatch<React.SetStateAction<HistoryFilter>>;
}) {
  const { t } = useT();
  const rawTemplates = useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray());
  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-3 block text-xs">{t("common.date")}</Label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => {
              const newFilter = { ...filters, startDate: e.target.value || null };
              setFilters(newFilter);
              writeHistoryFilter(newFilter);
            }}
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => {
              const newFilter = { ...filters, endDate: e.target.value || null };
              setFilters(newFilter);
              writeHistoryFilter(newFilter);
            }}
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
      <div>
        <Label className="mb-3 block text-xs">{t("photoShare.template")}</Label>
        <Select
          value={filters.templateId ?? ""}
          onValueChange={(v) => {
            const newFilter = { ...filters, templateId: v || null };
            setFilters(newFilter);
            writeHistoryFilter(newFilter);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} ({template.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-3 block text-xs">{t("common.location")}</Label>
        <div className="flex gap-2">
          {["gym", "home", "outdoor"].map((loc) => (
            <Button
              variant={filters.location.includes(loc as any) ? "default" : "outline"}
              size="sm"
              key={loc}
              onClick={() => {
                const newLocations = filters.location.includes(loc as any)
                  ? filters.location.filter((l) => l !== loc)
                  : [...filters.location, loc as any];
                const newFilter = { ...filters, location: newLocations };
                setFilters(newFilter);
                writeHistoryFilter(newFilter);
              }}
            >
              {loc}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButtons({
  setFilters,
}: {
  setFilters: React.Dispatch<React.SetStateAction<HistoryFilter>>;
}) {
  const { t } = useT();

  const handleRefreshHistoryFilter = () => {
    clearHistoryFilter();
    setFilters(defaultFilter());
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Button className="w-full" variant="outline" size="lg" onClick={handleRefreshHistoryFilter}>
        {t("common.refresh")}
      </Button>
      <Button className="w-full" size="lg">
        {t("common.filter")}
      </Button>
    </div>
  );
}
