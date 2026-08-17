import { useEffect, useState } from "react";
import { db, type Settings } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

let seeded = false;
const EXPORT_KEY = "forge.exportDate";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!seeded) {
        seeded = true;
        await seedDatabase();
      }
      const s = await db.settings.get("app");
      if (!cancelled) setSettings(s ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const apply = (theme: Settings["theme"]) => {
      const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("light", !isDark);
      root.classList.toggle("dark", isDark);
    };
    apply(settings.theme);
  }, [settings?.theme]);

  const update = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    await db.settings.put(next);
    setSettings(next);
  };

  const getLastExportDate = () =>
    typeof localStorage !== "undefined" ? localStorage.getItem(EXPORT_KEY) : null;

  const setLastExportDate = (date: Date | null) => {
    if (typeof localStorage !== "undefined") {
      if (date) {
        localStorage.setItem(EXPORT_KEY, date.toISOString());
      } else {
        localStorage.removeItem(EXPORT_KEY);
      }
    }
  };

  return { settings, update, getLastExportDate, setLastExportDate };
}
