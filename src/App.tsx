import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Activity,
  BookOpen,
  Sliders,
  ShieldAlert,
  Bell,
  X,
  Flame,
  Award,
  Trophy,
  ClipboardCheck,
  Moon,
  Sun,
  Dumbbell,
  UserPlus,
  Sparkles,
  Brain
} from "lucide-react";

import type { DayLog, UserProfile, Habit, Exercise, HabitCategory, NotificationItem } from "./types";
import { dbService } from "./services/db";
import { NotificationService } from "./services/notifications";
import { getInitialDayLog, calculateDisciplineScore, checkAchievements, ACHIEVEMENTS, HABITS_LIST, DAILY_QUOTES, DAILY_MISSIONS, DEFAULT_HABIT_CATEGORIES, DEFAULT_WORKOUT_CATEGORIES } from "./utils/challenge";
import { triggerHaptic } from "./utils/haptics";
import { EXERCISES } from "./data/exercises";

// Component imports
import { Dashboard } from "./components/Dashboard";
import { AIChat } from "./components/AIChat";
import { HabitTracker } from "./components/HabitTracker";
import { WorkoutSection } from "./components/WorkoutSection";
import { NutritionSection } from "./components/NutritionSection";
import { JournalSection } from "./components/JournalSection";
import { Analytics } from "./components/Analytics";
import { Gamification } from "./components/Gamification";
import { PunishmentSystem } from "./components/PunishmentSystem";
import { Settings } from "./components/Settings";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { Leaderboard } from "./components/Leaderboard";
import { AddFriend } from "./components/AddFriend";
import { TestTrialRunner } from "./components/TestTrialRunner";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { CreditsScreen } from "./components/CreditsScreen";
import { RemindersSection } from "./components/RemindersSection";

const DEFAULT_PROFILE: UserProfile = {
  id: "user_spartan_1",
  username: "Spartan_Warrior",
  avatar: "spartan",
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  badges: [],
  waterGoal: 3000,
  calorieGoal: 2400,
  proteinGoal: 140,
  screenTimeGoal: 120,
  targetWakeTime: "06:00",
  targetSleepTime: "22:00",
  theme: "dark",
};

