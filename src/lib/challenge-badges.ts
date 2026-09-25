// src/lib/badges.ts

export type BadgeCategory = "lifetime" | "consistency" | "progress" | "variety" | "special";

export type BadgeStatus = "active" | "coming_soon";

export type BadgeMetric =
  | "workouts"
  | "streak_days"
  | "personal_records"
  | "active_days"
  | "cardio_minutes"
  | "locations"
  | "early_workouts"
  | "night_workouts";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface BadgeDefinition {
  id: string;

  category: BadgeCategory;

  status: BadgeStatus;

  /**
   * Badge shown to users.
   */
  name: {
    en: string;
    vi: string;
  };

  description: {
    en: string;
    vi: string;
  };

  /**
   * Short text used on cards / profile.
   */
  shortDescription: {
    en: string;
    vi: string;
  };

  /**
   * Icon identifier.
   * Keep this as a string so the definition file
   * does not depend directly on Lucide/UI components.
   */
  icon: string;

  /**
   * The metric used to calculate progress.
   */
  metric: BadgeMetric;

  /**
   * Target required to unlock this badge.
   */
  target: number;

  /**
   * Optional tier.
   */
  tier?: BadgeTier;

  /**
   * Whether this badge can be earned only once.
   *
   * false = milestone badge can have multiple tiers
   * true  = one-time achievement
   */
  oneTime: boolean;

  /**
   * Optional family.
   *
   * Example:
   * workout-100 belongs to workout-milestones.
   */
  family?: string;

  /**
   * Optional display order.
   */
  order: number;
}

