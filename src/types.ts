export interface HabitCategory {
  id: string;
  name: string;
  icon: string; // lucide icon string
  color: string; // Tailwind class/accent color mapping
  weight: number; // discipline score weight percentage
  
  // --- 2030 Futuristic customization fields (Proper 4D Customization Engine) ---
  bgStyle?: "hologram" | "cyber-mesh" | "glass-blur" | "audio-pulse" | "solid" | "particle";
  xpMultiplier?: number; // XP scale (e.g. 1.0 to 3.0)
  customFrequency?: "daily" | "weekly" | "odd" | "even" | "custom_days";
  customDays?: string[]; // e.g. ["Mon", "Wed", "Fri"]
  timeWindowStart?: string; // HH:MM
  timeWindowEnd?: string; // HH:MM
  inputTrackingType?: "checkbox" | "counter" | "numeric" | "duration" | "photo" | "gps";
  inputTargetValue?: number; // target counter or numeric limit
  inputUnitName?: string; // e.g., "ml", "mins", "cups", "pages"
  penaltySeverity?: "none" | "low" | "medium" | "high"; // penalty level triggers
  associatedBadge?: string; // linked achievement badge ID
  synthBeepFreq?: number; // synth audio frequency in Hz
  synthBeepDuration?: number; // synth duration in seconds
  visualChartType?: "area" | "bar" | "line" | "radar" | "gauge";
  levelLockRequirement?: number; // locked until Level X
  archived?: boolean; // temporarily toggle off
  subTags?: string[]; // array of tags for this category
  motivationalQuotes?: string[]; // list of category-specific quotes
  autoRolloverBacklog?: boolean; // rollover unchecked habits to next day
  warnInactiveHours?: number; // hours after which system alerts user if unchecked (e.g. 12 hours)
}

export interface Habit {
  id: string;
  category: string; // links to HabitCategory.id
  text: string;
}

export interface SetLog {
  reps: number;
  weight: number; // in lbs or kg
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Biceps" | "Shoulders" | "Legs" | "Core";
  instructions: string[];
  defaultSets: number;
  defaultReps: number;
  restTimer: number; // in seconds
  description: string;
}

export interface ExerciseLog {
  id: string;
  completed: boolean;
  sets: SetLog[];
  notes: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number; // in g
  carbs: number; // in g
  fat: number; // in g
  timestamp: string;
}

export interface Journal {
  well: string;
  distracted: string;
  improve: string;
  energy: number; // 1-10
  mood: number; // 1-10
  completed: boolean;
}

export interface PenaltyTask {
  id: string;
  name: string;
  description: string;
  penaltyType: "pushups" | "walking" | "reading" | "stretching";
  quantity: number; // e.g., 50 (pushups), 2000 (steps), 10 (pages), 15 (mins stretching)
  completed: boolean;
}

export interface DayLog {
  id: string; // composite key: `${userId}_${dayNumber}`
  userId: string; // associated user profile owner
  dayNumber: number; // 1-7
  date: string; // YYYY-MM-DD
  habits: Record<string, { 
    completed: boolean; 
    timestamp?: string;
    value?: number; // counter/numeric log value
    notes?: string; // custom description/backlog memo
    photo?: string; // base64 visual verification
    gps?: string; // physical target coordinates/name
  }>;
  exercises: Record<string, ExerciseLog>;
  meals: Meal[];
  waterIntake: number; // in ml
  journal: Journal;
  weight?: number; // in kg or lbs
  progressPhoto?: string; // base64 data url
  sleepHours?: number; // hours
  sleepScore?: number; // 0-100
  screenTime?: number; // in minutes
  disciplineScore: number; // 0-100
  xpEarned: number;
  penalties: PenaltyTask[];
  warnings: string[];
}

export interface UserProfile {
  id: string; // unique user identifier
  username: string;
  age?: number; // challenger's age
  avatar: string; // preset name (e.g. 'spartan', 'yogi', 'scholar')
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  badges: string[];
  challengeStartDate?: string; // YYYY-MM-DD
  waterGoal: number; // ml
  calorieGoal: number; // kcal
  proteinGoal: number; // g
  screenTimeGoal: number; // mins
  targetWakeTime: string; // HH:MM
  targetSleepTime: string; // HH:MM
  theme?: "dark" | "light" | "liquid-glass";
  friends?: string[]; // list of user IDs added as friends
  friendRequestsReceived?: string[]; // list of user IDs who sent a request to this user
  friendRequestsSent?: string[]; // list of user IDs this user has sent a request to
  notifications?: NotificationItem[]; // notifications for this user
  groqApiKey?: string; // Groq API key for Discipline AI Coach
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  timestamp: string;
  read: boolean;
  type?: "friend_request" | "general";
  requesterId?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  icon: string; // lucide icon name
  unlockedAt?: string; // YYYY-MM-DD
}

