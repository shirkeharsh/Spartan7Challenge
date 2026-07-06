import React, { useState } from "react";
import { Flame, Dumbbell, Heart, BookOpen, Smartphone, User, Sparkles } from "lucide-react";
import type { UserProfile } from "../types";

interface OnboardingScreenProps {
  onCreateProfile: (username: string, avatar: string, extra?: Partial<UserProfile>) => Promise<void>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onCreateProfile }) => {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("24");
  const [selectedAvatar, setSelectedAvatar] = useState("spartan");
  const [waterGoal, setWaterGoal] = useState("3000");
  const [calorieGoal, setCalorieGoal] = useState("2400");
  const [proteinGoal, setProteinGoal] = useState("140");
  const [screenGoal, setScreenGoal] = useState("120");
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarOptions = [
    { id: "spartan", name: "Spartan Athlete", desc: "For raw physical lifting", icon: <Dumbbell className="w-5 h-5 text-neon-cyan" /> },
    { id: "yogi", name: "Mindfulness Yogi", desc: "For breath & focus control", icon: <Heart className="w-5 h-5 text-neon-pink" /> },
    { id: "scholar", name: "Academic Scholar", desc: "For study & coding focus", icon: <BookOpen className="w-5 h-5 text-neon-yellow" /> },
    { id: "cypher", name: "Cyber Rebel", desc: "For strict screen control", icon: <Smartphone className="w-5 h-5 text-neon-purple" /> },
    { id: "beast", name: "Discipline Beast", desc: "All round extreme challenge", icon: <Flame className="w-5 h-5 text-neon-orange" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateProfile(username.trim(), selectedAvatar, {
        age: parseInt(age) || 24,
        waterGoal: parseInt(waterGoal) || 3000,
        calorieGoal: parseInt(calorieGoal) || 2400,
        proteinGoal: parseInt(proteinGoal) || 140,
        screenTimeGoal: parseInt(screenGoal) || 120,
        targetWakeTime: wakeTime,
        targetSleepTime: sleepTime,
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-[#f3f4f6] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Visual background lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-2xl bg-rgba(17, 18, 25, 0.75) backdrop-blur-xl border border-white/8 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Banner header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-neon-purple/10 border border-neon-purple/35 text-neon-purple mb-1">
            <Flame className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">Initialize Discipline</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Welcome to the 7-Day Hardcore Challenge. Set up your biological profile and training limits to begin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. SpartanWarrior"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none font-bold"
                  required
                />
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Age</label>
              <input
                type="number"
                placeholder="24"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none text-center font-bold"
                required
              />
            </div>
          </div>

          {/* Preset avatar select widget */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Select Persona Avatar</label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {avatarOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAvatar(opt.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    selectedAvatar === opt.id
                      ? "bg-neon-purple/15 border-neon-purple text-white shadow-lg"
                      : "bg-black/20 border-white/5 text-gray-500 hover:bg-white/5"
                  }`}
                >
                  {opt.icon}
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">{opt.name.split(" ")[1]}</span>
                  <span className="text-[8px] text-gray-600 font-medium hidden sm:block leading-none mt-0.5">{opt.desc.split(" ")[2]} focus</span>
                </button>
              ))}
            </div>
          </div>

          {/* Biological Limits configuration */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-neon-yellow" /> Challenge Target Quantities
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Water Goal (ml)</label>
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Calorie Limit (kcal)</label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Protein Goal (g)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold uppercase">Screen Limit (mins)</label>
                <input
                  type="number"
                  value={screenGoal}
                  onChange={(e) => setScreenGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Wake & sleep times */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-bold uppercase block">Target Wake Up Clock</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-bold uppercase block">Target Sleep Clock</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-linear-to-r from-neon-purple to-neon-cyan text-white text-xs font-black uppercase tracking-widest hover:scale-102 transition-all cursor-pointer shadow-lg disabled:opacity-40"
          >
            {isSubmitting ? "Generating vault logs..." : "Commit to the 7-Day Challenge"}
          </button>
        </form>
      </div>
    </div>
  );
};
