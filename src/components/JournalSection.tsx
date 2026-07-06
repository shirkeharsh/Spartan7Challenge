import React, { useState } from "react";
import { BookOpen, Smile, Zap, Save, CheckCircle } from "lucide-react";
import type { DayLog } from "../types";

interface JournalSectionProps {
  currentLog: DayLog;
  onUpdateLog: (log: Partial<DayLog>) => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  currentLog,
  onUpdateLog,
}) => {
  const [well, setWell] = useState(() => currentLog.journal.well || "");
  const [distracted, setDistracted] = useState(() => currentLog.journal.distracted || "");
  const [improve, setImprove] = useState(() => currentLog.journal.improve || "");
  const [energy, setEnergy] = useState(() => currentLog.journal.energy || 5);
  const [mood, setMood] = useState(() => currentLog.journal.mood || 5);
  const [saved, setSaved] = useState(() => currentLog.journal.completed || false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const journalUpdate = {
      well,
      distracted,
      improve,
      energy,
      mood,
      completed: true,
    };

    // Auto-update the "Journal completed" habit
    const updatedHabits = { ...currentLog.habits };
    updatedHabits["journal_completed"] = { completed: true };

    onUpdateLog({
      journal: journalUpdate,
      habits: updatedHabits,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Daily Journal Review</h2>
          <p className="text-gray-400 text-xs max-w-sm">
            Evaluate your performance. Honestly review your daily successes, failures, distractions, and mental status.
          </p>
        </div>
        <span className="p-3 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl text-neon-cyan">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Review Questions */}
        <form onSubmit={handleSave} className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/5 space-y-5 text-left">
          <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider">Mindful Review</h3>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-bold">1. What did I do well today?</label>
            <textarea
              value={well}
              onChange={(e) => setWell(e.target.value)}
              placeholder="e.g. Woke up at 5am, stayed persistent during chest workout, read 20 pages."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-neon-cyan min-h-[70px] resize-y"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-bold">2. What distracted or tempted me?</label>
            <textarea
              value={distracted}
              onChange={(e) => setDistracted(e.target.value)}
              placeholder="e.g. Scrolled on social media for 20 mins, felt laziness in afternoon."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-neon-cyan min-h-[70px] resize-y"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-bold">3. What will I improve tomorrow?</label>
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="e.g. Keep my phone in another room, start stretching exactly after cardio."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-neon-cyan min-h-[70px] resize-y"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {saved && (
              <span className="text-neon-green text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Log Entry Saved Successfully
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Journal Entry
            </button>
          </div>
        </form>

        {/* Energy & Mood Levels */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-6 text-left">
          <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider">Mind Metrics</h3>

          {/* Energy Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-neon-yellow" /> Physical & Mental Energy
              </span>
              <span className="text-white text-sm">{energy} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-neon-yellow"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase">
              <span>Depleted</span>
              <span>Optimal</span>
            </div>
          </div>

          {/* Mood Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-neon-cyan" /> Mind Calmness / Mood
              </span>
              <span className="text-white text-sm">{mood} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full accent-neon-cyan"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase">
              <span>Frustrated</span>
              <span>Peaceful</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-400 leading-relaxed">
            <strong className="text-white block mb-1">Coach Tip:</strong>
            Reflecting at the end of the day is a core discipline habit. Track your patterns to spot when you are most prone to breaking discipline.
          </div>
        </div>
      </div>
    </div>
  );
};
