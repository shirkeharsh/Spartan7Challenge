import type { DayLog, UserProfile, Achievement, HabitCategory, Habit } from "../types";
import { EXERCISES } from "../data/exercises";

export const DEFAULT_HABIT_CATEGORIES: HabitCategory[] = [
  { id: "morning", name: "Morning Routine", icon: "Sun", color: "neon-yellow", weight: 20 },
  { id: "food", name: "Clean Food & Nutrition", icon: "Flame", color: "neon-orange", weight: 20 },
  { id: "workout", name: "Physical Execution", icon: "Dumbbell", color: "neon-purple", weight: 30 },
  { id: "lifestyle", name: "Lifestyle & Sleep", icon: "Smartphone", color: "neon-cyan", weight: 15 },
  { id: "mental", name: "Mindset & Focus", icon: "Brain", color: "neon-pink", weight: 15 },
];

export const DEFAULT_WORKOUT_CATEGORIES = ["Chest", "Back", "Biceps", "Shoulders", "Legs", "Core"];

export const HABITS_LIST = [
  // MORNING
  { id: "wake_up", category: "morning" as const, text: "Wake up on time" },
  { id: "make_bed", category: "morning" as const, text: "Made bed" },
  { id: "drink_water_morning", category: "morning" as const, text: "Drank water" },
  { id: "cold_shower", category: "morning" as const, text: "Cold shower" },
  { id: "no_phone_morning", category: "morning" as const, text: "No phone first hour" },
  { id: "meditation", category: "morning" as const, text: "Meditation" },
  { id: "morning_walk", category: "morning" as const, text: "Morning walk" },

  // FOOD
  { id: "breakfast", category: "food" as const, text: "Breakfast" },
  { id: "lunch", category: "food" as const, text: "Lunch" },
  { id: "evening_snack", category: "food" as const, text: "Evening Snack" },
  { id: "dinner", category: "food" as const, text: "Dinner" },
  { id: "protein_goal", category: "food" as const, text: "Protein goal reached" },
  { id: "water_goal", category: "food" as const, text: "Water goal reached" },
  { id: "no_junk", category: "food" as const, text: "No junk food" },
  { id: "no_sugary", category: "food" as const, text: "No sugary drinks" },

  // WORKOUT
  { id: "warm_up", category: "workout" as const, text: "Warm-up" },
  { id: "chest_workout", category: "workout" as const, text: "Chest workout" },
  { id: "back_workout", category: "workout" as const, text: "Back workout" },
  { id: "biceps_workout", category: "workout" as const, text: "Biceps workout" },
  { id: "shoulders_workout", category: "workout" as const, text: "Shoulders workout" },
  { id: "legs_workout", category: "workout" as const, text: "Legs workout" },
  { id: "core_workout", category: "workout" as const, text: "Core workout" },
  { id: "stretching", category: "workout" as const, text: "Stretching" },
  { id: "cardio", category: "workout" as const, text: "Cardio" },
  { id: "steps_completed", category: "workout" as const, text: "Steps completed" },

  // LIFESTYLE
  { id: "no_phone_washroom", category: "lifestyle" as const, text: "No phone in washroom" },
  { id: "screen_time_goal", category: "lifestyle" as const, text: "Screen time under goal" },
  { id: "read_pages", category: "lifestyle" as const, text: "Read 20 pages" },
  { id: "journal_completed", category: "lifestyle" as const, text: "Journal completed" },
  { id: "room_cleaned", category: "lifestyle" as const, text: "Room cleaned" },
  { id: "sleep_time", category: "lifestyle" as const, text: "Sleep before target time" },

  // MENTAL
  { id: "controlled_anger", category: "mental" as const, text: "Controlled anger" },
  { id: "patient", category: "mental" as const, text: "Stayed patient" },
  { id: "no_procrastination", category: "mental" as const, text: "No procrastination" },
  { id: "focus", category: "mental" as const, text: "Focus maintained" },
  { id: "no_scrolling", category: "mental" as const, text: "No unnecessary scrolling" },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "early_bird", name: "Early Bird", description: "Wake up on time 3 times.", xpReward: 150, icon: "Sun" },
  { id: "no_phone_hero", name: "No Phone Hero", description: "Complete 'No phone first hour' and 'No phone in washroom' for 3 days.", xpReward: 200, icon: "SmartphoneOff" },
  { id: "iron_discipline", name: "Iron Discipline", description: "Earn a perfect 100 Discipline Score on any day.", xpReward: 300, icon: "Shield" },
  { id: "protein_master", name: "Protein Master", description: "Reach your protein goal 3 times.", xpReward: 150, icon: "Flame" },
  { id: "workout_beast", name: "Workout Beast", description: "Complete all workout categories on any day.", xpReward: 200, icon: "Dumbbell" },
  { id: "consistency_king", name: "Consistency King", description: "Maintain a 3-day perfect streak.", xpReward: 250, icon: "Crown" },
  { id: "seven_day_champion", name: "7-Day Champion", description: "Complete all 7 days of the discipline challenge.", xpReward: 500, icon: "Trophy" }
];

export const DAILY_MISSIONS = [
  "Conquer the morning. Rise early and resist the screen.",
  "Fuel the machine. Eat strictly clean food and hit your protein target.",
  "Push past your limits. Complete a full dumbbell/bodyweight workout session.",
  "Own your mind. Stand firm against scrolling and mental procrastination.",
  "Build the habit loop. Complete every morning and lifestyle task today.",
  "Strengthen the fortress. Focus intensely on patience and controlled anger.",
  "Final ascent. Maintain iron discipline for the ultimate completion score."
];

