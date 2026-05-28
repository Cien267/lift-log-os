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
    "settings.aboutMe": "About me",
    "settings.userName": "Name",
    "lang.en": "English",
    "lang.vi": "Tiếng Việt",

    // home
    "home.today": "Today",
    "home.slogan": "Train with intent.",
    "home.streak": "day streak",
    "home.thisWeek": "This week",
    "home.lastSession": "Last session",
    "home.sessions": "Sessions",
    "home.recentPRs": "Recent PRs",
    "home.viewAll": "View all",
    "home.recentActivity": "Recent activity",
    "home.finishWorkoutHint": "Finish a workout to start logging PRs.",
    "home.recentActivityHint": "Tap Start workout to begin.",

    //workout
    "workout.startFresh": "Start fresh",
    "workout.fromTemplate": "From template",
    "workout.emptyTemplate": "No templates yet. Create one in Plans.",
    "workout.discardMessage": "This will permanently delete all sets logged in this session.",
    "workout.keepTraining": "Keep training",
    "workout.complete": "Workout complete",
    "workout.insight": "Your session insight",
    "workout.unmarkWarmup": "Unmark warmup",
    "workout.markAsWarmup": "Mark as warmup",

    // history
    "history.empty": "No completed workouts yet.",
    "history.saveAsNewPlan": "Save as a new plan",
    "history.saveAsNewPlanPlaceholder": "Plan name",
    "history.sessionInsight": "Session insight",

    // analytics
    "analytics.workouts": "Workouts",
    "analytics.consistency": "Consistency",
    "analytics.weeklyVolume": "Weekly volume",
    "analytics.last12Weeks": "Last 12 weeks",
    "analytics.muscleVolume": "Muscle volume",
    "analytics.last30Days": "Last 30 days",
    "analytics.topLifts": "Top lifts",
    "analytics.e1RM": "Estimated 1RM",
    "analytics.emptyInsight": "Log a few workouts to unlock personalized insights.",
    "analytics.insightFrequencyDrop": "Training frequency dropped to",
    "analytics.insightStrongWeek": "Strong week —",
    "analytics.insightSessionCompleted": "sessions completed.",
    "analytics.insightNotTrain": "Not trained this month:",

    // body
    "body.createMeasurement": "New measurement",
    "body.editMeasurement": "Edit measurement",
    "body.deleteMeasurement": "Delete measurement",
    "body.measurements": "Body measurements",
    "body.emptyMeasurements": "No measurements logged yet.",

    // plan
    "plan.empty": "No plans yet. Build one to repeat workouts easily.",
    "plan.edit": "Edit plan",

    // exercise
    "exercise.empty": "No exercises yet.",
    "exercise.searchPlaceholder": "Search exercises...",
    "exercise.emptySearch": 'No exercises found. Tap "Create new exercise" above.',
    "exercise.muscleGroup": "Muscle group",
    "exercise.equipment": "Equipment",
    "exercise.category": "Category",
    "exercise.deleteDescription":
      "This removes the exercise from your library. Past workout history that references it is kept, but the name may no longer display correctly.",

    // common
    "common.empty": "Empty",
    "common.start": "Start",
    "common.locale": "en",
    "common.volume": "Volume",
    "common.log": "Log",
    "common.bodyWeight": "Bodyweight",
    "common.since": "since",
    "common.save": "Save",
    "common.create": "Create",
    "common.add": "Add",
    "common.update": "Update",
    "common.edit": "Edit",
    "common.createAdd": "Create & add",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.deleteMessage": "This action cannot be undone.",
    "common.new": "New",
    "common.exercises": "Exercises",
    "common.exercise": "exercise",
    "common.name": "Name",
    "common.location": "Location",
    "common.from": "from",
    "common.lastWeek": "last week",
    "common.finish": "Finish",
    "common.discard": "Discard",
    "common.gotIt": "Got it",
    "common.duplicate": "Duplicate",
    "common.remove": "Remove",
    "common.notFound": "Not found.",
    "common.comparedTo": "Compared to",
    "common.vsLast": "vs last",
    "common.duration": "Duration",
    "common.perExercise": "Per exercise",
    "common.prev": "prev",
  },
  vi: {
    // bottom nav
    "nav.home": "Home",
    "nav.workout": "Tập",
    "nav.history": "Lịch sử",
    "nav.stats": "Thống kê",
    "nav.body": "Cơ thể",
    "nav.plans": "Kế hoạch",
    "nav.settings": "Cài đặt",

    // titles
    "title.forge": "Forge",
    "title.startWorkout": "Bắt đầu luyện tập",
    "title.history": "Lịch sử",
    "title.analytics": "Phân tích",
    "title.body": "Cơ thể",
    "title.plans": "Kế hoạch",
    "title.settings": "Cài đặt",

    // settings
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
    "settings.confirmClear": "Xóa TẤT CẢ buổi tập, kế hoạch và đo lường? Không thể hoàn tác.",
    "settings.aboutMe": "Thông tin cá nhân",
    "settings.userName": "Tên",
    "lang.en": "English",
    "lang.vi": "Tiếng Việt",

    // home
    "home.today": "Hôm nay",
    "home.slogan": "Luyện tập.",
    "home.streak": "chuỗi ngày",
    "home.thisWeek": "Tuần này",
    "home.lastSession": "Buổi trước",
    "home.sessions": "Buổi tập",
    "home.recentPRs": "PR gần đây",
    "home.viewAll": "Xem tất cả",
    "home.recentActivity": "Hoạt động gần đây",
    "home.finishWorkoutHint": "Hoàn thành buổi tập để bắt đầu ghi lại PR.",
    "home.recentActivityHint": "Nhấn Bắt đầu buổi tập.",

    // workout
    "workout.startFresh": "Bắt đầu hoàn toàn mới",
    "workout.fromTemplate": "Chọn từ mẫu",
    "workout.emptyTemplate": "Chưa có mẫu nào. Tạo trong Kế hoạch.",
    "workout.discardMessage":
      "Hành động này sẽ xóa vĩnh viễn tất cả các set đã ghi lại trong phiên tập này.",
    "workout.keepTraining": "Tiếp tục tập luyện",
    "workout.complete": "Hoàn thành buổi tập",
    "workout.insight": "Thông tin chi tiết buổi tập của bạn",
    "workout.unmarkWarmup": "Bỏ đánh dấu khởi động",
    "workout.markAsWarmup": "Đánh dấu là khởi động",

    // history
    "history.empty": "Chưa có buổi tập nào được hoàn thành.",
    "history.saveAsNewPlan": "Lưu thành kế hoạch mới",
    "history.saveAsNewPlanPlaceholder": "Tên kế hoạch",
    "history.sessionInsight": "Thông tin chi tiết buổi tập",

    // analytics
    "analytics.empty": "Chưa có dữ liệu phân tích.",
    "analytics.workouts": "Buổi tập",
    "analytics.consistency": "Độ nhất quán",
    "analytics.weeklyVolume": "Khối lượng hàng tuần",
    "analytics.last12Weeks": "12 tuần qua",
    "analytics.muscleVolume": "Khối lượng theo nhóm cơ",
    "analytics.last30Days": "30 ngày qua",
    "analytics.topLifts": "Các bài tập hàng đầu",
    "analytics.e1RM": "1RM ước tính",
    "analytics.emptyInsight":
      "Ghi lại một vài buổi tập để mở khóa các thông tin chi tiết cá nhân hóa.",
    "analytics.insightFrequencyDrop": "Tần suất tập luyện giảm xuống",
    "analytics.insightStrongWeek": "Tuần tập năng suất —",
    "analytics.insightSessionCompleted": "buổi tập đã hoàn thành.",
    "analytics.insightNotTrain": "Chưa tập luyện trong tháng này:",

    // body
    "body.createMeasurement": "Ghi lại số đo mới",
    "body.editMeasurement": "Chỉnh sửa số đo",
    "body.deleteMeasurement": "Xóa số đo",
    "body.measurements": "Các số đo cơ thể",
    "body.emptyMeasurements": "Chưa có số đo nào được ghi lại.",

    // plan
    "plan.empty": "Chưa có kế hoạch nào. Tạo một kế hoạch để lặp lại các buổi tập dễ dàng.",
    "plan.edit": "Chỉnh sửa kế hoạch",

    // exercise
    "exercise.empty": "Chưa có bài tập nào.",
    "exercise.searchPlaceholder": "Tìm kiếm bài tập...",
    "exercise.emptySearch": 'Không tìm thấy bài tập nào. Nhấn "Tạo Bài tập" ở trên.',
    "exercise.muscleGroup": "Nhóm cơ",
    "exercise.equipment": "Thiết bị",
    "exercise.category": "Thể loại",
    "exercise.deleteDescription":
      "Điều này sẽ xóa bài tập khỏi thư viện của bạn. Lịch sử tập luyện trước đó tham chiếu đến nó sẽ được giữ lại, nhưng tên có thể không còn hiển thị chính xác.",

    // common
    "common.empty": "Trống",
    "common.start": "Bắt đầu",
    "common.locale": "vi",
    "common.volume": "Khối lượng",
    "common.log": "Ghi lại",
    "common.bodyWeight": "Cân nặng",
    "common.since": "kể từ",
    "common.save": "Lưu",
    "common.create": "Tạo",
    "common.add": "Thêm",
    "common.edit": "Chỉnh sửa",
    "common.update": "Cập nhật",
    "common.createAdd": "Tạo & thêm",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.deleteMessage": "Hành động này không thể hoàn tác.",
    "common.new": "Thêm mới",
    "common.exercises": "Bài tập",
    "common.exercise": "bài tập",
    "common.name": "Tên",
    "common.location": "Địa điểm",
    "common.from": "từ",
    "common.lastWeek": "tuần trước",
    "common.finish": "Hoàn thành",
    "common.discard": "Bỏ qua",
    "common.gotIt": "Đã hiểu",
    "common.duplicate": "Nhân đôi",
    "common.remove": "Xóa",
    "common.notFound": "Không tìm thấy.",
    "common.comparedTo": "So với",
    "common.vsLast": "so với trước",
    "common.duration": "Thời lượng",
    "common.perExercise": "Theo từng bài tập",
    "common.prev": "trước",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

export function useT() {
  const { settings } = useSettings();
  const lang: Lang = (settings?.language as Lang) ?? "en";
  const t = (key: TKey): string =>
    (dict[lang] as Record<string, string>)[key] ?? dict.en[key] ?? key;
  return { t, lang };
}
