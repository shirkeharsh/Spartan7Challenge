import React, { useState } from "react";
import { AlertOctagon, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import type { DayLog, UserProfile, PenaltyTask } from "../types";

interface PunishmentSystemProps {
  currentLog: DayLog;
  profile: UserProfile;
  onUpdateLog: (log: Partial<DayLog>) => void;
  onAddXP: (xp: number) => void;
}

export const PunishmentSystem: React.FC<PunishmentSystemProps> = ({
  currentLog,
  onUpdateLog,
  onAddXP,
}) => {
  const [selectedPenaltyType, setSelectedPenaltyType] = useState<PenaltyTask["penaltyType"]>("pushups");
  const [customQty, setCustomQty] = useState("");

  // Add penalty task to current day's log
  const handleAddPenalty = (e: React.FormEvent) => {
    e.preventDefault();

    let qty = parseInt(customQty);
    let qtyUnit = "";
    let name = "";
    
    if (selectedPenaltyType === "pushups") {
      qty = qty || 50;
      qtyUnit = "reps";
      name = "Extra Push-ups";
    } else if (selectedPenaltyType === "walking") {
      qty = qty || 3000;
      qtyUnit = "steps";
      name = "Extra Walking Steps";
    } else if (selectedPenaltyType === "reading") {
      qty = qty || 10;
      qtyUnit = "pages";
      name = "Additional Reading";
    } else if (selectedPenaltyType === "stretching") {
      qty = qty || 15;
      qtyUnit = "minutes";
      name = "Extra Full Body Stretch";
    }

    const newPenalty: PenaltyTask = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: `Redeem your discipline code by completing ${qty} ${qtyUnit} of ${selectedPenaltyType}.`,
      penaltyType: selectedPenaltyType,
      quantity: qty,
      completed: false,
    };

    onUpdateLog({
      penalties: [...currentLog.penalties, newPenalty],
    });
    setCustomQty("");
  };

  const handleCompletePenalty = (id: string) => {
    const updatedPenalties = currentLog.penalties.map((p) => {
      if (p.id === id) {
        return { ...p, completed: true };
      }
      return p;
    });

    onUpdateLog({
      penalties: updatedPenalties,
      // Clear one warning if completed
      warnings: currentLog.warnings.slice(1),
    });

    // Reward XP for rehabilitation
    onAddXP(50);
  };

  // Helper check for warning counts
  const incompleteHabitCount = Object.values(currentLog.habits).filter((h) => !h.completed).length;

  return (
    <div className="space-y-6">
      {/* 1. Status Warning Alert panel */}
      {incompleteHabitCount > 15 ? (
        <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <span className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </span>
            <div>
              <h3 className="text-red-400 font-extrabold text-lg">DISCIPLINE BROKEN</h3>
              <p className="text-gray-400 text-xs mt-1">
                You have {incompleteHabitCount} incomplete habits. Complete your mission tasks before sleeping!
              </p>
            </div>
          </div>
          <div className="text-xs font-black text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
            CRITICAL WARNING
          </div>
        </div>
      ) : incompleteHabitCount > 5 ? (
        <div className="p-6 rounded-3xl bg-orange-950/40 border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <span className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl">
              <AlertOctagon className="w-8 h-8" />
            </span>
            <div>
              <h3 className="text-orange-400 font-extrabold text-lg">WARNING: ATTENTION NEEDED</h3>
              <p className="text-gray-400 text-xs mt-1">
                Multiple checklist items are pending. Re-focus and execute before the day closes.
              </p>
            </div>
          </div>
          <div className="text-xs font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
            SLIPPING BEHIND
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <span className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl">
              <CheckCircle className="w-8 h-8" />
            </span>
            <div>
              <h3 className="text-emerald-400 font-extrabold text-lg">IRON SHIELD ACTIVE</h3>
              <p className="text-gray-400 text-xs mt-1">
                Your discipline is currently solid. Keep crushing tasks to maintain your streak.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Create Penalty vs Active Penalties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Penalty (Form) */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 text-left">
          <h3 className="text-white font-extrabold text-sm sm:text-base">Rehabilitation Penalties</h3>
          <p className="text-gray-400 text-xs">
            If you broke discipline (unnecessary scrolling, missed workout, junk food), choose a self-inflicted physical or mental penalty to recover.
          </p>

          <form onSubmit={handleAddPenalty} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase">Penalty Type</label>
              <select
                value={selectedPenaltyType}
                onChange={(e) => setSelectedPenaltyType(e.target.value as PenaltyTask["penaltyType"])}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple cursor-pointer"
              >
                <option value="pushups">Extra Push-ups (Reps)</option>
                <option value="walking">Extra Walking (Steps)</option>
                <option value="reading">Additional Reading (Pages)</option>
                <option value="stretching">Extra Stretching (Mins)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase">Quantity (Optional)</label>
              <input
                type="number"
                placeholder={
                  selectedPenaltyType === "pushups"
                    ? "Default: 50 reps"
                    : selectedPenaltyType === "walking"
                    ? "Default: 3000 steps"
                    : selectedPenaltyType === "reading"
                    ? "Default: 10 pages"
                    : "Default: 15 mins"
                }
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-md"
            >
              Commit to Penalty Task
            </button>
          </form>
        </div>

        {/* Right: Logged Active Penalties list */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-white/5 space-y-4 text-left">
          <h3 className="text-white font-extrabold text-sm sm:text-base">Active Commitment Board</h3>
          {currentLog.penalties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <span className="p-3 bg-white/5 rounded-full border border-white/10 text-gray-500">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <p className="text-gray-500 text-xs text-center">No active penalties committed. Keep executing.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {currentLog.penalties.map((penalty) => (
                <div
                  key={penalty.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border ${
                    penalty.completed
                      ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-950/10 border-red-500/20 text-white"
                  }`}
                >
                  <div className="space-y-1 text-left">
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${penalty.completed ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      {penalty.name} ({penalty.quantity})
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{penalty.description}</p>
                  </div>

                  <div className="w-full sm:w-auto pt-2.5 sm:pt-0 sm:pl-4">
                    {penalty.completed ? (
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" /> Redeemed (+50 XP)
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCompletePenalty(penalty.id)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        Log Completed <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