export const DAILY_QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "We must all suffer one of two things: the pain of discipline or the pain of regret.", author: "Jim Rohn" },
  { text: "Self-discipline is the self-respect in action.", author: "Theodore Roosevelt" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You will never always be motivated, so you must learn to be disciplined.", author: "Unknown" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" }
];

export const getInitialDayLog = (userId: string, dayNumber: number, dateStr: string): DayLog => {
  // Initialize habits object
  const habits: Record<string, { completed: boolean }> = {};
  HABITS_LIST.forEach((h) => {
    habits[h.id] = { completed: false };
  });

  // Initialize exercises object
  const exercisesLog: Record<string, { id: string; completed: boolean; sets: { reps: number; weight: number; completed: boolean }[]; notes: string }> = {};
  EXERCISES.forEach((ex) => {
    const sets = Array.from({ length: ex.defaultSets }, () => ({
      reps: ex.defaultReps,
      weight: 0,
      completed: false,
    }));
    exercisesLog[ex.id] = {
      id: ex.id,
      completed: false,
      sets,
      notes: "",
    };
  });

  return {
    id: `${userId}_${dayNumber}`,
    userId,
    dayNumber,
    date: dateStr,
    habits,
    exercises: exercisesLog,
    meals: [],
    waterIntake: 0,
    journal: {
      well: "",
      distracted: "",
      improve: "",
      energy: 5,
      mood: 5,
      completed: false,
    },
    weight: undefined,
    progressPhoto: undefined,
    sleepHours: undefined,
    sleepScore: undefined,
    screenTime: undefined,
    disciplineScore: 0,
    xpEarned: 0,
    penalties: [],
    warnings: [],
  };
};

export const calculateDisciplineScore = (
  log: DayLog,
  habitsList: Habit[] = HABITS_LIST,
  categoriesList: HabitCategory[] = DEFAULT_HABIT_CATEGORIES
): number => {
  let score = 0;

  const categories: Record<string, { weight: number; count: number; completed: number }> = {};
  categoriesList.forEach((cat) => {
    categories[cat.id] = { weight: cat.weight, count: 0, completed: 0 };
  });

  // Count habits
  habitsList.forEach((h) => {
    const isCompleted = log.habits[h.id]?.completed || false;
    if (categories[h.category]) {
      categories[h.category].count += 1;
      if (isCompleted) {
        categories[h.category].completed += 1;
      }
    }
  });

  // Calculate score
  Object.keys(categories).forEach((catId) => {
    const data = categories[catId];
    if (data.count > 0) {
      score += (data.completed / data.count) * data.weight;
    }
  });

  return Math.min(100, Math.round(score));
};

export const getDisciplineGrade = (score: number): "S" | "A" | "B" | "C" | "D" => {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
};

// Check achievements to unlock
export const checkAchievements = (logs: DayLog[], profile: UserProfile): string[] => {
  const newlyUnlocked: string[] = [];
  const currentBadges = new Set(profile.badges);

  // Helper to add badge
  const unlockBadge = (id: string) => {
    if (!currentBadges.has(id)) {
      newlyUnlocked.push(id);
    }
  };

  // 1. Early Bird: Wake up on time 3 times
  let wakeUpCount = 0;
  logs.forEach((log) => {
    if (log.habits["wake_up"]?.completed) wakeUpCount++;
  });
  if (wakeUpCount >= 3) unlockBadge("early_bird");

  // 2. No Phone Hero: Complete both no phone habits 3 times
  let noPhoneDays = 0;
  logs.forEach((log) => {
    if (log.habits["no_phone_morning"]?.completed && log.habits["no_phone_washroom"]?.completed) {
      noPhoneDays++;
    }
  });
  if (noPhoneDays >= 3) unlockBadge("no_phone_hero");

  // 3. Iron Discipline: Perfect 100 score
  let hasPerfectDay = false;
  logs.forEach((log) => {
    if (log.disciplineScore === 100) hasPerfectDay = true;
  });
  if (hasPerfectDay) unlockBadge("iron_discipline");

  // 4. Protein Master: Protein goal reached 3 times
  let proteinGoalCount = 0;
  logs.forEach((log) => {
    if (log.habits["protein_goal"]?.completed) proteinGoalCount++;
  });
  if (proteinGoalCount >= 3) unlockBadge("protein_master");

  // 5. Workout Beast: All 10 workout habits completed on any day
  let hasBeastWorkout = false;
  logs.forEach((log) => {
    const workoutHabitIds = HABITS_LIST.filter(h => h.category === "workout").map(h => h.id);
    const allWorkoutHabitsCompleted = workoutHabitIds.every(id => log.habits[id]?.completed);
    if (allWorkoutHabitsCompleted) hasBeastWorkout = true;
  });
  if (hasBeastWorkout) unlockBadge("workout_beast");

  // 6. Consistency King: 3-day perfect streak (100 score) or simply 3 days of 80+ discipline
  let streakCount = 0;
  let maxStreak = 0;
  logs.forEach((log) => {
    if (log.disciplineScore >= 80) {
      streakCount++;
      if (streakCount > maxStreak) maxStreak = streakCount;
    } else {
      streakCount = 0;
    }
  });
  if (maxStreak >= 3) unlockBadge("consistency_king");

  // 7. 7-Day Champion: Complete all 7 days with >50% average score
  if (logs.length === 7) {
    const allCompleted = logs.every(log => log.disciplineScore >= 50);
    if (allCompleted) unlockBadge("seven_day_champion");
  }

  return newlyUnlocked;
};
