import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check, HelpCircle, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { DayLog, Exercise, SetLog, ExerciseLog } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface MuscleVisualizerProps {
  activeCategory: string;
}

const MuscleVisualizer: React.FC<MuscleVisualizerProps> = ({ activeCategory }) => {
  const isActive = (cat: string) => activeCategory === cat;
  
  return (
    <svg viewBox="0 0 100 130" className="w-24 h-24 sm:w-28 sm:h-28 opacity-80 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
      {/* Head */}
      <circle cx="50" cy="15" r="7" fill={isActive("Core") ? "#a855f7" : "#1e293b"} stroke="#475569" strokeWidth="1" />
      
      {/* Neck */}
      <line x1="50" y1="22" x2="50" y2="26" stroke="#475569" strokeWidth="2" />
      
      {/* Shoulders */}
      <path d="M 30,30 L 70,30" stroke={isActive("Shoulders") ? "#a855f7" : "#475569"} strokeWidth="6" strokeLinecap="round" />
      
      {/* Chest */}
      <rect x="36" y="32" width="28" height="15" rx="2" fill={isActive("Chest") ? "#06b6d4" : "#1e293b"} stroke="#475569" strokeWidth="1" />
      
      {/* Core (Abs) */}
      <rect x="39" y="49" width="22" height="20" rx="1" fill={isActive("Core") ? "#ec4899" : "#1e293b"} stroke="#475569" strokeWidth="1" />
      
      {/* Back (drawn slightly wider on edges to indicate lat wings) */}
      {isActive("Back") && (
        <path d="M 32,32 L 38,47 L 50,47 L 62,47 L 68,32 Z" fill="#10b981" opacity="0.8" />
      )}

      {/* Arms */}
      {/* Biceps Left/Right */}
      <line x1="28" y1="32" x2="22" y2="52" stroke={isActive("Biceps") ? "#eab308" : "#475569"} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="72" y1="32" x2="78" y2="52" stroke={isActive("Biceps") ? "#eab308" : "#475569"} strokeWidth="5.5" strokeLinecap="round" />
      
      {/* Forearms */}
      <line x1="22" y1="52" x2="16" y2="70" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="78" y1="52" x2="84" y2="70" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />

      {/* Legs */}
      {/* Quads/Hams (Thighs) */}
      <line x1="42" y1="71" x2="38" y2="98" stroke={isActive("Legs") ? "#f97316" : "#475569"} strokeWidth="7" strokeLinecap="round" />
      <line x1="58" y1="71" x2="62" y2="98" stroke={isActive("Legs") ? "#f97316" : "#475569"} strokeWidth="7" strokeLinecap="round" />
      
      {/* Calves */}
      <line x1="38" y1="98" x2="35" y2="122" stroke={isActive("Legs") ? "#f97316" : "#475569"} strokeWidth="5" strokeLinecap="round" />
      <line x1="62" y1="98" x2="65" y2="122" stroke={isActive("Legs") ? "#f97316" : "#475569"} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

interface WorkoutSectionProps {
  currentLog: DayLog;
  exercisesList: Exercise[];
  workoutCategories: string[];
  onUpdateLog: (log: Partial<DayLog>) => void;
}

export const WorkoutSection: React.FC<WorkoutSectionProps> = ({
  currentLog,
  exercisesList,
  workoutCategories,
  onUpdateLog,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(workoutCategories[0] || "Chest");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Rest Timer State
  const [timerTime, setTimerTime] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [activeTimerExercise, setActiveTimerExercise] = useState<string | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Beep synthesizer using Web Audio API
  const playTimerBeep = (freq = 880, duration = 0.15) => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext failed or blocked by autoplay policy", e);
    }
  };

  // Timer Tick Hook
  useEffect(() => {
    if (timerRunning && timerTime > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerTime((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Play alarm sound (three beeps)
            playTimerBeep(880, 0.2);
            setTimeout(() => playTimerBeep(880, 0.2), 250);
            setTimeout(() => playTimerBeep(1200, 0.4), 500);
            return 0;
          }
          // Soft click tick for last 3 seconds
          if (prev <= 4) {
            playTimerBeep(440, 0.05);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerTime]);

  const startRestTimer = (seconds: number, exerciseId: string) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerTime(seconds);
    setActiveTimerExercise(exerciseId);
    setTimerRunning(true);
    playTimerBeep(600, 0.1);
  };

  // Exercise Log Update handlers
  const getExerciseLog = (id: string): ExerciseLog => {
    return (
      currentLog.exercises[id] || {
        id,
        completed: false,
        sets: [],
        notes: "",
      }
    );
  };

  const updateExerciseLog = (exerciseId: string, updates: Partial<ExerciseLog>) => {
    const updatedExercises = { ...currentLog.exercises };
    const current = getExerciseLog(exerciseId);
    
    updatedExercises[exerciseId] = {
      ...current,
      ...updates,
    };

    // Auto-update workout habit checkboxes
    const exercise = exercisesList.find(ex => ex.id === exerciseId);
    if (exercise) {
      const categoryId = exercise.category; // e.g., 'Chest'
      const habitMapping: Record<string, string> = {
        "Chest": "chest_workout",
        "Back": "back_workout",
        "Biceps": "biceps_workout",
        "Shoulders": "shoulders_workout",
        "Legs": "legs_workout",
        "Core": "core_workout",
      };

      const habitId = habitMapping[categoryId];
      if (habitId) {
        // Find all exercises in this category
        const categoryExercises = exercisesList.filter((ex) => ex.category === categoryId);
        // Check if all exercises logged for this category are marked completed
        // (Either they are already completed or the updated one is completed)
        const allCompleted = categoryExercises.every((ex) => {
          if (ex.id === exerciseId) return updates.completed || false;
          return updatedExercises[ex.id]?.completed || false;
        });

        const updatedHabits = { ...currentLog.habits };
        updatedHabits[habitId] = {
          completed: allCompleted,
          timestamp: allCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
        onUpdateLog({ exercises: updatedExercises, habits: updatedHabits });
        return;
      }
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const handleSetChange = (exerciseId: string, setIndex: number, field: keyof SetLog, value: number | boolean) => {
    const log = getExerciseLog(exerciseId);
    const updatedSets = [...log.sets];
    
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value,
    };

    updateExerciseLog(exerciseId, { sets: updatedSets });

    if (field === "completed") {
      triggerHaptic(value ? "success" : "light");
    } else {
      triggerHaptic("light");
    }
  };

  const handleAddSet = (exerciseId: string) => {
    triggerHaptic("light");
    const log = getExerciseLog(exerciseId);
    const lastSet = log.sets[log.sets.length - 1] || { reps: 10, weight: 0 };
    const updatedSets = [
      ...log.sets,
      { reps: lastSet.reps, weight: lastSet.weight, completed: false },
    ];
    updateExerciseLog(exerciseId, { sets: updatedSets });
  };

  const handleRemoveSet = (exerciseId: string, index: number) => {
    triggerHaptic("warning");
    const log = getExerciseLog(exerciseId);
    const updatedSets = log.sets.filter((_, i) => i !== index);
    updateExerciseLog(exerciseId, { sets: updatedSets });
  };

  // Filter exercises by active category
  const filteredExercises = exercisesList.filter((ex) => ex.category === activeCategory);

  const categoriesList = workoutCategories;

  return (
    <div className="space-y-6">
      {/* Rest Timer Panel (Sticky/Top Floating Alert when active) */}
      {timerTime > 0 && (
        <div className="glass-panel-glow px-6 py-4 rounded-2xl flex items-center justify-between border border-neon-purple/40 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-purple animate-ping"></span>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rest Recovery Timer</div>
              <div className="text-[10px] text-gray-500">For: {exercisesList.find(e => e.id === activeTimerExercise)?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-white font-mono">{timerTime}s</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setTimerTime(0)}
                className="p-1.5 rounded-lg bg-neon-purple/20 border border-neon-purple/30 text-neon-purple cursor-pointer hover:bg-neon-purple/30"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Visual Panel */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between gap-6 overflow-hidden relative">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Discipline Training</h2>
          <p className="text-gray-400 text-xs max-w-sm">
            Select a muscle group to begin. Perform all sets, log your weight and reps, and rest strictly when the timer fires.
          </p>
        </div>
        <div className="hidden sm:block">
          <MuscleVisualizer activeCategory={activeCategory} />
        </div>
      </div>

      {/* Muscle Group Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setExpandedExercise(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? "bg-linear-to-r from-neon-purple to-neon-cyan border-none text-white shadow-lg shadow-neon-purple/15 scale-105"
                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {filteredExercises.map((ex) => {
          const log = getExerciseLog(ex.id);
          const isExpanded = expandedExercise === ex.id;
          const isCompleted = log.completed;

          return (
            <div
              key={ex.id}
              className={`glass-card rounded-2xl transition-all border ${
                isCompleted ? "border-neon-green/20" : "border-white/5"
              }`}
            >
              {/* Exercise Card Header */}
              <div
                onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateExerciseLog(ex.id, { completed: !isCompleted });
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted ? "bg-neon-green" : "border border-white/20"
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-black stroke-[3.5]" />}
                  </button>
                  <div>
                    <h3 className="text-white font-extrabold text-sm sm:text-base">{ex.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 sm:mt-1 font-medium">{ex.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-lg">
                    {ex.defaultSets}×{ex.defaultReps}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-white/5 bg-black/15 space-y-4 rounded-b-2xl">
                  {/* Form Instructions */}
                  <div className="space-y-1.5">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-neon-cyan" /> Correct Execution Form
                    </h4>
                    <ol className="list-decimal pl-4 space-y-1 text-xs text-gray-400 leading-relaxed">
                      {ex.instructions.map((inst, index) => (
                        <li key={index}>{inst}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Log Sets Tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                      <span>Reps & Load Tracker</span>
                      <button
                        onClick={() => handleAddSet(ex.id)}
                        className="flex items-center gap-1 text-[10px] text-neon-cyan hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Set
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {log.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                            set.completed ? "bg-neon-green/5 border border-neon-green/10" : "bg-white/5 border border-white/5"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-gray-500 w-8 sm:w-10">Set {setIdx + 1}</span>

                          {/* Reps Input */}
                          <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => handleSetChange(ex.id, setIdx, "reps", parseInt(e.target.value) || 0)}
                              className="w-full text-center bg-black/40 border border-white/10 rounded-lg px-1 py-1 text-xs text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">reps</span>
                            <span className="text-[10px] text-gray-500 font-medium sm:hidden">r</span>
                          </div>

                          {/* Weight Input */}
                          <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="0"
                              value={set.weight || ""}
                              onChange={(e) => handleSetChange(ex.id, setIdx, "weight", parseFloat(e.target.value) || 0)}
                              className="w-full text-center bg-black/40 border border-white/10 rounded-lg px-1 py-1 text-xs text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">lbs</span>
                            <span className="text-[10px] text-gray-500 font-medium sm:hidden">lb</span>
                          </div>

                          {/* Set Checked */}
                          <button
                            onClick={() => {
                              const done = !set.completed;
                              handleSetChange(ex.id, setIdx, "completed", done);
                              // Trigger rest timer on completing set
                              if (done) {
                                startRestTimer(ex.restTimer, ex.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              set.completed
                                ? "bg-neon-green border-none text-black"
                                : "bg-black/20 border-white/15 text-gray-500 hover:text-white"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                          </button>

                          {/* Remove Set */}
                          <button
                            onClick={() => handleRemoveSet(ex.id, setIdx)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer hover:bg-white/5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Save Section */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Training Notes</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Log weight details, muscle feel, or difficulty..."
                        value={log.notes}
                        onChange={(e) => updateExerciseLog(ex.id, { notes: e.target.value })}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
