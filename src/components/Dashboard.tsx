import React, { useState, useEffect } from "react";
import {
  Flame,
  Clock,
  Sparkles,
  Droplet,
  Smartphone,
  Moon,
  TrendingUp,
  Camera,
  Activity,
  Smile,
  BookOpen,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import type { DayLog, UserProfile } from "../types";
import { getDisciplineGrade } from "../utils/challenge";

interface DashboardProps {
  currentLog: DayLog;
  profile: UserProfile;
  allLogs: DayLog[];
  quotesList: { text: string; author: string }[];
  missionsList: string[];
  onStartChallenge: () => void;
  onUpdateLog: (log: Partial<DayLog>) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentLog,
  profile,
  allLogs,
  quotesList,
  missionsList,
  onStartChallenge,
  onUpdateLog,
  onNavigateTab,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Calculate 7-day average discipline score
  const getWeeklyAvg = () => {
    const logged = allLogs.filter((l) => l.disciplineScore > 0);
    if (logged.length === 0) return 0;
    const sum = logged.reduce((acc, curr) => acc + curr.disciplineScore, 0);
    return Math.round(sum / logged.length);
  };

  // Countdown timer logic
  useEffect(() => {
    if (!profile.challengeStartDate) return;

    const timer = setInterval(() => {
      const startDate = new Date(profile.challengeStartDate!);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const diff = endDate.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile.challengeStartDate]);

  // Calculate Health Score
  // Calculated dynamically out of 100 from:
  // - Sleep Score: 25% (Target sleep score or hours reached)
  // - Water intake: 25% (Water goal reached)
  // - Junk/Sugary free: 25% (No junk and no sugary drinks)
  // - Screen time: 25% (under goal)
  const calculateHealthScore = (): number => {
    let score = 0;
    
    // Sleep: 8 hours or score >= 80 = 25 pts
    const sleep = currentLog.sleepHours || 0;
    if (sleep >= 7.5) score += 25;
    else if (sleep > 0) score += (sleep / 7.5) * 25;

    // Water: current / goal = 25 pts
    const water = currentLog.waterIntake || 0;
    const waterGoal = profile.waterGoal || 3000;
    score += Math.min(25, (water / waterGoal) * 25);

    // Food cleanliness
    const noJunk = currentLog.habits["no_junk"]?.completed ? 12.5 : 0;
    const noSugary = currentLog.habits["no_sugary"]?.completed ? 12.5 : 0;
    score += (noJunk + noSugary);

    // Screen Time
    const screen = currentLog.screenTime || 0;
    const screenGoal = profile.screenTimeGoal || 120;
    if (screen > 0 && screen <= screenGoal) {
      score += 25;
    } else if (screen > 0 && screen > screenGoal) {
      const overRatio = Math.max(0, 1 - (screen - screenGoal) / screenGoal);
      score += overRatio * 25;
    } else {
      // If not entered, evaluate habit checkbox
      score += currentLog.habits["screen_time_goal"]?.completed ? 25 : 0;
    }

    return Math.round(score);
  };

  // Workout completion count
  const getWorkoutCompletionStats = () => {
    const total = 10;
    const completed = [
      "warm_up", "chest_workout", "back_workout", "biceps_workout",
      "shoulders_workout", "legs_workout", "core_workout", "stretching",
      "cardio", "steps_completed"
    ].filter(id => currentLog.habits[id]?.completed).length;
    return { completed, total, pct: Math.round((completed / total) * 100) };
  };

  // Meal completion count
  const getMealCompletionStats = () => {
    const total = 8;
    const completed = [
      "breakfast", "lunch", "evening_snack", "dinner",
      "protein_goal", "water_goal", "no_junk", "no_sugary"
    ].filter(id => currentLog.habits[id]?.completed).length;
    return { completed, total, pct: Math.round((completed / total) * 100) };
  };

  // Upload Progress Photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLog({ progressPhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const currentMission = missionsList[(currentLog.dayNumber - 1) % missionsList.length] || missionsList[0] || "";
  const currentQuote = quotesList[(currentLog.dayNumber - 1) % quotesList.length] || quotesList[0] || { text: "", author: "" };
  const workoutStats = getWorkoutCompletionStats();
  const mealStats = getMealCompletionStats();
  const healthScore = calculateHealthScore();
  const disciplineGrade = getDisciplineGrade(currentLog.disciplineScore);

  const levelXPThreshold = 500;
  const levelProgressPct = Math.round((profile.xp % levelXPThreshold) / levelXPThreshold * 100);

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Panel */}
      <div className="glass-panel-glow p-6 rounded-3xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl -z-10"></div>

        {!profile.challengeStartDate ? (
          <div className="text-center py-10 space-y-5">
            <div className="inline-flex p-4 rounded-full bg-neon-purple/10 border border-neon-purple/30 animate-pulse-slow">
              <Flame className="w-12 h-12 text-neon-purple" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">7 Days of Iron Discipline</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">
              Commit to the ultimate lifestyle transformation. Track your workouts, nutrition, habits, and mindset. Break discipline, and face the consequences.
            </p>
            <button
              onClick={onStartChallenge}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-neon-purple/20 cursor-pointer"
            >
              Start 7-Day Challenge
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-xs font-semibold text-neon-purple flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Day {currentLog.dayNumber} of 7
                </span>
                <span className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs font-semibold text-neon-cyan flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Streak: {profile.streak} Days
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                TODAY'S MISSION
              </h2>
              <p className="text-gray-300 font-medium text-sm sm:text-base">{currentMission}</p>
            </div>

            {/* Countdown timer */}
            <div className="glass-card px-5 py-3.5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[200px]">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-neon-cyan" />
                Time Remaining
              </div>
              {timeLeft ? (
                <div className="flex gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white leading-none">{timeLeft.days}d</div>
                  </div>
                  <div className="text-gray-600">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white leading-none">{String(timeLeft.hours).padStart(2, "0")}h</div>
                  </div>
                  <div className="text-gray-600">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white leading-none">{String(timeLeft.minutes).padStart(2, "0")}m</div>
                  </div>
                  <div className="text-gray-600">:</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-neon-cyan leading-none">{String(timeLeft.seconds).padStart(2, "0")}s</div>
                  </div>
                </div>
              ) : (
                <span className="text-neon-green font-bold text-sm">CHALLENGE COMPLETED</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Gamification Metrics Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP & Level Panel */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-neon-yellow" />
                LEVEL {profile.level}
              </span>
              <span>{profile.xp % levelXPThreshold} / {levelXPThreshold} XP</span>
            </div>
            {/* XP progress bar */}
            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-purple transition-all duration-500"
                style={{ width: `${levelProgressPct}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500">Earn XP by completing habits and workouts.</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-neon-yellow/10 border border-neon-yellow/20">
            <div className="text-xs text-neon-yellow font-bold uppercase">Total XP</div>
            <div className="text-xl font-extrabold text-white">{profile.xp}</div>
          </div>
        </div>

        {/* Discipline & Health Score Circles */}
        <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-around gap-6 sm:gap-2 md:col-span-2">
          {/* Discipline Score Gauges */}
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Circular Progress (SVG) */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="url(#purpleGlow)"
                  strokeWidth="4"
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * currentLog.disciplineScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-xs font-black text-white">{currentLog.disciplineScore}</div>
              </div>
            </div>
            <div className="text-left">
              <h5 className="text-white text-sm font-bold flex items-center gap-1">
                Discipline Score
              </h5>
              <p className="text-gray-400 text-xs mt-0.5">
                Grade: <span className="font-black text-neon-purple">{disciplineGrade}</span> | Weekly Avg: <span className="font-black text-neon-cyan">{getWeeklyAvg()}%</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-white/10"></div>

          {/* Health Score Gauge */}
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="url(#greenGlow)"
                  strokeWidth="4"
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * healthScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="greenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-xs font-black text-white">{healthScore}</div>
              </div>
            </div>
            <div className="text-left">
              <h5 className="text-white text-sm font-bold">Health Score</h5>
              <p className="text-gray-400 text-xs mt-0.5">Hydration, clean eating, sleep</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quote of the Day Banner */}
      <div className="glass-card p-4 rounded-2xl border-l-4 border-neon-purple text-left">
        <p className="text-sm italic text-gray-200">"{currentQuote.text}"</p>
        <span className="text-xs text-gray-400 block mt-1.5">— {currentQuote.author}</span>
      </div>

      {/* 4. Two-Column Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Widgets: Workout and Nutrition summary) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Completion Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Workout Card */}
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Workout Progress</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{workoutStats.completed} of {workoutStats.total} components</p>
                </div>
                <span className="p-2 bg-neon-purple/10 border border-neon-purple/20 rounded-xl text-neon-purple">
                  <Activity className="w-5 h-5" />
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Completion</span>
                  <span>{workoutStats.pct}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-purple rounded-full transition-all duration-300"
                    style={{ width: `${workoutStats.pct}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("workout")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Go to Workout Routine <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nutrition Card */}
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Meal & Diet Status</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{mealStats.completed} of {mealStats.total} conditions</p>
                </div>
                <span className="p-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl text-neon-cyan">
                  <Droplet className="w-5 h-5" />
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Clean Food Rating</span>
                  <span>{mealStats.pct}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-cyan rounded-full transition-all duration-300"
                    style={{ width: `${mealStats.pct}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("nutrition")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Open Meal Tracker <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Logging Hub */}
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-cyan" />
              Quick Fitness & Health Log
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Water Metric */}
              <div className="glass-panel p-3.5 rounded-xl space-y-2 border border-white/5">
                <div className="flex justify-between items-center text-neon-cyan">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Water Intake</span>
                  <Droplet className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-white">{currentLog.waterIntake} <span className="text-xs text-gray-500">ml</span></div>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <button
                    onClick={() => onUpdateLog({ waterIntake: (currentLog.waterIntake || 0) + 250 })}
                    className="flex-1 py-1.5 sm:py-1 text-[10px] font-bold text-center rounded bg-neon-cyan/15 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan cursor-pointer transition-all"
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => onUpdateLog({ waterIntake: (currentLog.waterIntake || 0) + 500 })}
                    className="flex-1 py-1.5 sm:py-1 text-[10px] font-bold text-center rounded bg-neon-cyan/15 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan cursor-pointer transition-all"
                  >
                    +500ml
                  </button>
                </div>
              </div>

              {/* Sleep Metric */}
              <div className="glass-panel p-3.5 rounded-xl space-y-2 border border-white/5">
                <div className="flex justify-between items-center text-neon-purple">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sleep (Hrs)</span>
                  <Moon className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hrs"
                  value={currentLog.sleepHours || ""}
                  onChange={(e) => {
                    const hrs = parseFloat(e.target.value) || 0;
                    // Calculate sleep score out of 100 (8 hours = 100)
                    const score = Math.min(100, Math.round((hrs / 8) * 100));
                    onUpdateLog({ sleepHours: hrs, sleepScore: score });
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white font-bold focus:outline-none focus:border-neon-purple"
                />
                <div className="text-[10px] text-gray-400">Score: {currentLog.sleepScore || 0}</div>
              </div>

              {/* Weight Metric */}
              <div className="glass-panel p-3.5 rounded-xl space-y-2 border border-white/5">
                <div className="flex justify-between items-center text-neon-green">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Weight (lbs/kg)</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={currentLog.weight || ""}
                  onChange={(e) => onUpdateLog({ weight: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white font-bold focus:outline-none focus:border-neon-green"
                />
                <div className="text-[10px] text-gray-400">Track changes daily</div>
              </div>

              {/* Screen Time Metric */}
              <div className="glass-panel p-3.5 rounded-xl space-y-2 border border-white/5">
                <div className="flex justify-between items-center text-neon-orange">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Screen (Mins)</span>
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  placeholder="Mins"
                  value={currentLog.screenTime || ""}
                  onChange={(e) => onUpdateLog({ screenTime: parseInt(e.target.value) || undefined })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white font-bold focus:outline-none focus:border-neon-orange"
                />
                <div className="text-[10px] text-gray-400">Goal: {profile.screenTimeGoal} mins</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Progress photo + Mood Tracker + Journal Link) */}
        <div className="space-y-6">
          {/* Progress Photo upload */}
          <div className="glass-card p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-neon-purple" />
              Day {currentLog.dayNumber} Progress Photo
            </h4>
            <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {currentLog.progressPhoto ? (
                <>
                  <img
                    src={currentLog.progressPhoto}
                    alt={`Day ${currentLog.dayNumber} progress`}
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute bottom-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 cursor-pointer transition-all border border-white/10 text-white">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <label className="flex flex-col items-center gap-2 p-6 cursor-pointer text-gray-400 hover:text-white transition-all w-full h-full justify-center">
                  <Camera className="w-8 h-8 text-neon-purple animate-pulse" />
                  <span className="text-xs font-medium">Add Progress Photo</span>
                  <span className="text-[10px] text-gray-500">JPEG/PNG format</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Mood Tracker */}
          <div className="glass-card p-5 rounded-2xl space-y-3.5">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-neon-yellow" />
              Mood & Mind Energy
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Mental Energy ({currentLog.journal.energy || 5}/10)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentLog.journal.energy || 5}
                  onChange={(e) => {
                    const journal = { ...currentLog.journal, energy: parseInt(e.target.value) };
                    onUpdateLog({ journal });
                  }}
                  className="w-full accent-neon-yellow"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Overall Mood ({currentLog.journal.mood || 5}/10)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentLog.journal.mood || 5}
                  onChange={(e) => {
                    const journal = { ...currentLog.journal, mood: parseInt(e.target.value) };
                    onUpdateLog({ journal });
                  }}
                  className="w-full accent-neon-yellow"
                />
              </div>
            </div>
          </div>

          {/* Daily Journal Summary Link */}
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-neon-cyan/20">
            <div className="space-y-1">
              <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-neon-cyan" />
                Reflect & Review
              </h4>
              <p className="text-[11px] text-gray-400">
                {currentLog.journal.completed
                  ? "✓ Today's journal entries completed"
                  : "Write your daily journal review"}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("journal")}
              className="p-2.5 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan cursor-pointer transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
