import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import type { DayLog, Habit, HabitCategory } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface HabitTrackerProps {
  currentLog: DayLog;
  habitsList: Habit[];
  categoriesList: HabitCategory[];
  userLevel?: number;
  onUpdateLog: (log: Partial<DayLog>) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  currentLog,
  habitsList,
  categoriesList,
  userLevel = 1,
  onUpdateLog,
}) => {
  const [activeTimerHabit, setActiveTimerHabit] = useState<string | null>(null);

  // Background timer interval for Duration tracking
  useEffect(() => {
    let interval: number | null = null;
    if (activeTimerHabit) {
      interval = window.setInterval(() => {
        const updatedHabits = { ...currentLog.habits };
        const habitCategory = habitsList.find((h) => h.id === activeTimerHabit)?.category;
        const cat = categoriesList.find((c) => c.id === habitCategory);
        const target = cat?.inputTargetValue || 60;
        const currentSeconds = updatedHabits[activeTimerHabit]?.value || 0;
        const nextSec = currentSeconds + 1;
        
        updatedHabits[activeTimerHabit] = {
          ...updatedHabits[activeTimerHabit],
          completed: nextSec >= target,
          value: nextSec,
          timestamp: nextSec >= target ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
        };
        onUpdateLog({ habits: updatedHabits });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimerHabit]);

  // Audio synthesizer player for alert sounds
  const playSynthAlert = (freq = 880, duration = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Autoplay block / AudioContext error", e);
    }
  };

  // Dynamic Lucide Icon Loader
  const getLucideIcon = (name: string, className = "w-5 h-5") => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] || Icons.Award;
    return <IconComponent className={className} />;
  };

  // Modern neon styles mapping
  const getColorStyles = (color: string) => {
    switch (color) {
      case "neon-yellow":
        return {
          border: "border-neon-yellow/20 text-neon-yellow",
          accent: "bg-neon-yellow/10 text-neon-yellow",
          barColor: "bg-neon-yellow",
          glow: "shadow-[0_0_12px_rgba(234,179,8,0.15)]",
        };
      case "neon-orange":
        return {
          border: "border-neon-orange/20 text-neon-orange",
          accent: "bg-neon-orange/10 text-neon-orange",
          barColor: "bg-neon-orange",
          glow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
        };
      case "neon-purple":
        return {
          border: "border-neon-purple/20 text-neon-purple",
          accent: "bg-neon-purple/10 text-neon-purple",
          barColor: "bg-neon-purple",
          glow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]",
        };
      case "neon-cyan":
        return {
          border: "border-neon-cyan/20 text-neon-cyan",
          accent: "bg-neon-cyan/10 text-neon-cyan",
          barColor: "bg-neon-cyan",
          glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        };
      case "neon-pink":
        return {
          border: "border-neon-pink/20 text-neon-pink",
          accent: "bg-neon-pink/10 text-neon-pink",
          barColor: "bg-neon-pink",
          glow: "shadow-[0_0_12px_rgba(236,72,153,0.15)]",
        };
      case "neon-green":
        return {
          border: "border-neon-green/20 text-neon-green",
          accent: "bg-neon-green/10 text-neon-green",
          barColor: "bg-neon-green",
          glow: "shadow-[0_0_12px_rgba(34,197,94,0.15)]",
        };
      case "neon-red":
        return {
          border: "border-red-500/20 text-red-400",
          accent: "bg-red-500/10 text-red-400",
          barColor: "bg-red-500",
          glow: "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
        };
      case "neon-indigo":
        return {
          border: "border-indigo-500/20 text-indigo-400",
          accent: "bg-indigo-500/10 text-indigo-400",
          barColor: "bg-indigo-500",
          glow: "shadow-[0_0_12px_rgba(99,102,241,0.15)]",
        };
      case "neon-blue":
        return {
          border: "border-blue-500/20 text-blue-400",
          accent: "bg-blue-500/10 text-blue-400",
          barColor: "bg-blue-500",
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.15)]",
        };
      default:
        return {
          border: "border-neon-purple/20 text-neon-purple",
          accent: "bg-neon-purple/10 text-neon-purple",
          barColor: "bg-neon-purple",
          glow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]",
        };
    }
  };

  // Save changes to DayLog habit entries
  const updateHabitValue = (habitId: string, val: number | string | undefined, isCompleted: boolean) => {
    const updatedHabits = { ...currentLog.habits };
    const wasCompleted = updatedHabits[habitId]?.completed || false;
    
    updatedHabits[habitId] = {
      completed: isCompleted,
      timestamp: isCompleted && !wasCompleted 
        ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
        : (isCompleted ? updatedHabits[habitId]?.timestamp : undefined),
      value: typeof val === "number" ? val : undefined,
      photo: typeof val === "string" && val.startsWith("data:") ? val : updatedHabits[habitId]?.photo,
      gps: typeof val === "string" && !val.startsWith("data:") ? val : updatedHabits[habitId]?.gps,
    };

    onUpdateLog({ habits: updatedHabits });

    // Synthesize Audio alert sound and trigger haptics on completion trigger
    if (isCompleted && !wasCompleted) {
      triggerHaptic("success");
      const habitObj = habitsList.find((h) => h.id === habitId);
      if (habitObj) {
        const cat = categoriesList.find((c) => c.id === habitObj.category);
        if (cat) {
          playSynthAlert(cat.synthBeepFreq || 880, cat.synthBeepDuration || 0.15);
        }
      }
    } else {
      triggerHaptic("light");
    }
  };

  // Toggle boolean checkbox type directly
  const toggleHabit = (habitId: string) => {
    const isCompleted = !(currentLog.habits[habitId]?.completed || false);
    updateHabitValue(habitId, undefined, isCompleted);
  };

  // Stats calculation
  const getCategoryStats = (categoryId: string) => {
    const habits = habitsList.filter((h) => h.category === categoryId);
    const completed = habits.filter((h) => currentLog.habits[h.id]?.completed).length;
    const total = habits.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  };

  const activeCategories = categoriesList.filter((c) => !c.archived);
  const totalHabits = habitsList.filter(h => {
    const cat = categoriesList.find(c => c.id === h.category);
    return cat && !cat.archived;
  }).length;
  const completedTotal = habitsList.filter(h => {
    const cat = categoriesList.find(c => c.id === h.category);
    return cat && !cat.archived && currentLog.habits[h.id]?.completed;
  }).length;
  const totalPercentage = totalHabits > 0 ? Math.round((completedTotal / totalHabits) * 100) : 0;

  // Background style helper to generate dynamic CSS variables
  const getBgStyleClass = (bgStyle?: string) => {
    switch (bgStyle) {
      case "hologram":
        return "bg-linear-to-br from-[#10121d]/90 to-[#1e1430]/60 relative overflow-hidden border border-purple-500/25 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)] holographic-grid-line";
      case "cyber-mesh":
        return "bg-[#0b0c10] border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden mesh-overlay";
      case "audio-pulse":
        return "bg-linear-to-br from-[#0c0d12] to-[#1a2333] border border-blue-500/20 shadow-md relative pulse-glow";
      case "particle":
        return "bg-linear-to-br from-[#0b0c10] to-[#121c16] border border-emerald-500/20 relative particle-overlay";
      case "solid":
        return "bg-[#161821] border border-white/5";
      case "glass-blur":
      default:
        return "backdrop-blur-md bg-white/5 border border-white/10";
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Matrix Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Daily Habit Matrix</h2>
          <p className="text-gray-400 text-xs mt-1">
            Complete active category parameters. Every missed check scales discipline levels down.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto z-10">
          <div className="flex-1 sm:flex-none text-right">
            <div className="text-2xl font-black text-white">{completedTotal} / {totalHabits}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Habits Completed</div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl">
            <span className="text-lg font-black text-neon-purple">{totalPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Grid of Custom Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeCategories.map((cat) => {
          const stats = getCategoryStats(cat.id);
          const categoryHabits = habitsList.filter((h) => h.category === cat.id);
          const colors = getColorStyles(cat.color);
          const isLocked = (cat.levelLockRequirement || 0) > userLevel;
          const bgClass = getBgStyleClass(cat.bgStyle);

          return (
            <div
              key={cat.id}
              className={`rounded-3xl p-6 transition-all duration-300 flex flex-col space-y-4 hover:scale-[1.01] ${bgClass} ${colors.glow} ${
                isLocked ? "opacity-40 select-none pointer-events-none" : ""
              }`}
            >
              {/* Locked Overlay HUD */}
              {isLocked && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-black/80 backdrop-blur-xs select-none">
                  <Icons.Lock className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
                  <div className="text-xs font-black uppercase text-white tracking-widest">Category Locked</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-1">Required discipline level: {cat.levelLockRequirement}</div>
                </div>
              )}

              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2.5 rounded-2xl border ${colors.border} ${colors.accent}`}>
                    {getLucideIcon(cat.icon, "w-5 h-5")}
                  </span>
                  <div>
                    <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight">{cat.name}</h3>
                    {cat.xpMultiplier && cat.xpMultiplier > 1 && (
                      <span className="inline-block bg-neon-purple/20 text-neon-purple border border-neon-purple/30 text-[9px] font-black px-1.5 py-0.5 rounded-lg mt-0.5">
                        +{cat.xpMultiplier}x XP BOOST
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-bold">{stats.completed}/{stats.total}</div>
                  <div className="text-[10px] text-gray-500 font-medium">({stats.pct}%)</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.barColor} rounded-full transition-all duration-300`}
                  style={{ width: `${stats.pct}%` }}
                ></div>
              </div>

              {/* Habits List */}
              <div className="space-y-3 pt-2 flex-1">
                {categoryHabits.map((h) => {
                  const item = currentLog.habits[h.id];
                  const completed = item?.completed || false;
                  const time = item?.timestamp;
                  const trackingType = cat.inputTrackingType || "checkbox";

                  return (
                    <div
                      key={h.id}
                      className={`p-4 rounded-2xl select-none transition-all border flex flex-col space-y-3 ${
                        completed
                          ? "bg-white/5 border-white/10 text-white"
                          : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3" onClick={() => trackingType === "checkbox" && toggleHabit(h.id)}>
                          {/* Custom Checkbox */}
                          <div
                            className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              completed
                                ? `bg-linear-to-r from-neon-purple to-neon-cyan shadow-sm`
                                : "border border-white/20"
                            }`}
                          >
                            {completed && <Icons.Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-200">{h.text}</span>
                        </div>

                        {/* Timestamp */}
                        {completed && time && (
                          <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                            {time}
                          </span>
                        )}
                      </div>

                      {/* Render inputs based on 2030 Custom Tracking Types */}
                      {trackingType === "counter" && (
                        <div className="flex items-center justify-between gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/5 w-full self-start">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentVal = item?.value || 0;
                                const target = cat.inputTargetValue || 1;
                                const newVal = Math.max(0, currentVal - 1);
                                updateHabitValue(h.id, newVal, newVal >= target);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-sm cursor-pointer border border-white/5"
                            >
                              -
                            </button>
                            <span className="text-xs text-gray-300 font-mono font-bold">
                              {item?.value || 0} / {cat.inputTargetValue || 1} {cat.inputUnitName || "times"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentVal = item?.value || 0;
                                const target = cat.inputTargetValue || 1;
                                const newVal = currentVal + 1;
                                updateHabitValue(h.id, newVal, newVal >= target);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-sm cursor-pointer border border-white/5"
                            >
                              +
                            </button>
                          </div>
                          {completed && <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Target Reached</span>}
                        </div>
                      )}

                      {trackingType === "numeric" && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs text-gray-400 font-bold">Log:</span>
                            <input
                              type="number"
                              value={item?.value || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const target = cat.inputTargetValue || 1;
                                updateHabitValue(h.id, val, val >= target);
                              }}
                              placeholder={`Target: ${cat.inputTargetValue || 1}`}
                              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-neon-purple text-center w-24 font-bold"
                            />
                            <span className="text-[10px] text-gray-400 font-mono">{cat.inputUnitName || "units"}</span>
                          </div>
                          {completed && <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider self-end sm:self-center">Target Met</span>}
                        </div>
                      )}

                      {trackingType === "duration" && (
                        <div className="flex items-center justify-between gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (activeTimerHabit === h.id) {
                                  setActiveTimerHabit(null);
                                } else {
                                  setActiveTimerHabit(h.id);
                                }
                              }}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 text-white font-bold text-sm cursor-pointer ${
                                activeTimerHabit === h.id ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {activeTimerHabit === h.id ? <Icons.Pause className="w-3.5 h-3.5" /> : <Icons.Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                            <span className="text-xs text-gray-300 font-mono font-bold">
                              {Math.floor((item?.value || 0) / 60)}m {(item?.value || 0) % 60}s / {Math.floor((cat.inputTargetValue || 60) / 60)}m
                            </span>
                          </div>
                          {completed && <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Timer Completed</span>}
                        </div>
                      )}

                      {trackingType === "photo" && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id={`file-${h.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateHabitValue(h.id, reader.result as string, true);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="flex items-center gap-3">
                            <label
                              htmlFor={`file-${h.id}`}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-98 text-[9px] font-black text-gray-300 uppercase tracking-widest cursor-pointer inline-block"
                            >
                              {item?.photo ? "✓ Replace Verification Photo" : "Upload Photo Proof"}
                            </label>
                            {completed && <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Verified</span>}
                          </div>
                          {item?.photo && (
                            <img src={item.photo} className="w-20 h-20 object-cover rounded-xl border border-white/15 mt-1 shadow-lg" alt="Proof Upload" />
                          )}
                        </div>
                      )}

                      {trackingType === "gps" && (
                        <div className="flex flex-col gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <Icons.Compass className="w-4 h-4 text-neon-purple" />
                            <input
                              type="text"
                              placeholder="Enter check-in address/city"
                              value={item?.gps || ""}
                              onChange={(e) => {
                                const text = e.target.value;
                                updateHabitValue(h.id, text, text.trim().length > 3);
                              }}
                              className="bg-transparent border-b border-white/10 text-white text-xs w-full focus:outline-none focus:border-neon-purple font-medium"
                            />
                          </div>
                          {completed && (
                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                              <Icons.CheckCircle className="w-3 h-3" /> GPS Logged: {item?.gps}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
