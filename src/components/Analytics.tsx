import React, { useState } from "react";
import { TrendingUp, BarChart2, Award, CheckCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { DayLog, UserProfile } from "../types";

interface AnalyticsProps {
  allLogs: DayLog[];
  profile: UserProfile;
}

type MetricType =
  | "discipline"
  | "habits"
  | "workout"
  | "sleep"
  | "water"
  | "calories"
  | "weight"
  | "mood"
  | "screentime";

export const Analytics: React.FC<AnalyticsProps> = ({ allLogs }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>("discipline");

  // Format 7 days of data
  const data = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const log = allLogs.find((l) => l.dayNumber === dayNum);

    // Calc habits pct
    const totalHabitsCount = Object.keys(log?.habits || {}).length;
    const completedHabitsCount = Object.values(log?.habits || {}).filter((h) => h.completed).length;
    const habitsPct = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

    // Calc workout pct
    const workoutHabitIds = [
      "warm_up", "chest_workout", "back_workout", "biceps_workout",
      "shoulders_workout", "legs_workout", "core_workout", "stretching",
      "cardio", "steps_completed"
    ];
    const completedWorkoutCount = workoutHabitIds.filter((id) => log?.habits[id]?.completed).length;
    const workoutPct = Math.round((completedWorkoutCount / 10) * 100);

    return {
      day: `Day ${dayNum}`,
      discipline: log?.disciplineScore || 0,
      habits: habitsPct,
      workout: workoutPct,
      sleep: log?.sleepHours || 0,
      water: log ? log.waterIntake : 0, // ml
      calories: log ? log.meals.reduce((sum, m) => sum + m.calories, 0) : 0,
      weight: log?.weight || undefined,
      mood: log?.journal.completed ? log.journal.mood : 0,
      screentime: log?.screenTime || 0,
    };
  });

  const getMetricMetadata = () => {
    switch (activeMetric) {
      case "discipline":
        return {
          title: "Discipline Score History",
          yLabel: "Score (0-100)",
          color: "#a855f7",
          dataKey: "discipline",
          avgSuffix: "/100",
          desc: "Overall percentage of completed daily disciplines.",
        };
      case "habits":
        return {
          title: "Habit Consistency Rate",
          yLabel: "Percentage (%)",
          color: "#ec4899",
          dataKey: "habits",
          avgSuffix: "%",
          desc: "Average completion rate of all 36 daily habits.",
        };
      case "workout":
        return {
          title: "Workout Execution Rate",
          yLabel: "Completion (%)",
          color: "#10b981",
          dataKey: "workout",
          avgSuffix: "%",
          desc: "Completion percentage of training, stretching, and daily steps.",
        };
      case "sleep":
        return {
          title: "Sleep Duration Tracker",
          yLabel: "Hours (hrs)",
          color: "#3b82f6",
          dataKey: "sleep",
          avgSuffix: " hrs",
          desc: "Logged hours of sleep per night.",
        };
      case "water":
        return {
          title: "Water Intake Log",
          yLabel: "Volume (ml)",
          color: "#06b6d4",
          dataKey: "water",
          avgSuffix: " ml",
          desc: "Daily liquid hydration volume logged.",
        };
      case "calories":
        return {
          title: "Daily Caloric Log",
          yLabel: "Calories (kcal)",
          color: "#f97316",
          dataKey: "calories",
          avgSuffix: " kcal",
          desc: "Sum of meal calories logged throughout the day.",
        };
      case "weight":
        return {
          title: "Weight Trajectory",
          yLabel: "Weight",
          color: "#14b8a6",
          dataKey: "weight",
          avgSuffix: " lbs/kg",
          desc: "Body weight logged in mornings.",
        };
      case "mood":
        return {
          title: "Mental Energy & Mood State",
          yLabel: "Rating (1-10)",
          color: "#eab308",
          dataKey: "mood",
          avgSuffix: "/10",
          desc: "Subjective daily mental calmness and mood level.",
        };
      case "screentime":
        return {
          title: "Screen Time Control",
          yLabel: "Time (mins)",
          color: "#ef4444",
          dataKey: "screentime",
          avgSuffix: " mins",
          desc: "Logged screen minutes (lower is better).",
        };
    }
  };

  const meta = getMetricMetadata();

  // Helper stats calculations
  const values = data
    .map((d) => d[meta.dataKey as keyof Omit<typeof d, "day">] as number)
    .filter((v): v is number => v !== undefined && !isNaN(v) && v > 0);

  const avg = values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
  const best = values.length > 0 ? (meta.dataKey === "screentime" ? Math.min(...values) : Math.max(...values)) : 0;
  const loggedDays = values.length;

  const metricTabs: { type: MetricType; name: string; color: string }[] = [
    { type: "discipline", name: "Discipline Score", color: "border-neon-purple text-neon-purple bg-neon-purple/5" },
    { type: "habits", name: "Habit Rate", color: "border-neon-pink text-neon-pink bg-neon-pink/5" },
    { type: "workout", name: "Workouts", color: "border-neon-green text-neon-green bg-neon-green/5" },
    { type: "sleep", name: "Sleep (Hrs)", color: "border-blue-500 text-blue-500 bg-blue-500/5" },
    { type: "water", name: "Water Intake", color: "border-neon-cyan text-neon-cyan bg-neon-cyan/5" },
    { type: "calories", name: "Calories", color: "border-neon-orange text-neon-orange bg-neon-orange/5" },
    { type: "weight", name: "Body Weight", color: "border-teal-500 text-teal-500 bg-teal-500/5" },
    { type: "mood", name: "Mood State", color: "border-neon-yellow text-neon-yellow bg-neon-yellow/5" },
    { type: "screentime", name: "Screen Time", color: "border-red-500 text-red-500 bg-red-500/5" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Analytics Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Challenge Analytics</h2>
          <p className="text-gray-400 text-xs max-w-sm">
            Analyze your progress trajectory. Watch your habits, training execution, weight fluctuations, and mental state sync together.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/10 min-w-[90px]">
            <div className="text-[9px] font-bold text-gray-500 uppercase">Logged Days</div>
            <div className="text-xl font-black text-white">{loggedDays} / 7</div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 min-w-[90px]">
            <div className="text-[9px] font-bold text-neon-purple uppercase">Avg Discipline</div>
            <div className="text-xl font-black text-white">
              {data.map((d) => d.discipline).reduce((a, b) => a + b, 0) / 7 === 0
                ? 0
                : Math.round(data.map((d) => d.discipline).reduce((a, b) => a + b, 0) / Math.max(1, allLogs.filter(l => l.disciplineScore > 0).length))}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector List */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {metricTabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveMetric(tab.type)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
              activeMetric === tab.type
                ? `${tab.color} border-2 scale-102 font-extrabold shadow-sm`
                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Primary Chart Visualization Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Line / Area Chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center text-left">
            <div>
              <h3 className="text-white font-extrabold text-base">{meta.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{meta.desc}</p>
            </div>
            <TrendingUp className="w-5 h-5" style={{ color: meta.color }} />
          </div>

          <div className="h-64 sm:h-80 w-full pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={meta.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="#475569" fontSize={11} fontWeight={600} />
                <YAxis stroke="#475569" fontSize={11} fontWeight={600} label={{ value: meta.yLabel, angle: -90, position: "insideLeft", offset: 10, fill: "#475569", fontSize: "10px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111219",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    fontSize: "11px",
                  }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey={meta.dataKey}
                  stroke={meta.color}
                  fillOpacity={1}
                  fill="url(#metricGlow)"
                  strokeWidth={3}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Review Stats Column */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-6 text-left">
          <div className="space-y-4">
            <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Metric Highlights</h3>
            
            {/* Average Widget */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">7-Day average</span>
                <span className="text-lg font-black text-white">{avg}{meta.avgSuffix}</span>
              </div>
              <span className="p-2 rounded-xl bg-white/5 border border-white/10">
                <BarChart2 className="w-5 h-5 text-gray-400" />
              </span>
            </div>

            {/* Best Record Widget */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  {meta.dataKey === "screentime" ? "Lowest Limit" : "Best Record"}
                </span>
                <span className="text-lg font-black text-white">{best}{meta.avgSuffix}</span>
              </div>
              <span className="p-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple">
                <Award className="w-5 h-5" />
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-neon-cyan/20 text-xs text-gray-400 leading-relaxed">
            <strong className="text-white flex items-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-neon-cyan" /> Consistency Insight
            </strong>
            {avg >= 85 ? (
              <span>Excellent control. You are holding down your commitments like an iron wall. Keep pushing.</span>
            ) : avg >= 60 ? (
              <span>Moderate execution. A few slips are letting discipline weaken. Double down on block planning.</span>
            ) : (
              <span>Underperforming. Discipline is breaking. Review warning logs and accept recovery penalties immediately.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
