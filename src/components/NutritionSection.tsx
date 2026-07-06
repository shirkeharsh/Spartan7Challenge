import React, { useState } from "react";
import { Plus, Trash2, Droplet, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";
import type { DayLog, UserProfile, Meal } from "../types";

interface NutritionSectionProps {
  currentLog: DayLog;
  profile: UserProfile;
  allLogs: DayLog[];
  onUpdateLog: (log: Partial<DayLog>) => void;
}

export const NutritionSection: React.FC<NutritionSectionProps> = ({
  currentLog,
  profile,
  allLogs,
  onUpdateLog,
}) => {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !calories) return;

    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: mealName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMeals = [...currentLog.meals, newMeal];
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0);

    // Auto-check clean food and protein habits
    const updatedHabits = { ...currentLog.habits };
    
    // Mark meals checked if logged
    if (mealName.toLowerCase().includes("breakfast")) updatedHabits["breakfast"] = { completed: true };
    if (mealName.toLowerCase().includes("lunch")) updatedHabits["lunch"] = { completed: true };
    if (mealName.toLowerCase().includes("snack")) updatedHabits["evening_snack"] = { completed: true };
    if (mealName.toLowerCase().includes("dinner")) updatedHabits["dinner"] = { completed: true };

    if (totalProtein >= profile.proteinGoal) {
      updatedHabits["protein_goal"] = { completed: true };
    }

    onUpdateLog({
      meals: updatedMeals,
      habits: updatedHabits,
    });

    // Reset fields
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const handleRemoveMeal = (id: string) => {
    const updatedMeals = currentLog.meals.filter((m) => m.id !== id);
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0);

    const updatedHabits = { ...currentLog.habits };
    if (totalProtein < profile.proteinGoal) {
      updatedHabits["protein_goal"] = { completed: false };
    }

    onUpdateLog({
      meals: updatedMeals,
      habits: updatedHabits,
    });
  };

  const handleQuickWater = (ml: number) => {
    const water = (currentLog.waterIntake || 0) + ml;
    const updatedHabits = { ...currentLog.habits };
    
    if (water >= profile.waterGoal) {
      updatedHabits["water_goal"] = { completed: true };
    }

    onUpdateLog({
      waterIntake: water,
      habits: updatedHabits,
    });
  };

  // Calculations
  const totalCal = currentLog.meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProt = currentLog.meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarb = currentLog.meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFats = currentLog.meals.reduce((sum, m) => sum + m.fat, 0);

  // Prepare chart data for all logs
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const dayNum = index + 1;
    const log = allLogs.find((l) => l.dayNumber === dayNum);
    return {
      day: `Day ${dayNum}`,
      calories: log ? log.meals.reduce((sum, m) => sum + m.calories, 0) : 0,
      protein: log ? log.meals.reduce((sum, m) => sum + m.protein, 0) : 0,
      water: log ? log.waterIntake / 1000 : 0, // in Liters
    };
  });

  return (
    <div className="space-y-6">
      {/* Hydration Widget */}
      <div className="glass-panel p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/20 text-neon-cyan">
              <Droplet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-white font-extrabold text-base">Hydration Control</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Target: {profile.waterGoal} ml ({Math.min(100, Math.round((currentLog.waterIntake / profile.waterGoal) * 100))}% reached)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickWater(250)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan transition-all cursor-pointer"
            >
              +250 ml
            </button>
            <button
              onClick={() => handleQuickWater(500)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan transition-all cursor-pointer"
            >
              +500 ml
            </button>
            <button
              onClick={() => handleQuickWater(1000)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan transition-all cursor-pointer"
            >
              +1.0 Liter
            </button>
            <button
              onClick={() => onUpdateLog({ waterIntake: 0 })}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 cursor-pointer"
              title="Reset Water Log"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Animated Visual Cup */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-20 h-28 border-4 border-white/20 rounded-b-2xl rounded-t-lg overflow-hidden bg-black/40 flex items-end">
            <div
              className="w-full bg-gradient-to-t from-neon-cyan to-neon-cyan/60 transition-all duration-500"
              style={{ height: `${Math.min(100, (currentLog.waterIntake / profile.waterGoal) * 100)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-sm text-white">
              {currentLog.waterIntake}ml
            </div>
          </div>
        </div>
      </div>

      {/* Main Nutrition Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Meal Logger & Meal List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form to log meals */}
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <h3 className="text-white font-extrabold text-sm sm:text-base mb-4 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-neon-purple" />
              Add Meal Log
            </h3>
            <form onSubmit={handleAddMeal} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Protein Shake, Chicken & Rice"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Protein (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Carbs (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Fat (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-neon-purple to-neon-cyan text-white text-xs font-bold hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-md"
                >
                  Log Meal Entry
                </button>
              </div>
            </form>
          </div>

          {/* Logged Meals List */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-white font-extrabold text-sm sm:text-base">Logged Meals Today</h3>
            {currentLog.meals.length === 0 ? (
              <p className="text-gray-500 text-xs py-4 text-center">No meals logged yet today.</p>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {currentLog.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="text-left space-y-0.5">
                      <div className="text-sm font-bold text-white">{meal.name}</div>
                      <div className="text-[10px] text-gray-500">Logged at {meal.timestamp}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{meal.calories} <span className="text-xs text-gray-500 font-medium">kcal</span></div>
                        <div className="text-[10px] text-gray-400">P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g</div>
                      </div>
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer transition-all hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Nutrition Targets / Macro Status */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-5">
          <h3 className="text-white font-extrabold text-sm sm:text-base">Target Macros Summary</h3>
          
          {/* Calories Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Calories</span>
              <span className="text-white">{totalCal} / {profile.calorieGoal} kcal</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-neon-purple rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalCal / profile.calorieGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Protein Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Protein (g)</span>
              <span className="text-white">{totalProt} / {profile.proteinGoal} g</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-neon-orange rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalProt / profile.proteinGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Carbohydrates logged */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Carbohydrates</span>
              <span className="text-white">{totalCarb} g</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-neon-yellow rounded-full" style={{ width: `${Math.min(100, (totalCarb / 250) * 100)}%` }}></div>
            </div>
          </div>

          {/* Fats logged */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Fats</span>
              <span className="text-white">{totalFats} g</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-neon-pink rounded-full" style={{ width: `${Math.min(100, (totalFats / 80) * 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts in Nutrition Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calories Chart */}
        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 text-left">7-Day Calories logged</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="calColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderRadius: "12px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="calories" stroke="#a855f7" fillOpacity={1} fill="url(#calColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protein Chart */}
        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 text-left">7-Day Protein Intake (g)</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderRadius: "12px", fontSize: "11px" }} />
                <Bar dataKey="protein" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.protein >= profile.proteinGoal ? "#f97316" : "#f9731650"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Chart */}
        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 text-left">7-Day Water Level (Liters)</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderRadius: "12px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="water" stroke="#06b6d4" fillOpacity={1} fill="url(#waterColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
