import Dexie, { type Table } from "dexie";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms"
  | "cardio";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "pullup-bar"
  | "bench"
  | "other";

export type Location = "gym" | "home" | "outdoor";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  category: "compound" | "isolation" | "cardio";
  aliases?: string[];
  substituteIds?: string[];
  custom?: boolean;
  guideImage?: string;
}

export interface WorkoutSet {
  id: string;
  exerciseEntryId: string; // FK -> WorkoutExercise.id
  weight: number; // kg
  reps: number;
  rir?: number;
  rpe?: number;
  restTime?: number; // seconds actually taken
  completed: boolean;
  isWarmup?: boolean;
  notes?: string;
  timestamp: number;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  restPreset?: number;
  notes?: string;
  supersetGroup?: number;
  targetSets?: number;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: number;
  endTime?: number;
  durationSec?: number;
  location: Location;
  templateId?: string;
  name?: string;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  totalVolume?: number;
  estimatedCalories?: number;
  insight?: any;
}

export interface TemplateExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  restPreset?: number;
  supersetGroup?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  location: Location;
  exercises: TemplateExercise[];
  order?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  arm?: number;
  thigh?: number;
  shoulder?: number;
  hip?: number;
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  blob: Blob;
  thumb: Blob;
  angle?: "front" | "side" | "back";
  notes?: string;
}

export interface RecoveryLog {
  id: string;
  date: string;
  sorenessByGroup?: Partial<Record<MuscleGroup, number>>; // 0–5
  sleepHours?: number;
  sleepQuality?: number; // 1–5
  fatigue?: number; // 1–5
  notes?: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: "weight" | "reps" | "volume" | "e1rm";
  value: number;
  weight?: number;
  reps?: number;
  date: string;
  workoutId: string;
}

export interface Settings {
  id: "app";
  unit: "kg" | "lb";
  theme: "dark" | "light" | "system";
  language?: "en" | "vi";
  defaultRest: number;
  notificationsEnabled: boolean;
  availableEquipment: Equipment[];
  weeklyGoal?: number;
  targetWeight?: number;
  createdAt: number;
  userName?: string;
  trainingAssistant?: boolean;
}

export type NotificationType = "whats_new" | "weekly_summary";

export interface AppNotification {
  id: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  key?: string;
  title: string;
  subtitle?: string;
  payload?: any;
}

class ForgeDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  workoutSets!: Table<WorkoutSet, string>;
  templates!: Table<WorkoutTemplate, string>;
  measurements!: Table<BodyMeasurement, string>;
  photos!: Table<ProgressPhoto, string>;
  recovery!: Table<RecoveryLog, string>;
  prs!: Table<PersonalRecord, string>;
  settings!: Table<Settings, string>;
  notifications!: Table<AppNotification, string>;

  constructor() {
    super("forge-db");
    this.version(1).stores({
      exercises: "id, name, muscleGroup, equipment, category",
      workouts: "id, date, startTime, location, templateId",
      workoutExercises: "id, workoutId, exerciseId, order",
      workoutSets: "id, exerciseEntryId, timestamp, completed",
      templates: "id, name, location, updatedAt",
      measurements: "id, date",
      photos: "id, date",
      recovery: "id, date",
      prs: "id, exerciseId, type, date",
      settings: "id",
    });
    this.version(2).stores({
      exercises: "id, name, muscleGroup, equipment, category",
      workouts: "id, date, startTime, location, templateId",
      workoutExercises: "id, workoutId, exerciseId, order",
      workoutSets: "id, exerciseEntryId, timestamp, completed",
      templates: "id, name, location, updatedAt",
      measurements: "id, date",
      photos: "id, date",
      recovery: "id, date",
      prs: "id, exerciseId, type, date",
      settings: "id",
      notifications: "id, type, createdAt, read, key",
    });
  }
}

export const db = new ForgeDB();

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