function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCredits, setShowCredits] = useState(true);
  
  // Multi-user & preferences state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  
  const [activeDayIndex, setActiveDayIndex] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "warning" } | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Reminders / Notification Log
  const [reminders, setReminders] = useState<{ time: string; msg: string; type: string }[]>([]);

  // CMS Content States
  const [habitsList, setHabitsList] = useState<Habit[]>([]);
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [quotesList, setQuotesList] = useState<{ text: string; author: string }[]>([]);
  const [missionsList, setMissionsList] = useState<string[]>([]);
  const [habitCategoriesList, setHabitCategoriesList] = useState<HabitCategory[]>([]);
  const [workoutCategoriesList, setWorkoutCategoriesList] = useState<string[]>([]);

  // 1. Initial State Load from IndexedDB supporting Multi-users
  useEffect(() => {
    async function loadData() {
      try {
        const usersList = await dbService.getAllUsers();
        const activeId = await dbService.getActiveUserId();

        // Load custom CMS content
        let customHabits = await dbService.getState<Habit[]>("custom_habits");
        let customExercises = await dbService.getState<Exercise[]>("custom_exercises");
        let customQuotes = await dbService.getState<{ text: string; author: string }[]>("custom_quotes");
        let customMissions = await dbService.getState<string[]>("custom_missions");
        let customHabitCategories = await dbService.getState<HabitCategory[]>("custom_habit_categories");
        let customWorkoutCategories = await dbService.getState<string[]>("custom_workout_categories");

        if (!customHabits) {
          customHabits = HABITS_LIST;
          await dbService.saveState("custom_habits", HABITS_LIST);
        }
        if (!customExercises) {
          customExercises = EXERCISES;
          await dbService.saveState("custom_exercises", EXERCISES);
        }
        if (!customQuotes) {
          customQuotes = DAILY_QUOTES;
          await dbService.saveState("custom_quotes", DAILY_QUOTES);
        }
        if (!customMissions) {
          customMissions = DAILY_MISSIONS;
          await dbService.saveState("custom_missions", DAILY_MISSIONS);
        }
        if (!customHabitCategories) {
          customHabitCategories = DEFAULT_HABIT_CATEGORIES;
          await dbService.saveState("custom_habit_categories", DEFAULT_HABIT_CATEGORIES);
        }
        if (!customWorkoutCategories) {
          customWorkoutCategories = DEFAULT_WORKOUT_CATEGORIES;
          await dbService.saveState("custom_workout_categories", DEFAULT_WORKOUT_CATEGORIES);
        }

        setHabitsList(customHabits);
        setExercisesList(customExercises);
        setQuotesList(customQuotes);
        setMissionsList(customMissions);
        setHabitCategoriesList(customHabitCategories);
        setWorkoutCategoriesList(customWorkoutCategories);

        if (usersList.length === 0) {
          setShowOnboarding(true);
          setLoading(false);
          return;
        }

        const activeUser = usersList.find((u) => u.id === activeId) || usersList[0];
        let loadedLogs = await dbService.getAllDayLogsForUser(activeUser.id);

        // Initialize 7 days of logs for this user if missing
        if (loadedLogs.length === 0) {
          const initLogs: DayLog[] = [];
          for (let i = 1; i <= 7; i++) {
            const tempDate = new Date();
            tempDate.setDate(tempDate.getDate() + (i - 1));
            const dateStr = tempDate.toISOString().split("T")[0];
            const baseLog = getInitialDayLog(activeUser.id, i, dateStr);
            const log: DayLog = {
              ...baseLog,
              id: `${activeUser.id}_${i}`,
              userId: activeUser.id,
            };
            await dbService.saveDayLog(log);
            initLogs.push(log);
          }
          loadedLogs = initLogs;
        }

        setProfiles(usersList);
        setProfile(activeUser);
        setDayLogs(loadedLogs);

        // Calculate active day based on challenge start date
        if (activeUser.challengeStartDate) {
          const start = new Date(activeUser.challengeStartDate);
          const today = new Date();
          const diffTime = today.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const currentDay = Math.min(7, Math.max(1, diffDays));
          setActiveDayIndex(currentDay);
        } else {
          setActiveDayIndex(1);
        }
        setLoading(false);
      } catch (err) {
        console.error("Database loading error:", err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Real-time synchronization loop (every 5 seconds)
  useEffect(() => {
    const currentProfileId = profileRef.current?.id;
    if (!currentProfileId) return;

    let isSubscribed = true;

    const syncWithServer = async () => {
      try {
        // 1. Sync current profile to server (push local changes)
        const syncResponse = await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileRef.current),
        });

        // 2. Fetch fresh user profiles from server (other users' streaks/XP)
        const usersResponse = await fetch("/api/users");
        if (usersResponse.ok && isSubscribed) {
          const freshProfiles = await usersResponse.json();
          setProfiles(prev => {
            // Merge local and server profiles
            const merged = [...prev];
            freshProfiles.forEach((srv: UserProfile) => {
              const idx = merged.findIndex(p => p.id === srv.id);
              if (idx > -1) {
                // If it is the current user, merge carefully (respecting local changes not synced yet,
                // but updating server-side notifications/relations)
                if (srv.id === profileRef.current.id) {
                  merged[idx] = {
                    ...merged[idx],
                    friends: srv.friends || [],
                    friendRequestsSent: srv.friendRequestsSent || [],
                    friendRequestsReceived: srv.friendRequestsReceived || [],
                    notifications: srv.notifications || []
                  };
                } else {
                  merged[idx] = srv;
                }
              } else {
                merged.push(srv);
              }
            });
            return merged;
          });
        }

        // 3. Update current user's profile state if server notifications or relations updated
        if (syncResponse.ok && isSubscribed) {
          const syncData = await syncResponse.json();
          if (syncData.profile) {
            setProfile(prev => {
              if (!prev) return prev;
              // Check if anything changed on server side (e.g. notifications or friends)
              const hasNewNotifs = JSON.stringify(prev.notifications) !== JSON.stringify(syncData.profile.notifications);
              const hasNewFriends = JSON.stringify(prev.friends) !== JSON.stringify(syncData.profile.friends);
              const hasNewSent = JSON.stringify(prev.friendRequestsSent) !== JSON.stringify(syncData.profile.friendRequestsSent);
              const hasNewReceived = JSON.stringify(prev.friendRequestsReceived) !== JSON.stringify(syncData.profile.friendRequestsReceived);

              if (hasNewNotifs || hasNewFriends || hasNewSent || hasNewReceived) {
                const mergedProfile = {
                  ...prev,
                  friends: syncData.profile.friends || [],
                  friendRequestsSent: syncData.profile.friendRequestsSent || [],
                  friendRequestsReceived: syncData.profile.friendRequestsReceived || [],
                  notifications: syncData.profile.notifications || []
                };
                dbService.saveUserProfile(mergedProfile);
                return mergedProfile;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn("Real-time sync failed:", err);
      }
    };

    // Run immediately and then poll
    syncWithServer();
    const interval = setInterval(syncWithServer, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [profile?.id]);

  // Sync theme class tags on body/html element dynamically
  useEffect(() => {
    document.body.classList.remove("light", "dark", "liquid-glass");
    document.documentElement.classList.remove("light", "dark", "liquid-glass");
    
    const currentTheme = profile.theme || "dark";
    document.body.classList.add(currentTheme);
    document.documentElement.classList.add(currentTheme);
  }, [profile.theme]);

  // 2. Scheduled Reminders / Push Notifications Scheduler
  useEffect(() => {
    if (!profile.challengeStartDate) return;

    // Check clock every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const currentHourMin = now.toTimeString().slice(0, 5); // HH:MM
      
      const newReminders: typeof reminders = [];

      if (currentHourMin === profile.targetWakeTime) {
        newReminders.push({ time: currentHourMin, msg: "Wake up on time! Get out of bed immediately. No phone first hour.", type: "wake" });
      } else if (currentHourMin === "08:00") {
        newReminders.push({ time: currentHourMin, msg: "Time for breakfast. Keep it clean and high protein.", type: "breakfast" });
      } else if (currentHourMin === "10:30") {
        newReminders.push({ time: currentHourMin, msg: "Training reminder. Execute your dumbbell or bodyweight workout split.", type: "workout" });
      } else if (currentHourMin === "13:00") {
        newReminders.push({ time: currentHourMin, msg: "Lunch time. Hit your macro splits.", type: "lunch" });
      } else if (now.getHours() % 2 === 0 && now.getMinutes() === 0) {
        newReminders.push({ time: currentHourMin, msg: "Hydration alert. Drink 250ml water now.", type: "water" });
      } else if (currentHourMin === "19:00") {
        newReminders.push({ time: currentHourMin, msg: "Time for dinner. Avoid sugar or junk.", type: "dinner" });
      } else if (currentHourMin === profile.targetSleepTime) {
        newReminders.push({ time: currentHourMin, msg: "Sleep schedule active. Log screen time, complete your journal and sleep.", type: "sleep" });
      }

      if (newReminders.length > 0) {
        setReminders((prev) => [...newReminders, ...prev].slice(0, 10));
        setToastMessage({
          title: "Discipline Alert",
          desc: newReminders[0].msg,
          type: "warning",
        });

        // Trigger PWA Alert for iOS PWA standalone / Android PWA
        NotificationService.triggerLocalNotification("7 Days of Discipline", newReminders[0].msg);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [profile.challengeStartDate, profile.targetWakeTime, profile.targetSleepTime]);

  const requestNotificationPermission = async () => {
    const response = await NotificationService.requestPermission();
    if (response === "granted") {
      setToastMessage({
        title: "Alerts Enabled",
        desc: "iOS and Android notification triggers are now active.",
        type: "success",
      });
      NotificationService.triggerLocalNotification("Discipline Vault Active", "Challenger reminders synchronized.");
    }
  };

  // Helper to save profile locally and sync to backend server immediately
  const saveProfileAndSync = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    await dbService.saveUserProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
    } catch (err) {
      console.warn("Immediate server sync failed:", err);
    }
  };

  // 3. User Switcher actions
  const handleSwitchUser = async (userId: string) => {
    await dbService.setActiveUserId(userId);
    const users = await dbService.getAllUsers();
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    let loadedLogs = await dbService.getAllDayLogsForUser(userId);

    // Initialize logs if missing
    if (loadedLogs.length === 0) {
      const initLogs: DayLog[] = [];
      for (let i = 1; i <= 7; i++) {
        const tempDate = new Date();
        tempDate.setDate(tempDate.getDate() + (i - 1));
        const dateStr = tempDate.toISOString().split("T")[0];
        const baseLog = getInitialDayLog(userId, i, dateStr);
        const log: DayLog = {
          ...baseLog,
          id: `${userId}_${i}`,
          userId: userId,
        };
        await dbService.saveDayLog(log);
        initLogs.push(log);
      }
      loadedLogs = initLogs;
    }

    setProfiles(users);
    setProfile(targetUser);
    setDayLogs(loadedLogs);
    
    // Calculate active day based on target user's challenge start date
    if (targetUser.challengeStartDate) {
      const start = new Date(targetUser.challengeStartDate);
      const today = new Date();
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const currentDay = Math.min(7, Math.max(1, diffDays));
      setActiveDayIndex(currentDay);
    } else {
      setActiveDayIndex(1);
    }
    setActiveTab("dashboard");

    setToastMessage({
      title: "User Profile Changed",
      desc: `Active Challenger: ${targetUser.username}. Swapped day logs.`,
      type: "success",
    });

    // Notify user about unread friend updates / notifications
    const unreadCount = targetUser.notifications?.filter((n: NotificationItem) => !n.read).length || 0;
    if (unreadCount > 0) {
      setTimeout(() => {
        setToastMessage({
          title: "Unread Notifications",
          desc: `You have ${unreadCount} new notification(s). Click the notification bell to view.`,
          type: "success",
        });
        NotificationService.triggerLocalNotification(
          "Discipline Vault Alerts",
          `You have ${unreadCount} new friend/system update(s) waiting for you.`
        );
      }, 800);
    }
  };

  const handleCreateUser = async (username: string, avatar: string, extra?: Partial<UserProfile>) => {
    const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: UserProfile = {
      id: newId,
      username,
      age: extra?.age || 25,
      avatar,
      xp: 0,
      level: 1,
      streak: 0,
      bestStreak: 0,
      badges: [],
      waterGoal: extra?.waterGoal || 3000,
      calorieGoal: extra?.calorieGoal || 2400,
      proteinGoal: extra?.proteinGoal || 140,
      screenTimeGoal: extra?.screenTimeGoal || 120,
      targetWakeTime: extra?.targetWakeTime || "06:00",
      targetSleepTime: extra?.targetSleepTime || "22:00",
      theme: "dark",
      notifications: [],
    };

    await dbService.saveUserProfile(newProfile);
    await handleSwitchUser(newId);
    setShowOnboarding(false);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch("/api/users/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.warn("Failed to wipe user on server:", err);
    }

    await dbService.deleteUser(userId);
    const users = await dbService.getAllUsers();
    setProfiles(users);

    if (profile.id === userId) {
      const nextUser = users[0];
      if (nextUser) {
        await handleSwitchUser(nextUser.id);
      }
    }
  };

  const handleToggleTheme = async () => {
    let nextTheme: "dark" | "light" | "liquid-glass";
    if (profile.theme === "light") {
      nextTheme = "dark";
    } else if (profile.theme === "dark") {
      nextTheme = "liquid-glass";
    } else {
      nextTheme = "light";
    }
    
    const updatedProfile: UserProfile = { ...profile, theme: nextTheme };
    await saveProfileAndSync(updatedProfile);

    setToastMessage({
      title: "Theme Mode Changed",
      desc: `Visual workspace switched to ${nextTheme === "liquid-glass" ? "Liquid Glass" : nextTheme} theme.`,
      type: "success",
    });
  };

  // 4. Start Challenge action
  const handleStartChallenge = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Update logs dates starting from today
    const updatedLogs = dayLogs.map((log) => {
      const d = new Date();
      d.setDate(d.getDate() + (log.dayNumber - 1));
      return {
        ...log,
        date: d.toISOString().split("T")[0],
      };
    });

    const updatedProfile = {
      ...profile,
      challengeStartDate: todayStr,
      streak: 1,
    };

    setDayLogs(updatedLogs);
    setActiveDayIndex(1);
    await saveProfileAndSync(updatedProfile);

    for (const log of updatedLogs) {
      await dbService.saveDayLog(log);
    }

    setToastMessage({
      title: "Challenge Initiated",
      desc: "Day 1 has officially begun. Stand strong.",
      type: "success",
    });

    requestNotificationPermission();
  };

  // 5. Update Current Day's Log helper
  const handleUpdateLog = async (updates: Partial<DayLog>) => {
    triggerHaptic("medium");
    const updatedProfile = { ...profile };
    let profileChanged = false;

    const updatedLogs = dayLogs.map((log) => {
      if (log.dayNumber === activeDayIndex) {
        const temp = { ...log, ...updates };
        temp.disciplineScore = calculateDisciplineScore(temp, habitsList, habitCategoriesList);

        // Auto calculate warnings
        const incompleteCount = Object.values(temp.habits).filter((h) => !h.completed).length;
        const warnings = [];
        if (incompleteCount > 15) {
          warnings.push("Mission Failed");
        } else if (incompleteCount > 5) {
          warnings.push("You Broke Discipline");
        }
        temp.warnings = warnings;

        // Auto grant XP based on completed habits diff
        const oldCompleted = Object.values(log.habits).filter((h) => h.completed).length;
        const newCompleted = Object.values(temp.habits).filter((h) => h.completed).length;
        const diff = newCompleted - oldCompleted;
        if (diff !== 0) {
          temp.xpEarned = Math.max(0, temp.xpEarned + diff * 10);
        }

        return temp;
      }
      return log;
    });

    setDayLogs(updatedLogs);
    const activeLog = updatedLogs.find((l) => l.dayNumber === activeDayIndex)!;
    await dbService.saveDayLog(activeLog);

    // Calculate XP updates
    const logXp = activeLog.xpEarned;
    const oldLogXp = dayLogs.find((l) => l.dayNumber === activeDayIndex)?.xpEarned || 0;
    const xpDiff = logXp - oldLogXp;

    if (xpDiff !== 0) {
      const newXp = updatedProfile.xp + xpDiff;
      const newLevel = Math.floor(newXp / 500) + 1;
      
      if (newLevel > updatedProfile.level) {
        triggerHaptic("success");
        setToastMessage({
          title: "LEVEL UP!",
          desc: `Congratulations! You unlocked Tier Level ${newLevel}. Keep moving.`,
          type: "success",
        });
      }
      updatedProfile.xp = newXp;
      updatedProfile.level = newLevel;
      profileChanged = true;
    }

    // Check achievements
    const newlyUnlocked = checkAchievements(updatedLogs, updatedProfile);
    if (newlyUnlocked.length > 0) {
      triggerHaptic("success");
      let earnedXP = 0;
      newlyUnlocked.forEach((badgeId) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === badgeId);
        if (ach) earnedXP += ach.xpReward;
      });

      const nextXp = updatedProfile.xp + earnedXP;
      updatedProfile.badges = [...updatedProfile.badges, ...newlyUnlocked];
      updatedProfile.xp = nextXp;
      updatedProfile.level = Math.floor(nextXp / 500) + 1;
      profileChanged = true;

      setToastMessage({
        title: "ACHIEVEMENT UNLOCKED!",
        desc: `Unlocked: ${newlyUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name).join(", ")}. +${earnedXP} XP!`,
        type: "success",
      });
    }

    if (profileChanged) {
      await saveProfileAndSync(updatedProfile);
    }
  };

  // Add custom XP reward
  const handleAddXP = async (amount: number) => {
    triggerHaptic("success");
    const newXp = profile.xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    const updatedProfile = { ...profile, xp: newXp, level: newLevel };
    await saveProfileAndSync(updatedProfile);
  };

  // Reset challenge fully for the current user only
  const handleResetChallenge = async () => {
    triggerHaptic("warning");
    const resetProfile: UserProfile = { 
      ...DEFAULT_PROFILE, 
      id: profile.id, 
      username: profile.username,
      avatar: profile.avatar || "spartan",
      theme: profile.theme || "dark",
      friends: profile.friends || [],
      notifications: profile.notifications || [],
    };
    
    const initLogs: DayLog[] = [];
    for (let i = 1; i <= 7; i++) {
      const tempDate = new Date();
      tempDate.setDate(tempDate.getDate() + (i - 1));
      const dateStr = tempDate.toISOString().split("T")[0];
      const baseLog = getInitialDayLog(profile.id, i, dateStr);
      const log: DayLog = {
        ...baseLog,
        id: `${profile.id}_${i}`,
        userId: profile.id,
      };
      await dbService.saveDayLog(log);
      initLogs.push(log);
    }
    setDayLogs(initLogs);
    setActiveDayIndex(1);
    setActiveTab("dashboard");
    
    await saveProfileAndSync(resetProfile);

    setToastMessage({
      title: "Challenge Reset",
      desc: "Your logs, stats, and records have been cleared.",
      type: "warning",
    });
  };

  // Helper: Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedProfile = { ...profile, notifications: data.notifications };
        setProfile(updatedProfile);
        await dbService.saveUserProfile(updatedProfile);
      }
    } catch (err) {
      console.warn("Failed to mark notifications read on server:", err);
    }
  };

  // Helper: Clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch("/api/notifications/clear-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id })
      });
      if (response.ok) {
        const updatedProfile = { ...profile, notifications: [] };
        setProfile(updatedProfile);
        await dbService.saveUserProfile(updatedProfile);
      }
    } catch (err) {
      console.warn("Failed to clear notifications on server:", err);
    }
  };

  // Send Friend Request
  const handleSendFriendRequest = async (targetUserId: string) => {
    // For competitor bots, retain the local/mock immediate mutual add logic
    if (targetUserId.startsWith("bot_")) {
      const currentFriends = profile.friends || [];
      const updatedCurrent = {
        ...profile,
        friends: currentFriends.includes(targetUserId) ? currentFriends : [...currentFriends, targetUserId],
      };
      await saveProfileAndSync(updatedCurrent);
      
      setToastMessage({
        title: "Friend Added",
        desc: `You are now friends with the competitor bot!`,
        type: "success"
      });
      return;
    }

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: profile.id, targetId: targetUserId })
      });
      if (response.ok) {
        // Optimistically update locally
        const currentSent = profile.friendRequestsSent || [];
        const updatedCurrent = {
          ...profile,
          friendRequestsSent: [...currentSent.filter(id => id !== targetUserId), targetUserId]
        };
        await saveProfileAndSync(updatedCurrent);
        
        setToastMessage({
          title: "Friend Request Sent",
          desc: "Your connection request has been transmitted.",
          type: "success"
        });
      } else {
        const err = await response.json();
        setToastMessage({
          title: "Cannot Send Request",
          desc: err.error || "Unable to send friend request.",
          type: "warning"
        });
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  // Cancel Friend Request
  const handleCancelFriendRequest = async (targetUserId: string) => {
    try {
      const response = await fetch("/api/friends/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, targetId: targetUserId })
      });
      if (response.ok) {
        const updatedCurrent = {
          ...profile,
          friendRequestsSent: (profile.friendRequestsSent || []).filter(id => id !== targetUserId)
        };
        await saveProfileAndSync(updatedCurrent);
      }
    } catch (err) {
      console.error("Failed to cancel request:", err);
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (targetUserId: string) => {
    try {
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, targetId: targetUserId })
      });
      if (response.ok) {
        const updatedCurrent = {
          ...profile,
          friends: (profile.friends || []).filter(id => id !== targetUserId)
        };
        await saveProfileAndSync(updatedCurrent);
        
        setToastMessage({
          title: "Friend Removed",
          desc: "User has been removed from your friends list.",
          type: "warning"
        });
      }
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  // Accept Friend Request
  const handleAcceptFriendRequest = async (requesterId: string) => {
    try {
      const response = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, requesterId: requesterId })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          await saveProfileAndSync(data.user);
        }
        
        setToastMessage({
          title: "Request Accepted",
          desc: "You are now friends!",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  // Reject Friend Request
  const handleRejectFriendRequest = async (requesterId: string) => {
    try {
      const response = await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, requesterId: requesterId })
      });
      if (response.ok) {
        const currentReceived = profile.friendRequestsReceived || [];
        const currentNotifications = profile.notifications || [];
        const updatedCurrent = {
          ...profile,
          friendRequestsReceived: currentReceived.filter(id => id !== requesterId),
          notifications: currentNotifications.filter(n => !(n.type === "friend_request" && n.requesterId === requesterId))
        };
        await saveProfileAndSync(updatedCurrent);

        setToastMessage({
          title: "Request Declined",
          desc: "Friend request declined.",
          type: "warning"
        });
      }
    } catch (err) {
      console.error("Failed to decline friend request:", err);
    }
  };

  // Import JSON backup
  const handleImportData = async (jsonString: string) => {
    await dbService.importFromJSON(jsonString);
    const users = await dbService.getAllUsers();
    setProfiles(users);
    const activeUserId = await dbService.getActiveUserId();
    if (activeUserId) {
      await handleSwitchUser(activeUserId);
    }
  };

  if (showCredits) {
    return <CreditsScreen onEnter={() => setShowCredits(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white flex items-center justify-center body-loading">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Synchronizing Discipline Vault...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen onCreateProfile={handleCreateUser} />
    );
  }

  const currentLog = dayLogs.find((l) => l.dayNumber === activeDayIndex) || dayLogs[0];

  // Side bar navigation list (Standard desktop Sidebar)
  const navigationTabs = [
    { id: "dashboard", name: "Dashboard", icon: <Activity className="w-4 h-4" /> },
    { id: "habits", name: "Habit Matrix", icon: <Calendar className="w-4 h-4" /> },
    { id: "workout", name: "Workouts", icon: <Dumbbell className="w-4 h-4" /> },
    { id: "reminders", name: "Alarms & Reminders", icon: <Bell className="w-4 h-4" /> },
    { id: "nutrition", name: "Nutrition", icon: <Flame className="w-4 h-4" /> },
    { id: "journal", name: "Mind Journal", icon: <BookOpen className="w-4 h-4" /> },
    { id: "ai_chat", name: "AI Coach", icon: <Brain className="w-4 h-4" /> },
    { id: "analytics", name: "Analytics", icon: <Activity className="w-4 h-4" /> },
    { id: "gamification", name: "XP & Badges", icon: <Award className="w-4 h-4" /> },
    { id: "leaderboard", name: "Leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { id: "add_friend", name: "Add Friend", icon: <UserPlus className="w-4 h-4" /> },
    { id: "punishment", name: "Penalties", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "diagnose", name: "Diagnose", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "settings", name: "Settings & Admin", icon: <Sliders className="w-4 h-4" /> },
  ];

  // Mobile Bottom Navigation tabs list (filtered for standard 6 tabs to fit display screens)
  const mobileTabs = [
    { id: "dashboard", name: "Home", icon: <Activity className="w-5 h-5" /> },
    { id: "habits", name: "Habits", icon: <Calendar className="w-5 h-5" /> },
    { id: "workout", name: "Gym", icon: <Dumbbell className="w-5 h-5" /> },
    { id: "reminders", name: "Alarms", icon: <Bell className="w-5 h-5" /> },
    { id: "ai_chat", name: "Coach", icon: <Brain className="w-5 h-5" /> },
    { id: "settings", name: "System", icon: <Sliders className="w-5 h-5" /> },
  ];

  return (
    <div className={`min-h-screen bg-[#08090c] text-[#f3f4f6] pb-24 lg:pb-0 lg:pl-64 flex flex-col body-theme-wrapper relative overflow-hidden`}>
      {profile.theme === "liquid-glass" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] left-[20%] w-[50vw] sm:w-[30vw] h-[50vw] sm:h-[30vw] rounded-full bg-neon-purple/10 blur-[80px] sm:blur-[120px] animate-blob"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[55vw] sm:w-[35vw] h-[55vw] sm:h-[35vw] rounded-full bg-neon-cyan/10 blur-[100px] sm:blur-[140px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[50%] left-[60%] w-[45vw] sm:w-[25vw] h-[45vw] sm:h-[25vw] rounded-full bg-neon-pink/10 blur-[70px] sm:blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
      )}
      {/* 1. Header / Navigation Row */}
      <header className="glass-panel sticky top-0 z-40 px-4 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between border-b border-white/5 select-none">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-neon-purple/30 shadow-md shadow-neon-purple/10" />
          <div className="text-left">
            <h1 className="text-xs sm:text-base font-black tracking-wider text-white uppercase leading-none">7 DAYS OF DISCIPLINE</h1>
            <span className="text-[8px] sm:text-[9px] text-gray-500 font-bold tracking-widest uppercase">Iron Mind & Physical Mastery</span>
          </div>
        </div>

        {/* Dynamic Warning Notification & Theme Icon Panel */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
            title="Toggle Visual Theme"
          >
            {profile.theme === "light" && <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {(profile.theme === "dark" || !profile.theme) && <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-purple animate-pulse" />}
            {profile.theme === "liquid-glass" && <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-yellow" />}
          </button>

          {/* Notifications Bell with unread badge */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Show Notifications & Reminders"
          >
            <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${(reminders.length > 0 || (profile.notifications?.some((n: NotificationItem) => !n.read))) ? "animate-pulse text-neon-yellow" : ""}`} />
            {(reminders.length > 0 || (profile.notifications?.some((n: NotificationItem) => !n.read))) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center border border-[#08090c]">
                {reminders.length + (profile.notifications?.filter((n: NotificationItem) => !n.read).length || 0)}
              </span>
            )}
          </button>
          
          <button
            onClick={requestNotificationPermission}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] sm:text-[10px] font-bold text-gray-300 cursor-pointer flex items-center gap-1"
            title="Enable Alerts"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-cyan" />
            <span className="hidden sm:inline">Enable Alerts</span>
          </button>
        </div>
      </header>

      {/* 2. Primary 7-Day Matrix Navigation */}
      {profile.challengeStartDate && (
        <div className="bg-black/20 border-b border-white/5 px-6 py-3 flex gap-2 overflow-x-auto select-none scrollbar-none">
          {dayLogs.map((log) => {
            const isSelect = activeDayIndex === log.dayNumber;
            const scoreColor =
              log.disciplineScore >= 95
                ? "text-neon-purple font-black"
                : log.disciplineScore >= 70
                ? "text-neon-cyan"
                : log.disciplineScore >= 50
                ? "text-neon-yellow"
                : "text-red-400";

            return (
              <button
                key={log.dayNumber}
                onClick={() => setActiveDayIndex(log.dayNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 whitespace-nowrap cursor-pointer ${
                  isSelect
                    ? "bg-linear-to-r from-neon-purple/20 to-neon-cyan/20 border-neon-purple text-white shadow-sm"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <span>Day {log.dayNumber}</span>
                <span className={`text-[10px] ${scoreColor}`}>{log.disciplineScore}%</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Area Grid */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* PWA Prompt */}
        <PWAInstallPrompt />

        {/* Dynamic Toast Popup */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5"
                : "bg-orange-950/20 border-orange-500/20 text-orange-400 shadow-orange-500/5"
            }`}
          >
            <div className="text-left">
              <div className="text-sm font-black uppercase">{toastMessage.title}</div>
              <div className="text-xs text-gray-400 mt-1">{toastMessage.desc}</div>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 rounded-lg text-gray-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content Renderer */}
        {activeTab === "dashboard" && (
          <Dashboard
            currentLog={currentLog}
            profile={profile}
            allLogs={dayLogs}
            quotesList={quotesList}
            missionsList={missionsList}
            onStartChallenge={handleStartChallenge}
            onUpdateLog={handleUpdateLog}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === "habits" && (
          <HabitTracker currentLog={currentLog} habitsList={habitsList} categoriesList={habitCategoriesList} userLevel={profile.level} onUpdateLog={handleUpdateLog} />
        )}
        {activeTab === "workout" && (
          <WorkoutSection currentLog={currentLog} exercisesList={exercisesList} workoutCategories={workoutCategoriesList} onUpdateLog={handleUpdateLog} />
        )}
        {activeTab === "reminders" && (
          <RemindersSection />
        )}
        {activeTab === "nutrition" && (
          <NutritionSection
            currentLog={currentLog}
            profile={profile}
            allLogs={dayLogs}
            onUpdateLog={handleUpdateLog}
          />
        )}
        {activeTab === "journal" && (
          <JournalSection key={currentLog.id} currentLog={currentLog} onUpdateLog={handleUpdateLog} />
        )}
        {activeTab === "analytics" && <Analytics allLogs={dayLogs} profile={profile} />}
        {activeTab === "gamification" && <Gamification profile={profile} />}
        {activeTab === "punishment" && (
          <PunishmentSystem
            currentLog={currentLog}
            profile={profile}
            onUpdateLog={handleUpdateLog}
            onAddXP={handleAddXP}
          />
        )}
        {activeTab === "ai_chat" && (
          <AIChat
            profile={profile}
            onUpdateProfile={async (p) => {
              const updated = { ...profile, ...p };
              await saveProfileAndSync(updated);
            }}
            currentLog={currentLog}
            habitsList={habitsList}
          />
        )}
        {activeTab === "settings" && (
          <Settings
            profile={profile}
            onUpdateProfile={async (p) => {
              const updated = { ...profile, ...p };
              await saveProfileAndSync(updated);
            }}
            onResetChallenge={handleResetChallenge}
            onImportData={handleImportData}
            habitsList={habitsList}
            exercisesList={exercisesList}
            quotesList={quotesList}
            missionsList={missionsList}
            habitCategoriesList={habitCategoriesList}
            workoutCategoriesList={workoutCategoriesList}
            onSaveCMSContent={async (content) => {
              setHabitsList(content.habits);
              setExercisesList(content.exercises);
              setQuotesList(content.quotes);
              setMissionsList(content.missions);
              setHabitCategoriesList(content.habitCategories);
              setWorkoutCategoriesList(content.workoutCategories);

              await dbService.saveState("custom_habits", content.habits);
              await dbService.saveState("custom_exercises", content.exercises);
              await dbService.saveState("custom_quotes", content.quotes);
              await dbService.saveState("custom_missions", content.missions);
              await dbService.saveState("custom_habit_categories", content.habitCategories);
              await dbService.saveState("custom_workout_categories", content.workoutCategories);

              const updatedLogs = await Promise.all(dayLogs.map(async (log) => {
                const habitsCopy = { ...log.habits };
                content.habits.forEach((h) => {
                  if (!habitsCopy[h.id]) {
                    habitsCopy[h.id] = { completed: false };
                  }
                });
                const logCopy = { ...log, habits: habitsCopy };
                logCopy.disciplineScore = calculateDisciplineScore(logCopy, content.habits, content.habitCategories);
                
                const incompleteCount = Object.values(logCopy.habits).filter((h) => !h.completed).length;
                const warnings = [];
                if (incompleteCount > 15) {
                  warnings.push("Mission Failed");
                } else if (incompleteCount > 5) {
                  warnings.push("You Broke Discipline");
                }
                logCopy.warnings = warnings;

                dbService.saveDayLog(logCopy);
                return logCopy;
              }));
              setDayLogs(updatedLogs);
            }}
            onResetToDefaults={async () => {
              await dbService.saveState("custom_habits", null);
              await dbService.saveState("custom_exercises", null);
              await dbService.saveState("custom_quotes", null);
              await dbService.saveState("custom_missions", null);
              await dbService.saveState("custom_habit_categories", null);
              await dbService.saveState("custom_workout_categories", null);
              window.location.reload();
            }}
          />
        )}
        {activeTab === "leaderboard" && (
          <Leaderboard
            currentProfile={profile}
            profilesList={profiles}
            onSwitchProfile={handleSwitchUser}
            onCreateProfile={handleCreateUser}
            onDeleteProfile={handleDeleteUser}
            onSendFriendRequest={handleSendFriendRequest}
            onCancelFriendRequest={handleCancelFriendRequest}
            onRemoveFriend={handleRemoveFriend}
          />
        )}
        {activeTab === "add_friend" && (
          <AddFriend
            currentProfile={profile}
            profilesList={profiles}
            onSendFriendRequest={handleSendFriendRequest}
            onCancelFriendRequest={handleCancelFriendRequest}
          />
        )}
        {activeTab === "diagnose" && (
          <TestTrialRunner
            currentProfile={profile}
            habitsList={habitsList}
            habitCategoriesList={habitCategoriesList}
            onReloadLogs={async () => {
              if (profile && profile.id) {
                const users = await dbService.getAllUsers();
                const updatedUser = users.find(u => u.id === profile.id);
                if (updatedUser) {
                  setProfile(updatedUser);
                }
                setProfiles(users);
                const logs = await dbService.getAllDayLogsForUser(profile.id);
                setDayLogs(logs);
              }
            }}
          />
        )}
      </main>

      {/* 4. Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0c0d12] border-r border-white/5 fixed left-0 top-0 bottom-0 z-30 pt-20">
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === tab.id
                  ? "bg-linear-to-r from-neon-purple/15 to-neon-cyan/15 border border-neon-purple/20 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* 5. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d12]/95 backdrop-filter backdrop-blur-md border-t border-white/5 flex py-2 select-none justify-around px-2 shadow-xl">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 py-1.5 transition-all text-center cursor-pointer flex-1 min-w-[50px] ${
              activeTab === tab.id ? "text-neon-cyan font-black scale-105" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            <span className="text-[8px] uppercase tracking-wider block font-bold">{tab.name}</span>
          </button>
        ))}
      </nav>

      {/* 6. Notifications Modal Overlay */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c0d12]/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] select-none text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/15 rounded-full blur-2xl"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 z-10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-neon-yellow" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">Notifications Hub</h3>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin z-10">
              {/* Inbox / Friend Alerts Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Inbox / Friend Alerts</span>
                  <div className="flex gap-2">
                    {(profile.notifications || []).length > 0 && (
                      <>
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[9px] font-black text-neon-cyan hover:underline uppercase cursor-pointer"
                        >
                          Mark all read
                        </button>
                        <span className="text-gray-700 text-[9px]">•</span>
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[9px] font-black text-red-400 hover:underline uppercase cursor-pointer"
                        >
                          Clear all
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {(!profile.notifications || profile.notifications.length === 0) ? (
                  <div className="py-6 text-center text-xs text-gray-500 italic bg-white/2.5 rounded-2xl border border-white/5">
                    No friend requests or social notifications yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.notifications.map((notif: NotificationItem) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                          notif.read
                            ? "bg-black/20 border-white/5 opacity-70"
                            : "bg-linear-to-r from-neon-purple/10 to-neon-cyan/10 border-neon-purple/30"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow"></span>}
                              {notif.title}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold">{notif.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 font-medium leading-relaxed">{notif.desc}</p>
                        </div>
                        {notif.type === "friend_request" && notif.requesterId && (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleAcceptFriendRequest(notif.requesterId!)}
                              className="px-3 py-1.5 rounded-lg bg-neon-cyan/25 border border-neon-cyan/40 hover:bg-neon-cyan/35 text-white text-[10px] font-black cursor-pointer transition-all"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectFriendRequest(notif.requesterId!)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px] font-black cursor-pointer transition-all"
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Routine Alarm Alerts Section */}
              <div className="space-y-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">System Alarm Reminders</span>
                {reminders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500 italic bg-white/2.5 rounded-2xl border border-white/5">
                    No routine reminders triggered today.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {reminders.map((reminder, idx) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-2xl flex items-start gap-2.5">
                        <span className="p-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan mt-0.5">
                          <Sun className="w-3 h-3" />
                        </span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Alarm triggered</span>
                            <span className="text-[9px] text-gray-500 font-bold">{reminder.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 font-medium mt-0.5 leading-relaxed">{reminder.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-white/5 flex justify-end z-10">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
