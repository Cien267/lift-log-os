const FILTER_KEY = "forge.historyFilter";

type HistoryFilterLocation = "gym" | "home" | "outdoor" | null;

export interface HistoryFilter {
  startDate: string | null;
  endDate: string | null;
  templateId: string | null;
  location: HistoryFilterLocation[];
}

export function defaultFilter(): HistoryFilter {
  return {
    startDate: null,
    endDate: null,
    templateId: null,
    location: [],
  };
}

export function readHistoryFilter(): HistoryFilter {
  if (typeof localStorage === "undefined") return defaultFilter();
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    return raw ? JSON.parse(raw) : defaultFilter();
  } catch {
    return defaultFilter();
  }
}

export function writeHistoryFilter(filter: HistoryFilter) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
}

export function clearHistoryFilter() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(FILTER_KEY);
}

export function isHistoryFilterEmpty(filter: HistoryFilter): boolean {
  return !filter.startDate && !filter.endDate && !filter.templateId && filter.location.length === 0;
}