export const BADGES: BadgeDefinition[] = [
  // ============================================================
  // LIFETIME — WORKOUT MILESTONES
  // ============================================================

  {
    id: "workouts-10",
    category: "lifetime",
    status: "active",
    name: {
      en: "10 Workouts",
      vi: "10 Buổi Tập",
    },
    description: {
      en: "Complete 10 workouts.",
      vi: "Hoàn thành 10 buổi tập.",
    },
    shortDescription: {
      en: "10 workouts completed",
      vi: "Đã hoàn thành 10 buổi tập",
    },
    icon: "dumbbell",
    metric: "workouts",
    target: 10,
    tier: "bronze",
    oneTime: true,
    family: "workout-milestones",
    order: 10,
  },

  {
    id: "workouts-25",
    category: "lifetime",
    status: "active",
    name: {
      en: "25 Workouts",
      vi: "25 Buổi Tập",
    },
    description: {
      en: "Complete 25 workouts.",
      vi: "Hoàn thành 25 buổi tập.",
    },
    shortDescription: {
      en: "25 workouts completed",
      vi: "Đã hoàn thành 25 buổi tập",
    },
    icon: "dumbbell",
    metric: "workouts",
    target: 25,
    tier: "silver",
    oneTime: true,
    family: "workout-milestones",
    order: 20,
  },

  {
    id: "workouts-50",
    category: "lifetime",
    status: "active",
    name: {
      en: "50 Workouts",
      vi: "50 Buổi Tập",
    },
    description: {
      en: "Complete 50 workouts.",
      vi: "Hoàn thành 50 buổi tập.",
    },
    shortDescription: {
      en: "50 workouts completed",
      vi: "Đã hoàn thành 50 buổi tập",
    },
    icon: "dumbbell",
    metric: "workouts",
    target: 50,
    tier: "gold",
    oneTime: true,
    family: "workout-milestones",
    order: 30,
  },

  {
    id: "workouts-100",
    category: "lifetime",
    status: "active",
    name: {
      en: "100 Workouts",
      vi: "100 Buổi Tập",
    },
    description: {
      en: "Complete 100 workouts.",
      vi: "Hoàn thành 100 buổi tập.",
    },
    shortDescription: {
      en: "100 workouts completed",
      vi: "Đã hoàn thành 100 buổi tập",
    },
    icon: "trophy",
    metric: "workouts",
    target: 100,
    tier: "platinum",
    oneTime: true,
    family: "workout-milestones",
    order: 40,
  },

  {
    id: "workouts-250",
    category: "lifetime",
    status: "coming_soon",
    name: {
      en: "250 Workouts",
      vi: "250 Buổi Tập",
    },
    description: {
      en: "Complete 250 workouts.",
      vi: "Hoàn thành 250 buổi tập.",
    },
    shortDescription: {
      en: "250 workouts completed",
      vi: "Đã hoàn thành 250 buổi tập",
    },
    icon: "trophy",
    metric: "workouts",
    target: 250,
    tier: "diamond",
    oneTime: true,
    family: "workout-milestones",
    order: 50,
  },

  {
    id: "workouts-500",
    category: "lifetime",
    status: "coming_soon",
    name: {
      en: "500 Workouts",
      vi: "500 Buổi Tập",
    },
    description: {
      en: "Complete 500 workouts.",
      vi: "Hoàn thành 500 buổi tập.",
    },
    shortDescription: {
      en: "500 workouts completed",
      vi: "Đã hoàn thành 500 buổi tập",
    },
    icon: "trophy",
    metric: "workouts",
    target: 500,
    tier: "diamond",
    oneTime: true,
    family: "workout-milestones",
    order: 60,
  },

  {
    id: "workouts-1000",
    category: "lifetime",
    status: "coming_soon",
    name: {
      en: "1000 Workouts",
      vi: "1000 Buổi Tập",
    },
    description: {
      en: "Complete 1000 workouts.",
      vi: "Hoàn thành 1000 buổi tập.",
    },
    shortDescription: {
      en: "1000 workouts completed",
      vi: "Đã hoàn thành 1000 buổi tập",
    },
    icon: "crown",
    metric: "workouts",
    target: 1000,
    tier: "diamond",
    oneTime: true,
    family: "workout-milestones",
    order: 70,
  },

  // ============================================================
  // CONSISTENCY
  // ============================================================

  {
    id: "streak-6",
    category: "consistency",
    status: "active",
    name: {
      en: "6-Day Streak",
      vi: "Chuỗi 6 Ngày",
    },
    description: {
      en: "Stay active for 6 consecutive days.",
      vi: "Duy trì hoạt động trong 6 ngày liên tiếp.",
    },
    shortDescription: {
      en: "6 consecutive active days",
      vi: "6 ngày liên tiếp có hoạt động",
    },
    icon: "flame",
    metric: "streak_days",
    target: 6,
    tier: "gold",
    oneTime: true,
    family: "streak",
    order: 100,
  },

  {
    id: "streak-14",
    category: "consistency",
    status: "coming_soon",
    name: {
      en: "14-Day Streak",
      vi: "Chuỗi 14 Ngày",
    },
    description: {
      en: "Stay active for 14 consecutive days.",
      vi: "Duy trì hoạt động trong 14 ngày liên tiếp.",
    },
    shortDescription: {
      en: "14 consecutive active days",
      vi: "14 ngày liên tiếp có hoạt động",
    },
    icon: "flame",
    metric: "streak_days",
    target: 14,
    tier: "platinum",
    oneTime: true,
    family: "streak",
    order: 110,
  },

  {
    id: "streak-30",
    category: "consistency",
    status: "coming_soon",
    name: {
      en: "30-Day Streak",
      vi: "Chuỗi 30 Ngày",
    },
    description: {
      en: "Stay active for 30 consecutive days.",
      vi: "Duy trì hoạt động trong 30 ngày liên tiếp.",
    },
    shortDescription: {
      en: "30 consecutive active days",
      vi: "30 ngày liên tiếp có hoạt động",
    },
    icon: "flame",
    metric: "streak_days",
    target: 30,
    tier: "diamond",
    oneTime: true,
    family: "streak",
    order: 120,
  },

  // ============================================================
  // PROGRESS — PERSONAL RECORDS
  // ============================================================

  {
    id: "prs-5",
    category: "progress",
    status: "active",
    name: {
      en: "PR Hunter",
      vi: "Thợ Săn PR",
    },
    description: {
      en: "Set 5 personal records.",
      vi: "Thiết lập 5 kỷ lục cá nhân.",
    },
    shortDescription: {
      en: "5 personal records",
      vi: "5 kỷ lục cá nhân",
    },
    icon: "trending-up",
    metric: "personal_records",
    target: 5,
    tier: "bronze",
    oneTime: true,
    family: "personal-records",
    order: 200,
  },

  {
    id: "prs-10",
    category: "progress",
    status: "active",
    name: {
      en: "PR Hunter II",
      vi: "Thợ Săn PR II",
    },
    description: {
      en: "Set 10 personal records.",
      vi: "Thiết lập 10 kỷ lục cá nhân.",
    },
    shortDescription: {
      en: "10 personal records",
      vi: "10 kỷ lục cá nhân",
    },
    icon: "trending-up",
    metric: "personal_records",
    target: 10,
    tier: "silver",
    oneTime: true,
    family: "personal-records",
    order: 210,
  },

  {
    id: "prs-25",
    category: "progress",
    status: "coming_soon",
    name: {
      en: "PR Hunter III",
      vi: "Thợ Săn PR III",
    },
    description: {
      en: "Set 25 personal records.",
      vi: "Thiết lập 25 kỷ lục cá nhân.",
    },
    shortDescription: {
      en: "25 personal records",
      vi: "25 kỷ lục cá nhân",
    },
    icon: "trending-up",
    metric: "personal_records",
    target: 25,
    tier: "gold",
    oneTime: true,
    family: "personal-records",
    order: 220,
  },

  {
    id: "prs-50",
    category: "progress",
    status: "coming_soon",
    name: {
      en: "PR Hunter IV",
      vi: "Thợ Săn PR IV",
    },
    description: {
      en: "Set 50 personal records.",
      vi: "Thiết lập 50 kỷ lục cá nhân.",
    },
    shortDescription: {
      en: "50 personal records",
      vi: "50 kỷ lục cá nhân",
    },
    icon: "medal",
    metric: "personal_records",
    target: 50,
    tier: "platinum",
    oneTime: true,
    family: "personal-records",
    order: 230,
  },

  // ============================================================
  // VARIETY
  // ============================================================

  {
    id: "train-anywhere",
    category: "variety",
    status: "coming_soon",
    name: {
      en: "Train Anywhere",
      vi: "Tập Ở Mọi Nơi",
    },
    description: {
      en: "Complete workouts at the gym, at home, and outdoors.",
      vi: "Hoàn thành buổi tập ở phòng gym, tại nhà và ngoài trời.",
    },
    shortDescription: {
      en: "Train in 3 different locations",
      vi: "Tập luyện ở 3 địa điểm khác nhau",
    },
    icon: "map-pin",
    metric: "locations",
    target: 3,
    oneTime: true,
    family: "locations",
    order: 300,
  },

  // ============================================================
  // SPECIAL
  // ============================================================

  {
    id: "early-bird",
    category: "special",
    status: "coming_soon",
    name: {
      en: "Early Bird",
      vi: "Early Bird",
    },
    description: {
      en: "Complete 10 workouts before 8:00 AM.",
      vi: "Hoàn thành 10 buổi tập trước 8:00 sáng.",
    },
    shortDescription: {
      en: "10 early workouts",
      vi: "10 buổi tập buổi sáng sớm",
    },
    icon: "sunrise",
    metric: "early_workouts",
    target: 10,
    oneTime: true,
    family: "time-of-day",
    order: 400,
  },

  {
    id: "night-owl",
    category: "special",
    status: "coming_soon",
    name: {
      en: "Night Owl",
      vi: "Night Owl",
    },
    description: {
      en: "Complete 10 workouts after 8:00 PM.",
      vi: "Hoàn thành 10 buổi tập sau 8:00 tối.",
    },
    shortDescription: {
      en: "10 late workouts",
      vi: "10 buổi tập buổi tối",
    },
    icon: "moon",
    metric: "night_workouts",
    target: 10,
    oneTime: true,
    family: "time-of-day",
    order: 410,
  },

  // ============================================================
  // CARDIO
  // ============================================================

  {
    id: "cardio-60",
    category: "progress",
    status: "active",
    name: {
      en: "60 Cardio Minutes",
      vi: "60 Phút Cardio",
    },
    description: {
      en: "Complete 60 minutes of cardio.",
      vi: "Hoàn thành 60 phút cardio.",
    },
    shortDescription: {
      en: "60 cardio minutes",
      vi: "60 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 60,
    tier: "bronze",
    oneTime: true,
    family: "cardio-minutes",
    order: 500,
  },

  {
    id: "cardio-300",
    category: "progress",
    status: "active",
    name: {
      en: "300 Cardio Minutes",
      vi: "300 Phút Cardio",
    },
    description: {
      en: "Complete 300 minutes of cardio.",
      vi: "Hoàn thành 300 phút cardio.",
    },
    shortDescription: {
      en: "300 cardio minutes",
      vi: "300 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 300,
    tier: "silver",
    oneTime: true,
    family: "cardio-minutes",
    order: 510,
  },

  {
    id: "cardio-1000",
    category: "progress",
    status: "active",
    name: {
      en: "1,000 Cardio Minutes",
      vi: "1.000 Phút Cardio",
    },
    description: {
      en: "Complete 1,000 minutes of cardio.",
      vi: "Hoàn thành 1.000 phút cardio.",
    },
    shortDescription: {
      en: "1,000 cardio minutes",
      vi: "1.000 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 1000,
    tier: "gold",
    oneTime: true,
    family: "cardio-minutes",
    order: 520,
  },

  {
    id: "cardio-2500",
    category: "progress",
    status: "active",
    name: {
      en: "2,500 Cardio Minutes",
      vi: "2.500 Phút Cardio",
    },
    description: {
      en: "Complete 2,500 minutes of cardio.",
      vi: "Hoàn thành 2.500 phút cardio.",
    },
    shortDescription: {
      en: "2,500 cardio minutes",
      vi: "2.500 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 2500,
    tier: "platinum",
    oneTime: true,
    family: "cardio-minutes",
    order: 530,
  },

  {
    id: "cardio-5000",
    category: "progress",
    status: "active",
    name: {
      en: "5,000 Cardio Minutes",
      vi: "5.000 Phút Cardio",
    },
    description: {
      en: "Complete 5,000 minutes of cardio.",
      vi: "Hoàn thành 5.000 phút cardio.",
    },
    shortDescription: {
      en: "5,000 cardio minutes",
      vi: "5.000 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 5000,
    tier: "diamond",
    oneTime: true,
    family: "cardio-minutes",
    order: 540,
  },

  {
    id: "cardio-10000",
    category: "progress",
    status: "coming_soon",
    name: {
      en: "10,000 Cardio Minutes",
      vi: "10.000 Phút Cardio",
    },
    description: {
      en: "Complete 10,000 minutes of cardio.",
      vi: "Hoàn thành 10.000 phút cardio.",
    },
    shortDescription: {
      en: "10,000 cardio minutes",
      vi: "10.000 phút cardio",
    },
    icon: "heart-pulse",
    metric: "cardio_minutes",
    target: 10000,
    tier: "diamond",
    oneTime: true,
    family: "cardio-minutes",
    order: 550,
  },
];
