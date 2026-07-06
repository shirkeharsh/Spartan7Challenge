import React, { useState } from "react";
import { Users, UserPlus, Key, Clock } from "lucide-react";
import type { UserProfile } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface AddFriendProps {
  currentProfile: UserProfile;
  profilesList: UserProfile[];
  onSendFriendRequest: (targetUserId: string) => Promise<void>;
  onCancelFriendRequest: (targetUserId: string) => Promise<void>;
}

export const AddFriend: React.FC<AddFriendProps> = ({
  currentProfile,
  profilesList,
  onSendFriendRequest,
  onCancelFriendRequest,
}) => {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendFeedback, setFriendFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "warning">("success");

  // Generate friend code for a profile
  const getFriendCode = (p: UserProfile) => {
    const cleanName = p.username.toLowerCase().replace(/[^a-z0-9]/g, "");
    const codePart = p.id.split("_")[1] || "code";
    return `${cleanName}-${codePart.substring(0, 4)}`;
  };

  // Add friend request handler
  const handleAddFriend = async (friendId: string) => {
    triggerHaptic("light");
    const currentFriends = currentProfile.friends || [];
    if (currentFriends.includes(friendId)) return;
    await onSendFriendRequest(friendId);
    showFeedback("Friend request sent!", "success");
  };

  // Cancel friend request handler
  const handleCancelRequest = async (friendId: string) => {
    triggerHaptic("light");
    await onCancelFriendRequest(friendId);
    showFeedback("Friend request cancelled.", "warning");
  };

  const showFeedback = (msg: string, type: "success" | "error" | "warning") => {
    setFriendFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFriendFeedback(""), 4000);
  };

  // Add friend by code input (Real-time backend lookup)
  const handleAddFriendByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = friendCodeInput.trim().toLowerCase();
    if (!code) return;

    triggerHaptic("light");

    if (code === getFriendCode(currentProfile)) {
      triggerHaptic("warning");
      showFeedback("You cannot add yourself as a friend.", "error");
      return;
    }

    try {
      const response = await fetch(`/api/users/by-code/${code}`);
      if (response.ok) {
        const foundProfile = await response.json();
        await handleAddFriend(foundProfile.id);
        triggerHaptic("success");
        setFriendCodeInput("");
      } else {
        triggerHaptic("warning");
        showFeedback(
          "This friend code does not match any registered user on the server.",
          "error"
        );
      }
    } catch (err) {
      console.error("Failed to query friend code:", err);
      triggerHaptic("warning");
      showFeedback("Network error querying profile code.", "error");
    }
  };

  const friendIds = currentProfile.friends || [];
  const friendRequestsSent = currentProfile.friendRequestsSent || [];
  const friendRequestsReceived = currentProfile.friendRequestsReceived || [];

  // Local users who are not already friends and have no requests pending
  const availableLocalUsers = profilesList.filter(
    p => p.id !== currentProfile.id && 
         !friendIds.includes(p.id) && 
         !friendRequestsSent.includes(p.id) && 
         !friendRequestsReceived.includes(p.id)
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="liquid-glass p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-neon-cyan" /> Add Connection
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Grow your accountability loop. Add challengers via code or invite local device profiles.
          </p>
        </div>
      </div>

      {/* Sync Friend Code Banner */}
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
          Provide this code to another challenger so they can send you a friend request.
        </p>
      </div>

      {/* Primary Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Code Input */}
        <form onSubmit={handleAddFriendByCode} className="glass-card p-5 rounded-3xl border border-white/5 space-y-4">
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
            <UserPlus className="w-4 h-4 text-neon-cyan" /> Add Friend by Friend Code
          </h4>
          
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Friend's Sync Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. spartanwarrior-a8f2"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold font-mono uppercase focus:border-neon-cyan"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-neon-cyan/20 border border-neon-cyan/35 text-neon-cyan text-xs font-black hover:bg-neon-cyan/30 cursor-pointer transition-all active:scale-95"
              >
                Send Request
              </button>
            </div>
          </div>

          {friendFeedback && (
            <div className={`p-3 rounded-xl border text-[11px] font-bold leading-relaxed ${
              feedbackType === "success" 
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                : feedbackType === "error" 
                ? "bg-red-950/20 border-red-500/20 text-red-400" 
                : "bg-amber-950/20 border-amber-500/20 text-amber-400"
            }`}>
              {friendFeedback}
            </div>
          )}
        </form>

        {/* Quick Add Local Users */}
        <div className="glass-card p-5 rounded-3xl border border-white/5 flex flex-col space-y-4">
          <div className="space-y-3 flex-1">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Users className="w-4 h-4 text-neon-purple" /> Add Local User as Friend
            </h4>
            {availableLocalUsers.length === 0 ? (
              <p className="text-[10px] text-gray-500 py-4 italic">No other registered accounts are available to add.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 max-h-[110px] overflow-y-auto pr-1">
                {availableLocalUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddFriend(user.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black border border-white/10 cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>+ {user.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {friendRequestsSent.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              <h5 className="text-gray-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neon-yellow" /> Outgoing Requests Pending
              </h5>
              <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
                {profilesList.filter(u => friendRequestsSent.includes(u.id)).map((user) => (
                  <div
                    key={user.id}
                    className="px-3 py-1.5 rounded-xl bg-neon-yellow/10 text-neon-yellow text-[10px] font-black border border-neon-yellow/20 flex items-center gap-2"
                  >
                    <span>{user.username}</span>
                    <button
                      onClick={() => handleCancelRequest(user.id)}
                      className="text-gray-400 hover:text-red-400 transition-all font-bold text-[9px] uppercase cursor-pointer"
                      title="Cancel Request"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
