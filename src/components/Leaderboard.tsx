import React, { useState } from "react";
import { Users, Plus, Award, Trash2, Trophy, Flame, Crown, Dumbbell, BookOpen, Heart, Smartphone, UserPlus, UserMinus, Key, Clock } from "lucide-react";
import type { UserProfile } from "../types";

interface LeaderboardProps {
  currentProfile: UserProfile;
  profilesList: UserProfile[];
  onSwitchProfile: (userId: string) => Promise<void>;
  onCreateProfile: (username: string, avatar: string, extra?: Partial<UserProfile>) => Promise<void>;
  onDeleteProfile: (userId: string) => Promise<void>;
  onSendFriendRequest: (targetUserId: string) => Promise<void>;
  onCancelFriendRequest: (targetUserId: string) => Promise<void>;
  onRemoveFriend: (targetUserId: string) => Promise<void>;
}

// Built-in competitor bots
const MOCK_COMPETITORS = [
  { id: "bot_goggins", username: "Goggins_Bot", avatar: "beast", xp: 4850, level: 10, streak: 7, bestStreak: 14, isBot: true },
  { id: "bot_spartan", username: "Spartan_AI", avatar: "spartan", xp: 3200, level: 7, streak: 5, bestStreak: 9, isBot: true },
  { id: "bot_yogi", username: "YogiMaster", avatar: "yogi", xp: 2150, level: 5, streak: 3, bestStreak: 6, isBot: true },
  { id: "bot_scholar", username: "FocusScholar", avatar: "scholar", xp: 1450, level: 3, streak: 2, bestStreak: 4, isBot: true },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentProfile,
  profilesList,
  onSwitchProfile,
  onCreateProfile,
  onDeleteProfile,
  onSendFriendRequest,
  onCancelFriendRequest,
  onRemoveFriend,
}) => {
  // Tabs: "global" | "friends" | "switcher"
  const [boardTab, setBoardTab] = useState<"global" | "friends" | "switcher">("friends");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAge, setNewAge] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("spartan");
  const [waterGoal, setWaterGoal] = useState("3000");
  const [calorieGoal, setCalorieGoal] = useState("2400");
  const [proteinGoal, setProteinGoal] = useState("140");



  const avatarOptions = [
    { id: "spartan", name: "Spartan Athlete", icon: <Dumbbell className="w-5 h-5 text-neon-cyan" /> },
    { id: "yogi", name: "Mindfulness Yogi", icon: <Heart className="w-5 h-5 text-neon-pink" /> },
    { id: "scholar", name: "Academic Scholar", icon: <BookOpen className="w-5 h-5 text-neon-yellow" /> },
    { id: "cypher", name: "Cyber Rebel", icon: <Smartphone className="w-5 h-5 text-neon-purple" /> },
    { id: "beast", name: "Discipline Beast", icon: <Flame className="w-5 h-5 text-neon-orange" /> },
  ];

  const getAvatarIcon = (name: string) => {
    switch (name) {
      case "spartan": return <Dumbbell className="w-4 h-4 text-neon-cyan" />;
      case "yogi": return <Heart className="w-4 h-4 text-neon-pink" />;
      case "scholar": return <BookOpen className="w-4 h-4 text-neon-yellow" />;
      case "cypher": return <Smartphone className="w-4 h-4 text-neon-purple" />;
      case "beast": return <Flame className="w-4 h-4 text-neon-orange" />;
      default: return <Award className="w-4 h-4 text-neon-purple" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    await onCreateProfile(newUsername.trim(), selectedAvatar, {
      age: parseInt(newAge) || undefined,
      waterGoal: parseInt(waterGoal) || 3000,
      calorieGoal: parseInt(calorieGoal) || 2400,
      proteinGoal: parseInt(proteinGoal) || 140,
    });
    setNewUsername("");
    setNewAge("");
    setWaterGoal("3000");
    setCalorieGoal("2400");
    setProteinGoal("140");
    setShowAddForm(false);
    setBoardTab("switcher"); // Go to switcher tab to see the created user
  };

  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete user profile and all associated logs? This action is irreversible.")) {
      await onDeleteProfile(userId);
    }
  };

  // Generate friend code for current profile
  const getFriendCode = (p: UserProfile) => {
    const cleanName = p.username.toLowerCase().replace(/[^a-z0-9]/g, "");
    const codePart = p.id.split("_")[1] || "code";
    return `${cleanName}-${codePart.substring(0, 4)}`;
  };

  // Add friend request handler
  const handleAddFriend = async (friendId: string) => {
    const currentFriends = currentProfile.friends || [];
    if (currentFriends.includes(friendId)) return;
    await onSendFriendRequest(friendId);
  };

  // Cancel friend request handler
  const handleCancelRequest = async (friendId: string) => {
    await onCancelFriendRequest(friendId);
  };

  // Remove friend handler
  const handleRemoveFriend = async (friendId: string) => {
    await onRemoveFriend(friendId);
  };

  // Merge rankings
  const allRankings = [
    ...profilesList.map(u => ({ ...u, isBot: false })),
    ...MOCK_COMPETITORS.map(b => ({ ...b, badges: [] as string[] }))
  ].sort((a, b) => b.xp - a.xp);

  // Filter rankings for friends tab (Only show self + added friends list)
  const friendIds = currentProfile.friends || [];
  const friendRequestsSent = currentProfile.friendRequestsSent || [];
  const friendRequestsReceived = currentProfile.friendRequestsReceived || [];

  const friendRankings = allRankings.filter(u => u.id === currentProfile.id || friendIds.includes(u.id));



  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="z-10 text-center md:text-left">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
            <Trophy className="w-6 h-6 text-neon-yellow" /> Hall of Discipline
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Compare XP metrics, add friends, maintain streaks, and push goals together.
          </p>
        </div>
        <div className="flex gap-2.5 z-10 w-full md:w-auto justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-neon-purple/20 to-neon-cyan/20 border border-neon-purple/30 text-white text-xs font-black hover:scale-102 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register New Profile
          </button>
        </div>
      </div>

      {/* Profile Code Banner */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-neon-cyan">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-neon-cyan/15 text-neon-cyan">
            <Key className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">My Sync Friend Code</div>
            <div className="text-sm font-black text-white uppercase font-mono">{getFriendCode(currentProfile)}</div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 max-w-xs text-center sm:text-right">
          Share this code with other challengers on this app to add each other and see each other's score live.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
        <button
          onClick={() => setBoardTab("friends")}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            boardTab === "friends" ? "bg-neon-purple/20 border border-neon-purple/30 text-white shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-neon-cyan" /> Friend Rankings ({friendRankings.length})
        </button>
        <button
          onClick={() => setBoardTab("global")}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            boardTab === "global" ? "bg-neon-purple/20 border border-neon-purple/30 text-white shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4 text-neon-yellow" /> Global Arena ({allRankings.length})
        </button>
        <button
          onClick={() => setBoardTab("switcher")}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            boardTab === "switcher" ? "bg-neon-purple/20 border border-neon-purple/30 text-white shadow" : "text-gray-400 hover:text-white"
          }`}
        >
          <Award className="w-4 h-4 text-neon-pink" /> Switch Accounts
        </button>
      </div>

      {/* Add User Profile Form */}
      {showAddForm && (
        <div className="glass-card p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">Create New User Profile</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Challenger Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Age</label>
                <input
                  type="number"
                  placeholder="Enter age (e.g. 24)"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Water (ml)</label>
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Calories (kcal)</label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase block">Protein (g)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1.5">Select Avatar Persona</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAvatar(opt.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedAvatar === opt.id
                        ? "bg-white/5 border-white/25 text-white"
                        : "bg-black/20 border-white/5 text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-[9px] font-black uppercase tracking-wider">{opt.name.split(" ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-neon-purple/20 border border-neon-purple/30 hover:bg-neon-purple/35 text-neon-purple text-xs font-black cursor-pointer transition-all"
            >
              Add Challenger Profile
            </button>
          </form>
        </div>
      )}

      {/* Subtab 1: Friend Rankings */}
      {boardTab === "friends" && (
        <div className="space-y-6">
          {/* Friends Scores Grid list */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Users className="w-4 h-4 text-neon-cyan" /> Friends Scoreboard (My Loop)
            </h3>

            {friendRankings.length <= 1 ? (
              <div className="py-12 text-center space-y-2">
                <Users className="w-8 h-8 text-gray-600 mx-auto animate-pulse" />
                <p className="text-xs text-gray-500 italic max-w-xs mx-auto">
                  No friends added yet. Add other local accounts on this phone or input sync friend codes to compare scores!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friendRankings.map((user, idx) => {
                  const isSelf = user.id === currentProfile.id;
                  const rank = idx + 1;
                  const avatar = getAvatarIcon(user.avatar);
                  const isFriend = friendIds.includes(user.id);
                  
                  return (
                    <div
                      key={user.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                        isSelf
                          ? "bg-linear-to-r from-neon-purple/15 to-neon-cyan/15 border-neon-purple/35 text-white"
                          : "bg-black/20 border-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg border border-white/10 text-[10px] font-black bg-white/5 text-gray-400">
                          {rank}
                        </span>

                        <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          {avatar}
                        </span>

                        <div>
                          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            {user.username}
                            {isSelf && <span className="bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[8px] font-black px-1 rounded uppercase">YOU</span>}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold block mt-0.5">
                            Level {user.level} • Streak: {user.streak} days (Best: {user.bestStreak})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{user.xp}</div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">XP</div>
                        </div>

                        {!isSelf && isFriend && (
                          <button
                            onClick={() => handleRemoveFriend(user.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 cursor-pointer transition-all"
                            title="Remove Friend"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 2: Global Arena rankings (local + bots) */}
      {boardTab === "global" && (
        <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
            <Trophy className="w-4 h-4 text-neon-yellow" /> Active Challenge Rankings (Global Arena)
          </h3>

          <div className="space-y-2">
            {allRankings.map((user, idx) => {
              const isSelf = user.id === currentProfile.id;
              const rank = idx + 1;
              const avatar = getAvatarIcon(user.avatar);
              const isFriend = friendIds.includes(user.id);
              
              const rankColor =
                rank === 1
                  ? "bg-neon-yellow/15 border-neon-yellow/30 text-neon-yellow"
                  : rank === 2
                  ? "bg-slate-300/15 border-slate-300/30 text-slate-300"
                  : rank === 3
                  ? "bg-amber-700/15 border-amber-700/30 text-amber-700"
                  : "bg-white/5 border-white/10 text-gray-400";

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    isSelf
                      ? "bg-linear-to-r from-neon-purple/15 to-neon-cyan/15 border-neon-purple/35 text-white"
                      : "bg-black/20 border-white/5 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg border text-[10px] font-black ${rankColor}`}>
                      {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : rank}
                    </span>

                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                      {avatar}
                    </span>

                    <div>
                      <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        {user.username}
                        {isSelf && <span className="bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[8px] font-black px-1 rounded uppercase">YOU</span>}
                        {user.isBot && <span className="bg-white/5 border border-white/10 text-gray-500 text-[8px] font-bold px-1 rounded">BOT</span>}
                      </span>
                      <span className="text-[9px] text-gray-500 font-bold block mt-0.5">
                        Level {user.level} • Streak: {user.streak} days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{user.xp}</div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">XP</div>
                    </div>

                    {!isSelf && !user.isBot && (() => {
                      const isPendingSent = friendRequestsSent.includes(user.id);
                      const isPendingReceived = friendRequestsReceived.includes(user.id);
                      
                      if (isFriend) {
                        return (
                          <button
                            onClick={() => handleRemoveFriend(user.id)}
                            className="p-1.5 rounded-lg border border-neon-cyan/20 bg-neon-cyan/15 text-neon-cyan cursor-pointer transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                            title="Remove Friend"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        );
                      }
                      
                      if (isPendingSent) {
                        return (
                          <button
                            onClick={() => handleCancelRequest(user.id)}
                            className="p-1.5 rounded-lg border border-neon-yellow/20 bg-neon-yellow/15 text-neon-yellow cursor-pointer transition-all hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                            title="Cancel Friend Request"
                          >
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                          </button>
                        );
                      }

                      if (isPendingReceived) {
                        return (
                          <span className="text-[10px] text-neon-purple font-black border border-neon-purple/20 bg-neon-purple/15 px-2.5 py-1.5 rounded-lg">
                            Wants to Add You
                          </span>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white cursor-pointer transition-all"
                          title="Add Friend"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Switch accounts switcher */}
      {boardTab === "switcher" && (
        <div className="space-y-3">
          <h3 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neon-cyan" /> Switch Active Account Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profilesList.map((p) => {
              const isActive = p.id === currentProfile.id;
              return (
                <div
                  key={p.id}
                  onClick={() => !isActive && onSwitchProfile(p.id)}
                  className={`p-4 rounded-3xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-linear-to-r from-neon-purple/20 to-neon-cyan/20 border-neon-purple text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-white/5 border border-white/10">
                      {getAvatarIcon(p.avatar)}
                    </span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                        {p.username}
                        {isActive && <span className="text-neon-cyan font-black text-[9px]">✔</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold mt-0.5">Level {p.level} • {p.xp} XP</div>
                    </div>
                  </div>
                  {!isActive && profilesList.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
