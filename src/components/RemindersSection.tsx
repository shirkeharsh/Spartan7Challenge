import React, { useState, useEffect } from "react";
import { Bell, Clock, Smartphone, Sparkles, RefreshCw, Volume2, Play, Plus, Trash2 } from "lucide-react";
import { Haptics } from "@capacitor/haptics";
import LocalNotificationService from "../services/localNotifications";

interface ReminderItem {
  id: number;
  name: string;
  desc: string;
  time: string; // HH:MM
  enabled: boolean;
  tone: "chime" | "alarm" | "siren";
}

interface CustomAlarm {
  id: number;
  name: string;
  desc: string;
  time: string; // HH:MM
  enabled: boolean;
  tone: "chime" | "alarm" | "siren";
}

export const RemindersSection: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [testSeconds, setTestSeconds] = useState(5);
  const [testMsg, setTestMsg] = useState("Execute 50 Pushups now! No excuses.");
  const [testTone, setTestTone] = useState<"chime" | "alarm" | "siren">("alarm");
  const [diagnoseVolume, setDiagnoseVolume] = useState(50); // 0-100
  const [audioCtxState, setAudioCtxState] = useState<string>("unknown");
  
  // Default routine alarms
  const [reminders, setReminders] = useState<ReminderItem[]>([
    { id: 101, name: "Wake Up Discipline", desc: "First hour: No screen time. Get out of bed instantly.", time: "06:00", enabled: false, tone: "alarm" },
    { id: 102, name: "Clean Breakfast", desc: "Log your meal. Fuel up with clean carbs and high protein.", time: "08:00", enabled: false, tone: "chime" },
    { id: 103, name: "Gym Execution (Workout)", desc: "Time for scheduled bodyweight or dumbbell routine.", time: "10:30", enabled: false, tone: "siren" },
    { id: 104, name: "Clean Lunch Log", desc: "Track calories and check macro splits.", time: "13:00", enabled: false, tone: "chime" },
    { id: 105, name: "Clean Dinner Log", desc: "Finish eating early. Log dinner stats.", time: "19:00", enabled: false, tone: "chime" },
    { id: 106, name: "Journal Reflection & Sleep", desc: "Complete daily mindset reflection & shutdown screen.", time: "22:00", enabled: false, tone: "alarm" },
  ]);

  // Custom User alarms list
  const [customAlarms, setCustomAlarms] = useState<CustomAlarm[]>([]);

  // Form states for creating custom alarms
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customTime, setCustomTime] = useState("07:00");
  const [customTone, setCustomTone] = useState<"chime" | "alarm" | "siren">("chime");

  // Read permissions & pending native alarms
  const updateStatus = async () => {
    const hasPerm = await LocalNotificationService.checkPermission();
    setPermissionGranted(hasPerm);
    
    const pending = await LocalNotificationService.getPendingAlarms();
    setPendingCount(pending.length);

    // Read audio context status
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        setAudioCtxState(dummyCtx.state);
      }
    } catch (e) {
      setAudioCtxState("unsupported");
    }
  };

  useEffect(() => {
    // 1. Initialize notification channels on startup
    LocalNotificationService.initChannels();

    // 2. Load preset reminders configuration from localStorage
    const savedPresets = localStorage.getItem("dcp_reminders_config");
    let currentPresets = [...reminders];
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        currentPresets = reminders.map(p => {
          const match = parsed.find((x: any) => x.id === p.id);
          return match ? { ...p, time: match.time, enabled: match.enabled, tone: match.tone || p.tone } : p;
        });
      } catch (e) {
        console.error("Failed to parse preset reminders:", e);
      }
    }
    setReminders(currentPresets);

    // 3. Load custom alarms list from localStorage
    const savedCustoms = localStorage.getItem("dcp_custom_alarms_config");
    let currentCustoms: CustomAlarm[] = [];
    if (savedCustoms) {
      try {
        currentCustoms = JSON.parse(savedCustoms);
      } catch (e) {
        console.error("Failed to parse custom alarms:", e);
      }
    }
    setCustomAlarms(currentCustoms);

    // 4. Then check permissions and pending alarms asynchronously
    const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor !== undefined;
    const initStatus = async () => {
      const hasPerm = await LocalNotificationService.checkPermission();
      setPermissionGranted(hasPerm);

      if (isCapacitor) {
        const pending = await LocalNotificationService.getPendingAlarms();
        setPendingCount(pending.length);
        
        // Sync preset toggles with native pending registration
        setReminders(prev => prev.map(rem => {
          const active = pending.some(p => p.id === rem.id);
          return { ...rem, enabled: active };
        }));

        // Sync custom toggles with native pending registration
        setCustomAlarms(prev => prev.map(custom => {
          const active = pending.some(p => p.id === custom.id);
          return { ...custom, enabled: active };
        }));
      }
    };
    initStatus();
  }, []);

  const handleRequestPermission = async () => {
    const granted = await LocalNotificationService.requestPermission();
    setPermissionGranted(granted);
    updateStatus();
  };

  // Toggle routine reminders
  const handleToggleReminder = async (id: number) => {
    setReminders(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
      localStorage.setItem("dcp_reminders_config", JSON.stringify(updated.map(u => ({ id: u.id, time: u.time, enabled: u.enabled, tone: u.tone }))));
      
      const item = updated.find(r => r.id === id);
      if (item) {
        if (item.enabled) {
          const [hourStr, minStr] = item.time.split(":");
          const h = parseInt(hourStr) || 0;
          const m = parseInt(minStr) || 0;
          LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, item.tone).then(() => {
            updateStatus();
          });
        } else {
          LocalNotificationService.cancelAlarm(item.id).then(() => {
            updateStatus();
          });
        }
      }
      return updated;
    });
  };

  // Modify routine time
  const handleTimeChange = async (id: number, newTime: string) => {
    setReminders(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, time: newTime } : r);
      localStorage.setItem("dcp_reminders_config", JSON.stringify(updated.map(u => ({ id: u.id, time: u.time, enabled: u.enabled, tone: u.tone }))));
      
      const item = updated.find(r => r.id === id);
      if (item && item.enabled) {
        const [hourStr, minStr] = newTime.split(":");
        const h = parseInt(hourStr) || 0;
        const m = parseInt(minStr) || 0;
        LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, item.tone).then(() => {
          updateStatus();
        });
      }
      return updated;
    });
  };

  // Modify routine alarm tone
  const handleToneChange = async (id: number, newTone: "chime" | "alarm" | "siren") => {
    setReminders(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, tone: newTone } : r);
      localStorage.setItem("dcp_reminders_config", JSON.stringify(updated.map(u => ({ id: u.id, time: u.time, enabled: u.enabled, tone: u.tone }))));
      
      const item = updated.find(r => r.id === id);
      if (item && item.enabled) {
        const [hourStr, minStr] = item.time.split(":");
        const h = parseInt(hourStr) || 0;
        const m = parseInt(minStr) || 0;
        LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, newTone).then(() => {
          updateStatus();
        });
      }
      return updated;
    });
  };

  // Create custom alarm
  const handleAddCustomAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Generate unique ID in range 1000 - 999999
    const newId = Math.floor(1000 + Math.random() * 998000);
    const newAlarm: CustomAlarm = {
      id: newId,
      name: customName.trim(),
      desc: customDesc.trim() || "Trainer custom reminder split.",
      time: customTime,
      enabled: true,
      tone: customTone
    };

    const updated = [...customAlarms, newAlarm];
    setCustomAlarms(updated);
    localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));

    // Schedule native alarm
    const [hourStr, minStr] = customTime.split(":");
    const h = parseInt(hourStr) || 0;
    const m = parseInt(minStr) || 0;
    await LocalNotificationService.scheduleDailyAlarm(newAlarm.id, newAlarm.name, newAlarm.desc, h, m, newAlarm.tone);

    // Reset fields
    setCustomName("");
    setCustomDesc("");
    setCustomTime("07:00");
    setCustomTone("chime");

    updateStatus();
  };

  // Toggle custom alarms
  const handleToggleCustomAlarm = async (id: number) => {
    setCustomAlarms(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
      localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));

      const item = updated.find(c => c.id === id);
      if (item) {
        if (item.enabled) {
          const [hourStr, minStr] = item.time.split(":");
          const h = parseInt(hourStr) || 0;
          const m = parseInt(minStr) || 0;
          LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, item.tone).then(() => {
            updateStatus();
          });
        } else {
          LocalNotificationService.cancelAlarm(item.id).then(() => {
            updateStatus();
          });
        }
      }
      return updated;
    });
  };

  // Modify custom time
  const handleCustomTimeChange = async (id: number, newTime: string) => {
    setCustomAlarms(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, time: newTime } : c);
      localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));

      const item = updated.find(c => c.id === id);
      if (item && item.enabled) {
        const [hourStr, minStr] = newTime.split(":");
        const h = parseInt(hourStr) || 0;
        const m = parseInt(minStr) || 0;
        LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, item.tone).then(() => {
          updateStatus();
        });
      }
      return updated;
    });
  };

  // Modify custom alarm tone
  const handleCustomToneChange = async (id: number, newTone: "chime" | "alarm" | "siren") => {
    setCustomAlarms(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, tone: newTone } : c);
      localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));

      const item = updated.find(c => c.id === id);
      if (item && item.enabled) {
        const [hourStr, minStr] = item.time.split(":");
        const h = parseInt(hourStr) || 0;
        const m = parseInt(minStr) || 0;
        LocalNotificationService.scheduleDailyAlarm(item.id, item.name, item.desc, h, m, newTone).then(() => {
          updateStatus();
        });
      }
      return updated;
    });
  };

  // Delete custom alarm
  const handleDeleteCustomAlarm = async (id: number) => {
    await LocalNotificationService.cancelAlarm(id);
    const updated = customAlarms.filter(c => c.id !== id);
    setCustomAlarms(updated);
    localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));
    updateStatus();
  };

  // Test Alarm
  const triggerTestNotification = async () => {
    await LocalNotificationService.scheduleTestAlarm(999, "🔥 Trainer Discipline Alarm", testMsg, testSeconds, testTone);
    updateStatus();
    alert(`Test Alarm (${testTone}) scheduled to trigger in ${testSeconds} seconds. Lock your phone or switch apps to test!`);
  };

  // Cancel/Reset all alarms (Preset and custom)
  const handleCancelAll = async () => {
    await LocalNotificationService.cancelAllAlarms();
    
    // Disable all default presets
    setReminders(prev => {
      const updated = prev.map(r => ({ ...r, enabled: false }));
      localStorage.setItem("dcp_reminders_config", JSON.stringify(updated.map(u => ({ id: u.id, time: u.time, enabled: u.enabled, tone: u.tone }))));
      return updated;
    });

    // Disable all custom alarms
    setCustomAlarms(prev => {
      const updated = prev.map(c => ({ ...c, enabled: false }));
      localStorage.setItem("dcp_custom_alarms_config", JSON.stringify(updated));
      return updated;
    });

    updateStatus();
  };

  // DIAGNOSTIC - Play selected tone using Web Audio API synthesis to check volume
  const playDiagnosticChime = (toneType: "chime" | "alarm" | "siren") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        alert("Web Audio API is not supported on this platform.");
        return;
      }
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;
      const volumeScale = diagnoseVolume / 100;

      if (toneType === "chime") {
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1046.50, now);
        gain1.gain.setValueAtTime(0.15 * volumeScale, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1567.98, now + 0.12);
        gain2.gain.setValueAtTime(0.15 * volumeScale, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
      } else if (toneType === "alarm") {
        for (let i = 0; i < 4; i++) {
          const startTime = now + i * 0.3;
          const duration = 0.15;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(1200.0, startTime);
          gain.gain.setValueAtTime(0.2 * volumeScale, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        }
      } else if (toneType === "siren") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600.0, now);
        
        osc.frequency.linearRampToValueAtTime(1400.0, now + 0.35);
        osc.frequency.linearRampToValueAtTime(600.0, now + 0.7);
        osc.frequency.linearRampToValueAtTime(1400.0, now + 1.05);
        osc.frequency.linearRampToValueAtTime(600.0, now + 1.4);
        
        gain.gain.setValueAtTime(0.12 * volumeScale, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
      }
      
      setAudioCtxState(audioCtx.state);
    } catch (err) {
      console.warn("Failed to execute audio diagnostics:", err);
      alert("Audio context error. Verify system volume settings and try again.");
    }
  };

  // DIAGNOSTIC - Trigger Native Vibration to check hardware haptic motor (Bypasses browser constraints)
  const triggerDiagnosticVibe = async () => {
    const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor !== undefined;
    if (isCapacitor) {
      try {
        // Double native vibration pulse
        await Haptics.vibrate({ duration: 300 });
        setTimeout(async () => {
          await Haptics.vibrate({ duration: 300 });
        }, 500);
      } catch (e) {
        console.error("Native Haptics failure, falling back:", e);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    } else {
      alert("Native vibration motor is not supported on this platform/web browser.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-2 relative z-10 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            Trainer Alarms & Reminders
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure background exact alarms that wake the processor even when the phone is locked. Maintain perfect discipline.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={updateStatus}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-all"
            title="Refresh active alarms"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelAll}
            className="px-4 py-2 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Reset All Alarms
          </button>
        </div>
      </div>

      {/* Stats and Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Permission Status */}
        <div className="glass-panel p-5 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Native Push Status</span>
            <div className="flex items-center gap-2">
              {permissionGranted ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-black text-white">Active & Authorized</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-sm font-black text-gray-400">Permissions Needed</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-400">Allows native system alarms to sound / vibrate.</p>
          </div>
          {!permissionGranted && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2.5 rounded-xl bg-neon-purple text-white text-xs font-black uppercase tracking-wider hover:bg-neon-purple/80 cursor-pointer shadow-md shadow-neon-purple/20 transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              Enable Alerts
            </button>
          )}
        </div>

        {/* Pending Alarms Count */}
        <div className="glass-panel p-5 border border-white/5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
            <Smartphone className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Background Hooks</span>
            <div className="text-lg font-black text-white">{pendingCount} Active Alarms</div>
            <p className="text-[10px] text-gray-400">Registered Android AlarmManager background receivers.</p>
          </div>
        </div>
      </div>

      {/* Routine Alarms List */}
      <div className="glass-panel border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-neon-purple" />
          Daily Routine Reminders Split
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                rem.enabled
                  ? "bg-linear-to-b from-neon-purple/10 to-transparent border-neon-purple/35"
                  : "bg-white/2.5 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{rem.name}</span>
                    {rem.enabled && (
                      <span className="px-2 py-0.5 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-[8px] font-bold text-neon-purple tracking-widest uppercase">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed max-w-[230px]">{rem.desc}</p>
                </div>
                
                {/* Custom Time Picker */}
                <input
                  type="time"
                  value={rem.time}
                  onChange={(e) => handleTimeChange(rem.id, e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-neon-purple font-bold tracking-wider cursor-pointer"
                />
              </div>

              {/* Selector for Tone selection */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="text-left">
                  <label className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Tone</label>
                  <select
                    value={rem.tone}
                    onChange={(e) => handleToneChange(rem.id, e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="chime">Pleasant Chime</option>
                    <option value="alarm">Digital Buzzer</option>
                    <option value="siren">Emergency Siren</option>
                  </select>
                </div>
                
                <div className="flex items-end justify-start">
                  <button
                    onClick={() => playDiagnosticChime(rem.tone)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider">
                  Triggers daily at {rem.time}
                </span>
                
                {/* Enable Switch */}
                <button
                  onClick={() => handleToggleReminder(rem.id)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rem.enabled ? "bg-neon-purple" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      rem.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOM ALARMS CONFIGURATION BLOCK */}
      <div className="glass-panel border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-neon-cyan" />
            Custom Trainer Alarms
          </span>
          <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-[8px] font-bold text-neon-cyan tracking-widest uppercase">
            {customAlarms.length} Created
          </span>
        </h3>

        {/* Custom Alarms List */}
        {customAlarms.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 italic bg-white/2.5 rounded-2xl border border-white/5">
            No custom trainer alarms created yet. Add one below to track extra sessions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customAlarms.map((custom) => (
              <div
                key={custom.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  custom.enabled
                    ? "bg-linear-to-b from-neon-cyan/10 to-transparent border-neon-cyan/35"
                    : "bg-white/2.5 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{custom.name}</span>
                      <button
                        onClick={() => handleDeleteCustomAlarm(custom.id)}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                        title="Delete Alarm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-[210px]">{custom.desc}</p>
                  </div>
                  
                  {/* Custom Time Picker */}
                  <input
                    type="time"
                    value={custom.time}
                    onChange={(e) => handleCustomTimeChange(custom.id, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan font-bold tracking-wider cursor-pointer"
                  />
                </div>

                {/* Custom Alarm Tone selector */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="text-left">
                    <label className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Tone</label>
                    <select
                      value={custom.tone}
                      onChange={(e) => handleCustomToneChange(custom.id, e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 focus:border-neon-cyan rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none font-bold cursor-pointer"
                    >
                      <option value="chime">Pleasant Chime</option>
                      <option value="alarm">Digital Buzzer</option>
                      <option value="siren">Emergency Siren</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end justify-start">
                    <button
                      onClick={() => playDiagnosticChime(custom.tone)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[10px] text-gray-500 font-semibold tracking-wider">
                    Triggers daily at {custom.time}
                  </span>
                  
                  {/* Custom Enable Switch */}
                  <button
                    onClick={() => handleToggleCustomAlarm(custom.id)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      custom.enabled ? "bg-neon-cyan" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        custom.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Alarm Form */}
        <form onSubmit={handleAddCustomAlarm} className="p-4 bg-white/2.5 border border-white/5 rounded-2xl space-y-4">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block border-b border-white/5 pb-2">
            Create Custom Reminder Alert
          </span>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 text-left md:col-span-2">
              <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Label</label>
              <input
                type="text"
                placeholder="e.g. Cardio split / Posture check"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-cyan rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Time</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-cyan rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-bold cursor-pointer"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Tone</label>
              <select
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 focus:border-neon-cyan rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold cursor-pointer"
              >
                <option value="chime">Pleasant Chime</option>
                <option value="alarm">Digital Buzzer</option>
                <option value="siren">Emergency Siren</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Sub-text Message</label>
            <input
              type="text"
              placeholder="e.g. Execute 20 mins cardio + stretch now!"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-neon-cyan rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 hover:bg-neon-cyan/35 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Custom Trainer Alarm
          </button>
        </form>
      </div>

      {/* AUDIO, HAPTIC & PERMISSIONS DIAGNOSTIC PANEL */}
      <div className="glass-panel border border-white/5 rounded-3xl p-5 sm:p-6 space-y-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-neon-cyan animate-pulse" />
          Alarms & Output Diagnostics
        </h3>
        
        <p className="text-[10px] text-gray-400">
          Run internal diagnostics to inspect device permissions, audio synthesizers, vibration haptics, and system properties to guarantee alarms are functional.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Test Speakers (Web Audio) */}
          <div className="p-4 bg-white/2.5 border border-white/5 rounded-2xl space-y-4">
            <div>
              <span className="text-xs font-bold text-white block">1. Tone Output Tester</span>
              <p className="text-[10px] text-gray-400 mt-1">Generates an ascending synthesizer frequency to check media volume.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Tone Type</label>
                <select
                  value={testTone}
                  onChange={(e) => setTestTone(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none font-bold"
                >
                  <option value="chime">Pleasant Chime</option>
                  <option value="alarm">Digital Buzzer</option>
                  <option value="siren">Emergency Siren</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[8px] text-gray-500">
                  <span>Volume</span>
                  <span className="font-bold text-neon-cyan">{diagnoseVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={diagnoseVolume}
                  onChange={(e) => setDiagnoseVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan mt-2"
                />
              </div>
            </div>

            <button
              onClick={() => playDiagnosticChime(testTone)}
              className="w-full py-2.5 rounded-xl bg-neon-cyan/25 border border-neon-cyan/40 hover:bg-neon-cyan/35 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Play Selected Tone Preview
            </button>
          </div>

          {/* Test Haptic Vibration */}
          <div className="p-4 bg-white/2.5 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-white block">2. Haptic Vibration Test</span>
              <p className="text-[10px] text-gray-400 mt-1">Sends a double vibration pulse to test physical haptic alarm motors on Android.</p>
            </div>

            <div className="text-[10px] text-gray-500 py-1 italic">
              Note: Vibration does not work on iOS/Safari without user tap actions, but works natively on Android.
            </div>

            <button
              onClick={triggerDiagnosticVibe}
              className="w-full py-2.5 rounded-xl bg-neon-purple/20 border border-neon-purple/40 hover:bg-neon-purple/30 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Trigger Haptic Vibration
            </button>
          </div>
        </div>

        {/* Diagnostics Checklist Status */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 text-xs">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">System Diagnostics Checklist</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-2.5 bg-white/2.5 rounded-xl border border-white/5">
              <span className="text-gray-400 text-[10px]">Permission Flag</span>
              <span className={`font-black text-[10px] uppercase ${permissionGranted ? "text-emerald-400" : "text-red-400"}`}>
                {permissionGranted ? "Granted" : "Denied"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-white/2.5 rounded-xl border border-white/5">
              <span className="text-gray-400 text-[10px]">Active Alarms</span>
              <span className="font-black text-[10px] text-neon-cyan uppercase">
                {pendingCount} Hooks
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-white/2.5 rounded-xl border border-white/5">
              <span className="text-gray-400 text-[10px]">Audio Engine State</span>
              <span className={`font-black text-[10px] uppercase ${audioCtxState === "running" ? "text-emerald-400" : "text-amber-400"}`}>
                {audioCtxState}
              </span>
            </div>
          </div>

          <div className="text-[9px] text-gray-500 leading-relaxed border-t border-white/5 pt-2">
            💡 **Trainer Troubleshooting Guide:** If alarms do not fire: 1) Verify media & notification volume sliders are elevated. 2) Disable "Do Not Disturb" (DND) or silent profiling in Android's quick panel. 3) Grant full battery execution exceptions in Android Settings for background dispatch.
          </div>
        </div>
      </div>

      {/* Test Alarm Panel */}
      <div className="glass-panel border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
          Test Scheduled Background Alarm
        </h3>
        <p className="text-[10px] text-gray-400">
          Verify background Android scheduling. Set a test delay, select the tone, input a message, click trigger, and immediately press home/lock screen to verify the notification fires from background state.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1 text-left">
            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Delay Seconds</label>
            <select
              value={testSeconds}
              onChange={(e) => setTestSeconds(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
            >
              <option value={5}>5 Seconds</option>
              <option value={10}>10 Seconds</option>
              <option value={30}>30 Seconds</option>
              <option value={60}>60 Seconds (1 min)</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Alarm Tone</label>
            <select
              value={testTone}
              onChange={(e) => setTestTone(e.target.value as any)}
              className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
            >
              <option value="chime">Pleasant Chime</option>
              <option value="alarm">Digital Buzzer</option>
              <option value="siren">Emergency Siren</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Custom Alarm Message</label>
            <input
              type="text"
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-neon-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
              placeholder="Enter custom training message..."
            />
          </div>
        </div>

        <button
          onClick={triggerTestNotification}
          className="w-full py-3 rounded-2xl bg-linear-to-r from-neon-purple to-neon-cyan text-white text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-neon-purple/10 hover:shadow-neon-purple/25 hover:scale-[1.01] transition-all"
        >
          Schedule Test Alarm
        </button>
      </div>
    </div>
  );
};

export default RemindersSection;
