import { db, type Exercise, type Settings } from "./db";

const EXERCISES: Exercise[] = [
  // Chest
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipment: "barbell",
    category: "compound",
    substituteIds: ["db-bench", "machine-chest-press"],
    guideImage: "/images/exercises/bench-press.jpg",
  },
  {
    id: "db-bench",
    name: "Dumbbell Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipment: "dumbbell",
    category: "compound",
    substituteIds: ["bench-press"],
    guideImage: "/images/exercises/dumbbell-bench-press.jpg",
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "chest",
    secondaryMuscles: ["shoulders"],
    equipment: "dumbbell",
    category: "compound",
    guideImage: "/images/exercises/incline-dumbbell-press.jpg",
  },
  {
    id: "machine-chest-press",
    name: "Machine Chest Press",
    muscleGroup: "chest",
    equipment: "machine",
    category: "compound",
    substituteIds: ["bench-press"],
    guideImage: "/images/exercises/machine-chest-press.jpg",
  },
  {
    id: "pushup",
    name: "Push-up",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "core"],
    equipment: "bodyweight",
    category: "compound",
    guideImage: "/images/exercises/push-up.jpg",
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    muscleGroup: "chest",
    equipment: "cable",
    category: "isolation",
    guideImage: "/images/exercises/cable-fly.jpg",
  },
  // Back
  {
    id: "pullup",
    name: "Pull-up",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "pullup-bar",
    category: "compound",
    guideImage: "/images/exercises/pull-up.jpg",
  },
  {
    id: "chinup",
    name: "Chin-up",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "pullup-bar",
    category: "compound",
    guideImage: "/images/exercises/chin-up.jpg",
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-row.jpg",
  },
  {
    id: "db-row",
    name: "Dumbbell Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "dumbbell",
    category: "compound",
    guideImage: "/images/exercises/dumbbell-row.jpg",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "back",
    secondaryMuscles: ["biceps"],
    equipment: "cable",
    category: "compound",
    guideImage: "/images/exercises/lat-pulldown.jpg",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    muscleGroup: "back",
    secondaryMuscles: ["hamstrings", "glutes"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/deadlift.jpg",
  },
  // Shoulders
  {
    id: "ohp",
    name: "Overhead Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-overhead-press.jpg",
  },
  {
    id: "db-shoulder-press",
    name: "Dumbbell Shoulder Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps"],
    equipment: "dumbbell",
    category: "compound",
    guideImage: "/images/exercises/dumbbell-shoulder-press.jpg",
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    category: "isolation",
    guideImage: "/images/exercises/lateral-raise.jpg",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscleGroup: "shoulders",
    secondaryMuscles: ["back"],
    equipment: "cable",
    category: "isolation",
    guideImage: "/images/exercises/face-pull.jpg",
  },
  // Arms
  {
    id: "barbell-curl",
    name: "Barbell Curl",
    muscleGroup: "biceps",
    equipment: "barbell",
    category: "isolation",
    guideImage: "/images/exercises/barbell-curl.jpg",
  },
  {
    id: "db-curl",
    name: "Dumbbell Curl",
    muscleGroup: "biceps",
    equipment: "dumbbell",
    category: "isolation",
    guideImage: "/images/exercises/dumbbell-curl.jpg",
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    muscleGroup: "biceps",
    secondaryMuscles: ["forearms"],
    equipment: "dumbbell",
    category: "isolation",
    guideImage: "/images/exercises/hammer-curl.jpg",
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    muscleGroup: "triceps",
    equipment: "cable",
    category: "isolation",
    guideImage: "/images/exercises/tricep-pushdown.jpg",
  },
  {
    id: "skullcrusher",
    name: "Skullcrusher",
    muscleGroup: "triceps",
    equipment: "barbell",
    category: "isolation",
    guideImage: "/images/exercises/skullcrusher.jpg",
  },
  {
    id: "dip",
    name: "Dip",
    muscleGroup: "triceps",
    secondaryMuscles: ["chest"],
    equipment: "bodyweight",
    category: "compound",
    guideImage: "/images/exercises/dip.jpg",
  },
  // Legs
  {
    id: "squat",
    name: "Back Squat",
    muscleGroup: "quads",
    secondaryMuscles: ["glutes", "hamstrings"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-back-squat.jpg",
  },
  {
    id: "front-squat",
    name: "Front Squat",
    muscleGroup: "quads",
    secondaryMuscles: ["core"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-front-squat.jpg",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "quads",
    secondaryMuscles: ["glutes"],
    equipment: "machine",
    category: "compound",
    guideImage: "/images/exercises/machine-leg-press.jpg",
  },
  {
    id: "rdl",
    name: "Romanian Deadlift",
    muscleGroup: "hamstrings",
    secondaryMuscles: ["glutes"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-romanian-deadlift.jpg",
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    muscleGroup: "hamstrings",
    equipment: "machine",
    category: "isolation",
    guideImage: "/images/exercises/leg-curl.jpg",
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    muscleGroup: "quads",
    equipment: "machine",
    category: "isolation",
    guideImage: "/images/exercises/leg-extension.jpg",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "glutes",
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell",
    category: "compound",
    guideImage: "/images/exercises/barbell-hip-thrust.jpg",
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscleGroup: "quads",
    secondaryMuscles: ["glutes"],
    equipment: "dumbbell",
    category: "compound",
    guideImage: "/images/exercises/bulgarian-split-squat.jpg",
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    muscleGroup: "calves",
    equipment: "machine",
    category: "isolation",
    guideImage: "/images/exercises/calf-raise.jpg",
  },
  // Core
  {
    id: "plank",
    name: "Plank",
    muscleGroup: "core",
    equipment: "bodyweight",
    category: "isolation",
    guideImage: "/images/exercises/plank.jpg",
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    muscleGroup: "core",
    equipment: "pullup-bar",
    category: "isolation",
    guideImage: "/images/exercises/hanging-leg-raise.jpg",
  },
  {
    id: "ab-wheel",
    name: "Ab Wheel",
    muscleGroup: "core",
    equipment: "other",
    category: "isolation",
    guideImage: "/images/exercises/ab-wheel.jpg",
  },
];

const CARDIO_EXERCISES: Exercise[] = [
  {
    id: "treadmill-walking",
    name: "Treadmill Walking",
    muscleGroup: "cardio",
    equipment: "machine",
    category: "cardio",
    guideImage: "/images/exercises/treadmill-walking.jpg",
  },
  {
    id: "stationary-cycling",
    name: "Stationary Cycling",
    muscleGroup: "cardio",
    equipment: "machine",
    category: "cardio",
    guideImage: "/images/exercises/stationary-cycling.jpg",
  },
  {
    id: "jump-rope",
    name: "Jump Rope",
    muscleGroup: "cardio",
    equipment: "other",
    category: "cardio",
    guideImage: "/images/exercises/jump-rope.jpg",
  },
  {
    id: "burpee",
    name: "Burpee",
    muscleGroup: "cardio",
    equipment: "bodyweight",
    category: "cardio",
    guideImage: "/images/exercises/burpee.jpg",
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    muscleGroup: "cardio",
    equipment: "bodyweight",
    category: "cardio",
    guideImage: "/images/exercises/mountain-climber.jpg",
  },
  {
    id: "battle-ropes",
    name: "Battle Ropes",
    muscleGroup: "cardio",
    equipment: "other",
    category: "cardio",
    guideImage: "/images/exercises/battle-ropes.jpg",
  },
  {
    id: "box-jump",
    name: "Box Jump",
    muscleGroup: "cardio",
    equipment: "other",
    category: "cardio",
    guideImage: "/images/exercises/box-jump.jpg",
  },
  {
    id: "high-knees",
    name: "High Knees",
    muscleGroup: "cardio",
    equipment: "bodyweight",
    category: "cardio",
    guideImage: "/images/exercises/high-knees.jpg",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  unit: "kg",
  theme: "dark",
  language: "en",
  defaultRest: 120,
  notificationsEnabled: false,
  availableEquipment: [
    "barbell",
    "dumbbell",
    "bench",
    "pullup-bar",
    "machine",
    "cable",
    "bodyweight",
    "band",
  ],
  weeklyGoal: 4,
  createdAt: Date.now(),
  userName: "",
  trainingAssistant: false,
};

export async function seedDatabase() {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd(EXERCISES);
  } else {
    // add cardio
    const cardioExercises = await db.exercises.where("category").equals("cardio").toArray();
    if (cardioExercises.length === 0) {
      await db.exercises.bulkAdd(CARDIO_EXERCISES);
    }

    // add guideImage
    for (const exercise of EXERCISES) {
      const existing = await db.exercises.get(exercise.id);
      if (existing && (existing.guideImage !== exercise.guideImage || !existing.guideImage)) {
        await db.exercises.update(existing.id, { guideImage: exercise.guideImage });
      }
    }

    for (const exercise of CARDIO_EXERCISES) {
      const existing = await db.exercises.get(exercise.id);
      if (existing && (existing.guideImage !== exercise.guideImage || !existing.guideImage)) {
        await db.exercises.update(existing.id, { guideImage: exercise.guideImage });
      }
    }
  }

  const s = await db.settings.get("app");
  if (!s) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}
