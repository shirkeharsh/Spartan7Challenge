import React from "react";
import { Sparkles, Trophy, Lock, CheckCircle, Smartphone, Sun, Flame, Dumbbell, Crown, Shield } from "lucide-react";
import type { UserProfile } from "../types";
import { ACHIEVEMENTS } from "../utils/challenge";

interface GamificationProps {
  profile: UserProfile;
}

export const Gamification: React.FC<GamificationProps> = ({ profile }) => {
  const getIcon = (iconName: string, color: string) => {
    const props = { className: `w-7 h-7 ${color}` };
    switch (iconName) {
      case "SmartphoneOff":
        return <Smartphone {...props} />;
      case "Sun":
        return <Sun {...props} />;
      case "Flame":
        return <Flame {...props} />;
      case "Dumbbell":
        return <Dumbbell {...props} />;
      case "Crown":
        return <Crown {...props} />;
      case "Shield":
        return <Shield {...props} />;
      default:
        return <Trophy {...props} />;
    }
  };

  const isUnlocked = (badgeId: string) => profile.badges.includes(badgeId);

  const levelXPThreshold = 500;
  const currentXP = profile.xp % levelXPThreshold;
  const levelProgressPct = Math.round((currentXP / levelXPThreshold) * 100);

  return (
    <div className="space-y-6">
      {/* Level Dashboard Card */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glowing background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl -z-10"></div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-neon-purple/20">
            {profile.level}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Discipline Tier: Level {profile.level}</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Accumulated {profile.xp} XP total. Next Level unlocks at {Math.ceil(profile.xp / 500) * 500} XP.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-1/2 space-y-2 text-left">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-neon-yellow" /> XP Progress
            </span>
            <span>{currentXP} / {levelXPThreshold} XP ({levelProgressPct}%)</span>
          </div>
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-purple transition-all duration-500"
              style={{ width: `${levelProgressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="space-y-4 text-left">
        <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-yellow" />
          Discipline Accomplishments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((badge) => {
            const unlocked = isUnlocked(badge.id);
            const iconColor = unlocked ? "text-neon-cyan" : "text-gray-600";
            const borderStyle = unlocked ? "border-neon-cyan/20 bg-neon-cyan/5" : "border-white/5 bg-black/20 opacity-60";

            return (
              <div
                key={badge.id}
                className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${borderStyle}`}
              >
                {/* Header Icon + Reward */}
                <div className="flex justify-between items-start">
                  <span className={`p-3 rounded-xl ${unlocked ? "bg-neon-cyan/10 border border-neon-cyan/20" : "bg-white/5"}`}>
                    {getIcon(badge.icon, iconColor)}
                  </span>
                  
                  {unlocked ? (
                    <span className="text-[10px] font-black text-neon-green flex items-center gap-1 bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                      <CheckCircle className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm sm:text-base leading-tight">{badge.name}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{badge.description}</p>
                </div>

                {/* Footer Reward Details */}
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-500 uppercase">Reward</span>
                  <span className={unlocked ? "text-neon-cyan" : "text-gray-400"}>+{badge.xpReward} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
