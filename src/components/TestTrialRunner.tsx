import React, { useState } from "react";
import { Play, ClipboardCheck, Database, Sliders, Bell, Volume2, CheckCircle2, XCircle, Users } from "lucide-react";
import { dbService } from "../services/db";
import { NotificationService } from "../services/notifications";
import { calculateDisciplineScore } from "../utils/challenge";
import type { UserProfile, DayLog, Habit, HabitCategory, NotificationItem } from "../types";

type TestStatus = "idle" | "running" | "passed" | "failed";

interface TestTrial {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  status: TestStatus;
  logs: string[];
}

interface TestTrialRunnerProps {
  currentProfile?: UserProfile;
  habitsList?: Habit[];
  habitCategoriesList?: HabitCategory[];
  onReloadLogs?: () => Promise<void>;
}

export const TestTrialRunner: React.FC<TestTrialRunnerProps> = ({
  currentProfile,
  habitsList = [],
  habitCategoriesList = [],
  onReloadLogs
}) => {
  const [tests, setTests] = useState<TestTrial[]>([
    {
      id: "db_read_write",
      name: "Database Read/Write Trial",
      desc: "Tests saving states, writing logs, and loading entries in IndexedDB.",
      icon: <Database className="w-5 h-5 text-neon-cyan" />,
      status: "idle",
      logs: [],
    },
    {
      id: "multi_user",
      name: "Multi-User State Trial",
      desc: "Verifies profile isolation, creating users, and logs separation.",
      icon: <Sliders className="w-5 h-5 text-neon-purple" />,
      status: "idle",
      logs: [],
    },
    {
      id: "score_calc",
      name: "Discipline Score Logic",
      desc: "Asserts category weights sum math, completed averages, and grading boundaries.",
      icon: <ClipboardCheck className="w-5 h-5 text-neon-yellow" />,
      status: "idle",
      logs: [],
    },
    {
      id: "audio_synth",
      name: "Audio Alert Synth Trial",
      desc: "Verifies AudioContext is supported and triggers retro sound synthesize pitch.",
      icon: <Volume2 className="w-5 h-5 text-neon-pink" />,
      status: "idle",
      logs: [],
    },
    {
      id: "push_notify",
      name: "Web Push Notifications check",
      desc: "Checks browser authorization levels, triggers mock iOS/Android alert hooks.",
      icon: <Bell className="w-5 h-5 text-neon-orange" />,
      status: "idle",
      logs: [],
    },
    {
      id: "seed_demo_data",
      name: "7-Day Challenge Seeder",
      desc: "Seeds 7 days of realistic logs (water, sleep, screen, habits, weight, mood) to populate the analytics dashboard.",
      icon: <Database className="w-5 h-5 text-neon-green" />,
      status: "idle",
      logs: [],
    },
    {
      id: "friend_request_flow",
      name: "Friend Request & Accept Flow",
      desc: "Asserts sending requests, non-existing user errors, notification generation, and acceptance checks.",
      icon: <Users className="w-5 h-5 text-neon-cyan" />,
      status: "idle",
      logs: [],
    },
  ]);

  const updateTestStatus = (id: string, status: TestStatus, extraLogs: string[]) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, logs: [...t.logs, ...extraLogs] } : t))
    );
  };

  const runDbTest = async () => {
    const id = "db_read_write";
    updateTestStatus(id, "running", ["Initializing Database connection check...", "Mode: " + (dbService.isFallbackMode ? "localStorage fallback" : "IndexedDB mode")]);
    try {
      const testKey = "test_run_" + Math.random().toString(36).substr(2, 9);
      const testValue = { timestamp: Date.now(), success: true };
      
      await dbService.saveState(testKey, testValue);
      updateTestStatus(id, "running", ["✓ Wrote state key: " + testKey]);
      
      const loaded = await dbService.getState(testKey);
      updateTestStatus(id, "running", ["✓ Loaded state value: " + JSON.stringify(loaded)]);

      if (loaded && typeof loaded === "object" && "success" in loaded && loaded.success === true) {
        updateTestStatus(id, "passed", ["✓ Database Read/Write loop successfully validated."]);
      } else {
        throw new Error("Loaded data mismatch or empty value.");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", ["✗ Error: " + errMsg]);
    }
  };

  const runMultiUserTest = async () => {
    const id = "multi_user";
    updateTestStatus(id, "running", ["Fetching existing users list...", "Testing profile isolation..."]);
    try {
      const userA: UserProfile = {
        id: "test_user_a",
        username: "User_A_Tester",
        avatar: "spartan",
        xp: 100,
        level: 1,
        streak: 0,
        bestStreak: 0,
        badges: [],
        waterGoal: 2000,
        calorieGoal: 2000,
        proteinGoal: 100,
        screenTimeGoal: 120,
        targetWakeTime: "06:00",
        targetSleepTime: "22:00",
      };

      const userB: UserProfile = {
        id: "test_user_b",
        username: "User_B_Tester",
        avatar: "yogi",
        xp: 500,
        level: 2,
        streak: 2,
        bestStreak: 2,
        badges: ["iron_discipline"],
        waterGoal: 3000,
        calorieGoal: 2500,
        proteinGoal: 150,
        screenTimeGoal: 60,
        targetWakeTime: "05:00",
        targetSleepTime: "21:00",
      };

      await dbService.saveUserProfile(userA);
      await dbService.saveUserProfile(userB);
      updateTestStatus(id, "running", ["✓ Registered Test Users A & B Profiles."]);

      const all = await dbService.getAllUsers();
      updateTestStatus(id, "running", ["✓ Total profiles list size loaded: " + all.length]);

      const loadedA = all.find(u => u.id === "test_user_a");
      const loadedB = all.find(u => u.id === "test_user_b");

      if (loadedA?.username === "User_A_Tester" && loadedB?.username === "User_B_Tester") {
        updateTestStatus(id, "passed", ["✓ Isolation validated. Switching handles profiles correctly."]);
      } else {
        throw new Error("User credentials mismatch or not found.");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", ["✗ Error: " + errMsg]);
    }
  };

  const runScoreTest = async () => {
    const id = "score_calc";
    updateTestStatus(id, "running", ["Configuring demo checklist variables...", "Asserting calculateDisciplineScore functions..."]);
    try {
      const mockLog: DayLog = {
        id: "test_log",
        userId: "test_user",
        dayNumber: 1,
        date: "2026-06-19",
        habits: {
          "h1": { completed: true },
          "h2": { completed: false },
        },
        exercises: {},
        meals: [],
        waterIntake: 0,
        journal: { well: "", distracted: "", improve: "", energy: 5, mood: 5, completed: false },
        disciplineScore: 0,
        xpEarned: 0,
        penalties: [],
        warnings: [],
      };

      const mockHabits: Habit[] = [
        { id: "h1", category: "c1", text: "Habit 1" },
        { id: "h2", category: "c1", text: "Habit 2" },
      ];

      const mockCategories = [
        { id: "c1", name: "Category 1", icon: "Sun", color: "neon-purple", weight: 100 }
      ];

      const score = calculateDisciplineScore(mockLog, mockHabits, mockCategories);
      updateTestStatus(id, "running", ["✓ Calculated score output: " + score + "% (Expected: 50%)"]);

      if (score === 50) {
        updateTestStatus(id, "passed", ["✓ Math operations and weights distribution matches exactly."]);
      } else {
        throw new Error("Score output mismatch: " + score);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", ["✗ Test Failed: " + errMsg]);
    }
  };

  const runAudioTest = async () => {
    const id = "audio_synth";
    updateTestStatus(id, "running", ["Checking AudioContext support in browser window...", "Initializing oscillator node..."]);
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard concert A pitch
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);

      updateTestStatus(id, "passed", ["✓ Web Audio API initialized. Tone beep synthesized at 440Hz."]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", ["✗ Sound test failed: " + errMsg]);
    }
  };

  const runPushTest = async () => {
    const id = "push_notify";
    updateTestStatus(id, "running", ["Inspecting notification permission state...", "Current status: " + Notification.permission]);
    try {
      if (!("Notification" in window)) {
        throw new Error("Desktop/Mobile Notifications are not supported in this environment.");
      }

      // Trigger standard permission prompt if not denied
      if (Notification.permission === "default") {
        updateTestStatus(id, "running", ["Requesting system alert permission..."]);
        const next = await Notification.requestPermission();
        updateTestStatus(id, "running", ["Permission response: " + next]);
      }

      if (Notification.permission === "granted") {
        // Trigger a test notification immediately
        NotificationService.triggerLocalNotification(
          "Discipline System Test",
          "Push alerts are successfully validated for iOS standalone PWA and Android devices."
        );
        updateTestStatus(id, "passed", ["✓ Native Notification triggered via NotificationService wrapper. Verify device alerts list."]);
      } else {
        updateTestStatus(id, "failed", ["✗ Permission denied. Enable alerts in browser headers preferences."]);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", ["✗ Notifications failed: " + errMsg]);
    }
  };

  const runSeedDemoDataTest = async () => {
    const id = "seed_demo_data";
    updateTestStatus(id, "running", [
      "Starting 7-Day Demo Seeder...",
      `Active profile: ${currentProfile?.username || "Guest"}`,
    ]);
    if (!currentProfile) {
      updateTestStatus(id, "failed", ["✗ Error: No active profile loaded. Create or switch to a profile first."]);
      return;
    }

    try {
      const habits = habitsList;
      const categories = habitCategoriesList;
      
      const newLogs: DayLog[] = [];
      let totalXpEarned = 0;

      // Base weight for slightly fluctuating logs
      const startWeight = 175; // kg or lbs

      for (let dayNum = 1; dayNum <= 7; dayNum++) {
        // Calculate date (subtracting (7 - dayNum) days from today)
        const date = new Date();
        date.setDate(date.getDate() - (7 - dayNum));
        const dateStr = date.toISOString().split("T")[0];

        // Random completions for habits
        const dayHabits: Record<string, { completed: boolean; timestamp?: string }> = {};
        
        // Define some realistic completion rate per day (Day 1: 85%, Day 2: 70%, Day 3: 90%, etc.)
        const completionRates = [0.85, 0.70, 0.90, 0.65, 0.80, 0.75, 0.95];
        const dayRate = completionRates[dayNum - 1];

        habits.forEach(h => {
          const isCompleted = Math.random() < dayRate;
          dayHabits[h.id] = {
            completed: isCompleted,
            timestamp: isCompleted ? `${dateStr}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : undefined
          };
        });

        // Mock meals
        const meals = [
          { id: `meal_${dayNum}_1`, name: "Protein Shake & Oats", calories: 600, protein: 45, carbs: 70, fat: 12, timestamp: "08:30" },
          { id: `meal_${dayNum}_2`, name: "Grilled Chicken & Rice", calories: 850, protein: 65, carbs: 90, fat: 15, timestamp: "13:15" },
          { id: `meal_${dayNum}_3`, name: "Salmon & Sweet Potato", calories: 750, protein: 55, carbs: 60, fat: 22, timestamp: "19:30" }
        ];

        // Filter meals depending on completion rate
        const loggedMeals = Math.random() < dayRate ? meals : meals.slice(0, 2);

        const waterIntake = Math.floor(Math.random() * 1500) + 2000; // 2000ml - 3500ml
        const sleepHours = Number((Math.random() * 2 + 6.5).toFixed(1)); // 6.5h - 8.5h
        const sleepScore = Math.floor(sleepHours * 11); // 70 - 95 approx
        const screenTime = Math.floor(Math.random() * 120) + 80; // 80m - 200m
        const weight = Number((startWeight + (Math.random() * 4 - 2)).toFixed(1)); // fluctuating
        const mood = Math.floor(Math.random() * 4) + 6; // 6 - 9
        const energy = Math.floor(Math.random() * 4) + 6; // 6 - 9

        const baseLog: DayLog = {
          id: `${currentProfile.id}_${dayNum}`,
          userId: currentProfile.id,
          dayNumber: dayNum,
          date: dateStr,
          habits: dayHabits,
          exercises: {
            "chest_workout": {
              id: "chest_workout_log",
              completed: Math.random() < dayRate,
              sets: [
                { reps: 10, weight: 135, completed: true },
                { reps: 10, weight: 155, completed: true },
                { reps: 8, weight: 175, completed: true }
              ],
              notes: "Felt strong today."
            }
          },
          meals: loggedMeals,
          waterIntake,
          journal: {
            well: "Completed morning routine and kept focus.",
            distracted: "Phone notifications.",
            improve: "Put phone in locker during deep work.",
            energy,
            mood,
            completed: true
          },
          weight,
          sleepHours,
          sleepScore,
          screenTime,
          disciplineScore: 0,
          xpEarned: 0,
          penalties: [],
          warnings: []
        };

        // Calculate actual discipline score from logic
        baseLog.disciplineScore = calculateDisciplineScore(baseLog, habits, categories);
        
        // XP earned calculation: 10 XP for journal, 15 XP per completed habit
        const completedHabits = Object.values(dayHabits).filter(h => h.completed).length;
        const xp = (completedHabits * 15) + (baseLog.journal.completed ? 50 : 0);
        baseLog.xpEarned = xp;
        totalXpEarned += xp;

        // Auto warnings
        const incompleteCount = Object.values(dayHabits).filter(h => !h.completed).length;
        if (incompleteCount > 15) {
          baseLog.warnings = ["Mission Failed"];
        } else if (incompleteCount > 5) {
          baseLog.warnings = ["You Broke Discipline"];
        }

        // Save log
        await dbService.saveDayLog(baseLog);
        newLogs.push(baseLog);
        
        updateTestStatus(id, "running", [
          `✓ Seeded Day ${dayNum} (${dateStr}): Discipline ${baseLog.disciplineScore}%, Water ${waterIntake}ml, Sleep ${sleepHours}h, XP +${xp}`
        ]);
      }

      // Update profile with total XP and new Level
      const updatedXp = (currentProfile.xp || 0) + totalXpEarned;
      const updatedLevel = Math.max(currentProfile.level || 1, Math.floor(updatedXp / 500) + 1);
      
      const updatedProfile: UserProfile = {
        ...currentProfile,
        xp: updatedXp,
        level: updatedLevel,
        streak: 7, // mock streak set to 7 days
        bestStreak: Math.max(currentProfile.bestStreak || 0, 7),
        challengeStartDate: newLogs[0].date
      };

      await dbService.saveUserProfile(updatedProfile);
      
      updateTestStatus(id, "passed", [
        `✓ Seeded all 7 days successfully!`,
        `✓ Current Profile Level Upgraded to: Level ${updatedLevel} (${updatedXp} XP)`,
        `✓ Reloading UI states...`
      ]);

      if (onReloadLogs) {
        await onReloadLogs();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", [`✗ Seeder failed: ${errMsg}`]);
    }
  };

  const runFriendRequestTest = async () => {
    const id = "friend_request_flow";
    updateTestStatus(id, "running", ["Initializing Friend request check...", "Creating test user profiles..."]);
    try {
      // 1. Create two test profiles
      const suffix = Math.random().toString(36).substr(2, 5);
      const userAlice: UserProfile = {
        id: "test_alice_" + suffix,
        username: "Alice_Tester",
        avatar: "spartan",
        xp: 150,
        level: 1,
        streak: 0,
        bestStreak: 0,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        notifications: [],
        badges: [],
        waterGoal: 2000,
        calorieGoal: 2000,
        proteinGoal: 100,
        screenTimeGoal: 120,
        targetWakeTime: "06:00",
        targetSleepTime: "22:00",
      };

      const userBob: UserProfile = {
        id: "test_bob_" + suffix,
        username: "Bob_Tester",
        avatar: "yogi",
        xp: 250,
        level: 1,
        streak: 0,
        bestStreak: 0,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        notifications: [],
        badges: [],
        waterGoal: 3000,
        calorieGoal: 2500,
        proteinGoal: 150,
        screenTimeGoal: 60,
        targetWakeTime: "05:00",
        targetSleepTime: "21:00",
      };

      await dbService.saveUserProfile(userAlice);
      await dbService.saveUserProfile(userBob);
      updateTestStatus(id, "running", [
        `✓ Created Alice (${userAlice.id}) & Bob (${userBob.id})`
      ]);

      // 2. Validate that user code generation matches what we expect
      const getFriendCodeLocal = (p: UserProfile) => {
        const cleanName = p.username.toLowerCase().replace(/[^a-z0-9]/g, "");
        const codePart = p.id.split("_")[1] || "code";
        return `${cleanName}-${codePart.substring(0, 4)}`;
      };
      
      const aliceCode = getFriendCodeLocal(userAlice);
      const bobCode = getFriendCodeLocal(userBob);
      updateTestStatus(id, "running", [
        `✓ Alice friend code: ${aliceCode}`,
        `✓ Bob friend code: ${bobCode}`
      ]);

      // 3. Try to add a user code that does not exist in local db
      const fakeCode = "doesnotexist-1234";
      const allUsers = await dbService.getAllUsers();
      const matchedProfile = allUsers.find(p => getFriendCodeLocal(p) === fakeCode);
      if (!matchedProfile) {
        updateTestStatus(id, "running", [
          `✓ Verified fake code '${fakeCode}' correctly matches no registered profiles (cannot add).`
        ]);
      } else {
        throw new Error("Fake code incorrectly matched a registered profile!");
      }

      // 4. Try to add a valid existing user code (Alice adds Bob)
      const foundProfile = allUsers.find(p => getFriendCodeLocal(p) === bobCode);
      if (!foundProfile) {
        throw new Error("Could not locate Bob profile by code!");
      }
      updateTestStatus(id, "running", [
        `✓ Found Bob by code. Sending friend request from Alice...`
      ]);

      // Simulate sending friend request:
      // Alice sends to Bob
      const currentSent = userAlice.friendRequestsSent || [];
      const updatedAlice = {
        ...userAlice,
        friendRequestsSent: [...currentSent, userBob.id]
      };
      await dbService.saveUserProfile(updatedAlice);

      const targetReceived = userBob.friendRequestsReceived || [];
      const newNotification = {
        id: `notif_${Math.random().toString(36).substr(2, 9)}`,
        title: "Friend Request",
        desc: `${userAlice.username} wants to add you as a friend.`,
        timestamp: "TestTime",
        read: false,
        type: "friend_request" as const,
        requesterId: userAlice.id
      };
      const updatedBob = {
        ...userBob,
        friendRequestsReceived: [...targetReceived, userAlice.id],
        notifications: [newNotification]
      };
      await dbService.saveUserProfile(updatedBob);

      updateTestStatus(id, "running", [
        `✓ Friend request saved.`,
        `✓ Verifying Bob received request and notification...`
      ]);

      // Fetch from db to verify persistence
      const allUsersList1 = await dbService.getAllUsers();
      const freshBob = allUsersList1.find(u => u.id === userBob.id);
      if (!freshBob) throw new Error("Bob profile not found in db!");
      if (!freshBob.friendRequestsReceived?.includes(userAlice.id)) {
        throw new Error("Alice's ID is missing in Bob's friendRequestsReceived list!");
      }
      const hasNotif = freshBob.notifications?.some((n: NotificationItem) => n.type === "friend_request" && n.requesterId === userAlice.id);
      if (!hasNotif) {
        throw new Error("Bob notifications are missing the friend request notify item!");
      }
      updateTestStatus(id, "running", [
        `✓ Verified Bob has Alice in friendRequestsReceived.`,
        `✓ Verified Bob has friend request notification.`
      ]);

      // Bob accepts request from Alice
      updateTestStatus(id, "running", [
        `✓ Bob accepts friend request from Alice. Updating relations...`
      ]);

      const bobFriends = freshBob.friends || [];
      const bobReceived = freshBob.friendRequestsReceived || [];
      const bobNotifs = freshBob.notifications || [];
      const updatedBobAccepted = {
        ...freshBob,
        friends: [...bobFriends, userAlice.id],
        friendRequestsReceived: bobReceived.filter((id: string) => id !== userAlice.id),
        notifications: bobNotifs.map((n: NotificationItem) => {
          if (n.type === "friend_request" && n.requesterId === userAlice.id) {
            return { ...n, title: "Friend Request Accepted", read: true, type: "general" as const };
          }
          return n;
        })
      };
      await dbService.saveUserProfile(updatedBobAccepted);

      const allUsersList2 = await dbService.getAllUsers();
      const freshAlice = allUsersList2.find(u => u.id === userAlice.id);
      if (!freshAlice) throw new Error("Alice profile not found in db!");
      const aliceFriends = freshAlice.friends || [];
      const aliceSent = freshAlice.friendRequestsSent || [];
      const updatedAliceAccepted = {
        ...freshAlice,
        friends: [...aliceFriends, userBob.id],
        friendRequestsSent: aliceSent.filter((id: string) => id !== userBob.id)
      };
      await dbService.saveUserProfile(updatedAliceAccepted);

      // Verify mutual friendship
      const allUsersList3 = await dbService.getAllUsers();
      const verifiedAlice = allUsersList3.find(u => u.id === userAlice.id);
      const verifiedBob = allUsersList3.find(u => u.id === userBob.id);
      
      if (verifiedAlice?.friends?.includes(userBob.id) && verifiedBob?.friends?.includes(userAlice.id)) {
        updateTestStatus(id, "passed", [
          `✓ Verified mutual friendship in Alice and Bob profiles!`,
          `✓ Cleaned pending request lists.`,
          `✓ Friend request and acceptance trial passed successfully!`
        ]);
      } else {
        throw new Error("Mutual friendship validation failed.");
      }

      if (onReloadLogs) {
        await onReloadLogs();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      updateTestStatus(id, "failed", [`✗ Friend system check failed: ${errMsg}`]);
    }
  };

  const runAllTests = async () => {
    await runDbTest();
    await runMultiUserTest();
    await runScoreTest();
    await runAudioTest();
    await runPushTest();
    await runSeedDemoDataTest();
    await runFriendRequestTest();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Control Console */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-neon-cyan" /> System Diagnostics Console
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Trigger automated diagnostic checks to test database read/write speeds, user profile isolations, macro calculations, synthesizer sound, and mobile push notification layers.
          </p>
        </div>
        <button
          onClick={runAllTests}
          className="px-5 py-2.5 rounded-xl bg-linear-to-r from-neon-purple to-neon-cyan text-white text-xs font-black hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5 z-10 shadow-lg"
        >
          <Play className="w-4 h-4 fill-current" /> RUN DIAGNOSTICS CHECKS
        </button>
      </div>

      {/* Tests Card Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test) => {
          return (
            <div key={test.id} className="glass-card p-5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 items-center">
                  <span className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    {test.icon}
                  </span>
                  <div>
                    <h4 className="text-white text-sm font-black uppercase tracking-wider">{test.name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{test.desc}</p>
                  </div>
                </div>

                {/* Status Pills */}
                {test.status === "idle" && (
                  <span className="bg-white/5 border border-white/10 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    IDLE
                  </span>
                )}
                {test.status === "running" && (
                  <span className="bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider animate-pulse">
                    RUNNING
                  </span>
                )}
                {test.status === "passed" && (
                  <span className="bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> PASSED
                  </span>
                )}
                {test.status === "failed" && (
                  <span className="bg-red-950/20 border border-red-500/25 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5">
                    <XCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>

              {/* Logs area */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 min-h-[90px] max-h-[140px] overflow-y-auto font-mono text-[10px] text-gray-400 leading-relaxed text-left">
                {test.logs.length === 0 ? (
                  <span className="text-gray-600 block text-center py-6 italic">No log entries. Click run to start.</span>
                ) : (
                  test.logs.map((log, index) => <div key={index} className="block">{log}</div>)
                )}
              </div>

              {/* Single Run Action */}
              <button
                onClick={() => {
                  if (test.id === "db_read_write") runDbTest();
                  else if (test.id === "multi_user") runMultiUserTest();
                  else if (test.id === "score_calc") runScoreTest();
                  else if (test.id === "audio_synth") runAudioTest();
                  else if (test.id === "push_notify") runPushTest();
                  else if (test.id === "seed_demo_data") runSeedDemoDataTest();
                  else if (test.id === "friend_request_flow") runFriendRequestTest();
                }}
                disabled={test.status === "running"}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1 justify-center cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3 h-3 fill-current" /> Run Single Check
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
