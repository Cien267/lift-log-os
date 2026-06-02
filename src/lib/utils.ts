import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date?: Date | string, language: "en" | "vi" = "en") => {
  if (!date) return "-";

  const locale = language === "vi" ? vi : enUS;
  const pattern = language === "vi" ? "EEE, dd/MM/yyyy" : "EEE, MM/dd/yyyy";

  return format(new Date(date), pattern, { locale });
};
