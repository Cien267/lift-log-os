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
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  writeHistoryFilter,
  isHistoryFilterEmpty,
  clearHistoryFilter,
  defaultFilter,
  type IHistoryFilter,
} from "@/lib/history-filter";
import { Label } from "./ui/label";
import { cn, parseDateString } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export function HistoryFilter({
  filters,
  setFilters,
}: {
  filters: IHistoryFilter;
  setFilters: React.Dispatch<React.SetStateAction<IHistoryFilter>>;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useT();
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
            <ActionButtons setFilters={setFilters} onClose={() => setOpen(false)} />
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
  filters: IHistoryFilter;
  setFilters: React.Dispatch<React.SetStateAction<IHistoryFilter>>;
}) {
  const { t } = useT();
  const rawTemplates = useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray());
  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-3 block text-xs">{t("common.date")}</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal bg-card border-border",
                  !filters.startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate
                  ? format(parseISO(filters.startDate), "PP")
                  : t("common.fromDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDateString(filters.startDate)}
                onSelect={(date) => {
                  const dateStr = date ? format(date, "yyyy-MM-dd") : null;

                  let newEndDate = filters.endDate;
                  if (dateStr && newEndDate && dateStr > newEndDate) {
                    newEndDate = null;
                  }

                  const newFilter = { ...filters, startDate: dateStr, endDate: newEndDate };
                  setFilters(newFilter);
                  writeHistoryFilter(newFilter);
                }}
                disabled={(date) => {
                  if (!filters.endDate) return false;
                  return date > parseISO(filters.endDate);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal bg-card border-border",
                  !filters.endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(parseISO(filters.endDate), "PP") : t("common.toDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDateString(filters.endDate)}
                onSelect={(date) => {
                  const dateStr = date ? format(date, "yyyy-MM-dd") : null;
                  const newFilter = { ...filters, endDate: dateStr };
                  setFilters(newFilter);
                  writeHistoryFilter(newFilter);
                }}
                disabled={(date) => {
                  if (!filters.startDate) return false;
                  return date < parseISO(filters.startDate);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
  onClose,
}: {
  setFilters: React.Dispatch<React.SetStateAction<IHistoryFilter>>;
  onClose: () => void;
}) {
  const { t } = useT();

  const handleRefreshHistoryFilter = () => {
    clearHistoryFilter();
    setFilters(defaultFilter());
    onClose();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Button className="w-full" variant="outline" size="lg" onClick={handleRefreshHistoryFilter}>
        {t("common.refresh")}
      </Button>
      <Button className="w-full" size="lg" onClick={onClose}>
        {t("common.filter")}
      </Button>
    </div>
  );
}
