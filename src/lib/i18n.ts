import { useSettings } from "@/hooks/use-settings";

export type Lang = "en" | "vi";

const dict = {
  en: {
    // bottom nav
    "nav.home": "Home",
    "nav.workout": "Workout",
    "nav.history": "History",
    "nav.stats": "Stats",
    "nav.body": "Body",
    "nav.plans": "Plans",
    "nav.settings": "Settings",
    // titles
    "title.forge": "Forge",
    "title.startWorkout": "Start workout",
    "title.history": "History",
    "title.analytics": "Analytics",
    "title.body": "Body",
    "title.plans": "Plans",
    "title.settings": "Settings",
    // settings
    "settings.appearance": "Appearance",
    "settings.language": "Language",
    "settings.workout": "Workout",
    "settings.data": "Data",
    "settings.theme.dark": "Dark",
    "settings.theme.light": "Light",
    "settings.theme.auto": "Auto",
    "settings.defaultRest": "Default rest (seconds)",
    "settings.weeklyGoal": "Weekly goal (sessions)",
    "settings.export": "Export backup (.json)",
    "settings.import": "Import backup",
    "settings.deleteAll": "Delete all data",
    "settings.footer":
      "Forge stores everything locally on this device. Export regularly to keep a backup safe.",
    "settings.importedOk": "Backup imported.",
    "settings.invalidFile": "Invalid backup file.",
    "settings.confirmClear":
      "Delete ALL workouts, templates, and measurements? This cannot be undone.",
    "lang.en": "English",
    "lang.vi": "Tiếng Việt",
  },
  vi: {
    "nav.home": "Trang chủ",
    "nav.workout": "Tập luyện",
    "nav.history": "Lịch sử",
    "nav.stats": "Thống kê",
    "nav.body": "Cơ thể",
    "nav.plans": "Kế hoạch",
    "nav.settings": "Cài đặt",
    "title.forge": "Forge",
    "title.startWorkout": "Bắt đầu tập",
    "title.history": "Lịch sử",
    "title.analytics": "Phân tích",
    "title.body": "Cơ thể",
    "title.plans": "Kế hoạch",
    "title.settings": "Cài đặt",
    "settings.appearance": "Giao diện",
    "settings.language": "Ngôn ngữ",
    "settings.workout": "Tập luyện",
    "settings.data": "Dữ liệu",
    "settings.theme.dark": "Tối",
    "settings.theme.light": "Sáng",
    "settings.theme.auto": "Tự động",
    "settings.defaultRest": "Thời gian nghỉ mặc định (giây)",
    "settings.weeklyGoal": "Mục tiêu hàng tuần (buổi)",
    "settings.export": "Xuất sao lưu (.json)",
    "settings.import": "Nhập sao lưu",
    "settings.deleteAll": "Xóa toàn bộ dữ liệu",
    "settings.footer":
      "Forge lưu toàn bộ dữ liệu trên thiết bị này. Hãy xuất sao lưu thường xuyên để an toàn.",
    "settings.importedOk": "Đã nhập sao lưu.",
    "settings.invalidFile": "Tệp sao lưu không hợp lệ.",
    "settings.confirmClear":
      "Xóa TẤT CẢ buổi tập, kế hoạch và đo lường? Không thể hoàn tác.",
    "lang.en": "English",
    "lang.vi": "Tiếng Việt",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

export function useT() {
  const { settings } = useSettings();
  const lang: Lang = (settings?.language as Lang) ?? "en";
  const t = (key: TKey): string => (dict[lang] as Record<string, string>)[key] ?? dict.en[key] ?? key;
  return { t, lang };
}
