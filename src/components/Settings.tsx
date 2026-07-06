import React, { useState } from "react";
import { Save, Upload, Download, Trash2, Sliders, Database, Smartphone, CheckCircle, User, ShieldAlert } from "lucide-react";
import type { UserProfile, Habit, Exercise, HabitCategory } from "../types";
import dbService from "../services/db";
import { AdminPanel } from "./AdminPanel";

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onResetChallenge: () => void;
  onImportData: (dataString: string) => Promise<void>;
  
  // Embedded Admin Panel properties
  habitsList: Habit[];
  exercisesList: Exercise[];
  quotesList: { text: string; author: string }[];
  missionsList: string[];
  habitCategoriesList: HabitCategory[];
  workoutCategoriesList: string[];
  onSaveCMSContent: (content: {
    habits: Habit[];
    exercises: Exercise[];
    quotes: { text: string; author: string }[];
    missions: string[];
    habitCategories: HabitCategory[];
    workoutCategories: string[];
  }) => Promise<void>;
  onResetToDefaults: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  profile,
  onUpdateProfile,
  onResetChallenge,
  onImportData,
  habitsList,
  exercisesList,
  quotesList,
  missionsList,
  habitCategoriesList,
  workoutCategoriesList,
  onSaveCMSContent,
  onResetToDefaults,
}) => {
  // Settings view toggle tab: "profile" | "admin"
  const [subTab, setSubTab] = useState<"profile" | "admin">("profile");

  // Local state for profile inputs
  const [username, setUsername] = useState(profile.username);
  const [age, setAge] = useState(profile.age || 25);
  const [waterGoal, setWaterGoal] = useState(profile.waterGoal);
  const [calorieGoal, setCalorieGoal] = useState(profile.calorieGoal);
  const [proteinGoal, setProteinGoal] = useState(profile.proteinGoal);
  const [screenTimeGoal, setScreenTimeGoal] = useState(profile.screenTimeGoal);
  const [targetWakeTime, setTargetWakeTime] = useState(profile.targetWakeTime);
  const [targetSleepTime, setTargetSleepTime] = useState(profile.targetSleepTime);
  const [groqApiKey, setGroqApiKey] = useState(profile.groqApiKey || "");

  const [savedSettings, setSavedSettings] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      username,
      age: Number(age) || undefined,
      waterGoal,
      calorieGoal,
      proteinGoal,
      screenTimeGoal,
      targetWakeTime,
      targetSleepTime,
      groqApiKey: groqApiKey.trim(),
    });
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  const handleExportBackup = async () => {
    try {
      const dataStr = await dbService.exportToJSON();
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `discipline_challenge_backup_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error("Backup failed", err);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const contents = event.target?.result as string;
          await onImportData(contents);
          alert("Import successful! App state refreshed.");
          window.location.reload();
        } catch (err) {
          setErrorText("Failed to import. Please check file formatting.");
          console.error("Import failed:", err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleWipeData = () => {
    if (confirm("WARNING: This will permanently wipe all your data, progress, and streaks. Are you sure you want to proceed?")) {
      onResetChallenge();
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Settings Switcher Header */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden select-none">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-neon-purple" /> System Settings
          </h2>
          <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">
            Configure personal targets, manage data exports, or open the Advanced CMS Admin Dashboard.
          </p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSubTab("profile")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === "profile"
                ? "bg-neon-purple/20 border border-neon-purple/30 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" /> My Profile
          </button>
          <button
            onClick={() => setSubTab("admin")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === "admin"
                ? "bg-neon-purple/20 border border-neon-purple/30 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> CMS Admin Panel
          </button>
        </div>
      </div>

      {subTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Settings Form */}
          <form onSubmit={handleSaveSettings} className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/5 space-y-5 text-left">
            <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-neon-cyan" /> Edit My Profile Goals
            </h3>
            <p className="text-[10px] text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-xl">
              💡 These settings are private. Updates will only apply to the current active profile (<span className="text-neon-cyan">{profile.username}</span>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">My Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Daily Water Goal (ml)</label>
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Daily Calorie Target (kcal)</label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Daily Protein Target (g)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Max Screen Time (mins)</label>
                <input
                  type="number"
                  value={screenTimeGoal}
                  onChange={(e) => setScreenTimeGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Target Wake Time (24h)</label>
                <input
                  type="time"
                  value={targetWakeTime}
                  onChange={(e) => setTargetWakeTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Target Sleep Time (24h)</label>
                <input
                  type="time"
                  value={targetSleepTime}
                  onChange={(e) => setTargetSleepTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Groq API Key</label>
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                />
                <span className="text-[9px] text-gray-500 block">
                  Get an API key from Groq Console: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">https://console.groq.com/keys</a>. Used to power the Discipline AI Coach.
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              {savedSettings && (
                <span className="text-neon-green text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Personal targets updated successfully
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-neon-purple to-neon-cyan text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Targets
              </button>
            </div>
          </form>

          {/* Database management */}
          <div className="space-y-6 text-left">
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-neon-purple" /> Data Management
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-gray-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-neon-cyan" /> Export JSON Backup
                </button>

                <label className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-gray-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-neon-purple" /> Import JSON Backup
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                {errorText && <div className="text-red-400 text-[10px] text-center font-bold">{errorText}</div>}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-red-500/20 bg-red-950/5 space-y-4">
              <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-400" /> Hazard Zone
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Wiping database will clear streaks, logs, profile data, and photos. This cannot be undone.
              </p>

              <button
                onClick={handleWipeData}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" /> Wipe Entire Database
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-2 sm:p-5 rounded-3xl border border-white/5">
          <p className="text-xs text-gray-500 text-left mb-4 bg-white/5 p-3 rounded-xl">
            ⚙️ **Advanced CMS mode**: Modify global exercises list, habit categories, daily quotes, and missions. Custom items will apply as template defaults when seeding new user challenges.
          </p>
          <AdminPanel
            habitsList={habitsList}
            exercisesList={exercisesList}
            quotesList={quotesList}
            missionsList={missionsList}
            habitCategoriesList={habitCategoriesList}
            workoutCategoriesList={workoutCategoriesList}
            onSaveContent={onSaveCMSContent}
            onResetToDefaults={onResetToDefaults}
          />
        </div>
      )}
    </div>
  );
};
