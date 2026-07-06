import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
  Undo2,
  FolderKanban,
  Database,
  Sparkles,
  Volume2,
  Lock,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Play
} from "lucide-react";
import type { Habit, Exercise, HabitCategory } from "../types";

interface AdminPanelProps {
  habitsList: Habit[];
  exercisesList: Exercise[];
  quotesList: { text: string; author: string }[];
  missionsList: string[];
  habitCategoriesList: HabitCategory[];
  workoutCategoriesList: string[];
  onSaveContent: (content: {
    habits: Habit[];
    exercises: Exercise[];
    quotes: { text: string; author: string }[];
    missions: string[];
    habitCategories: HabitCategory[];
    workoutCategories: string[];
  }) => Promise<void>;
  onResetToDefaults: () => Promise<void>;
}

type AdminTab = "habits" | "exercises" | "categories" | "quotes" | "missions";
type InspectorTab = "general" | "schedule" | "inputs" | "sounds" | "automation" | "meta" | "presets";

interface PhysicsNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  habitsList,
  exercisesList,
  quotesList,
  missionsList,
  habitCategoriesList,
  workoutCategoriesList,
  onSaveContent,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("habits");
  const [unpublished, setUnpublished] = useState(false);

  // --- CMS States ---
  const [habits, setHabits] = useState<Habit[]>([...habitsList]);
  const [exercises, setExercises] = useState<Exercise[]>([...exercisesList]);
  const [quotes, setQuotes] = useState<{ text: string; author: string }[]>([...quotesList]);
  const [missions, setMissions] = useState<string[]>([...missionsList]);
  const [habitCategories, setHabitCategories] = useState<HabitCategory[]>([...habitCategoriesList]);
  const [workoutCategories, setWorkoutCategories] = useState<string[]>([...workoutCategoriesList]);

  // --- Category Advanced State ---
  const [selectedCatId, setSelectedCatId] = useState<string | null>(habitCategoriesList[0]?.id || null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("general");
  const [lockedWeightIds, setLockedWeightIds] = useState<Set<string>>(new Set());

  // --- Habit Form State ---
  const [newHabitText, setNewHabitText] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState(habitCategoriesList[0]?.id || "morning");

  // --- Exercise Form State ---
  const [exName, setExName] = useState("");
  const [exCategory, setExCategory] = useState(workoutCategoriesList[0] || "Chest");
  const [exDesc, setExDesc] = useState("");
  const [exSets, setExSets] = useState(4);
  const [exReps, setExReps] = useState(12);
  const [exRest, setExRest] = useState(90);
  const [exInst, setExInst] = useState("");

  // --- Quote Form State ---
  const [qText, setQText] = useState("");
  const [qAuthor, setQAuthor] = useState("");

  // --- Category Form State (Creation) ---
  const [newCatId, setNewCatId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Sun");
  const [newCatColor, setNewCatColor] = useState("neon-purple");
  const [newCatWeight, setNewCatWeight] = useState(20);

  // --- Workout Category Form State ---
  const [newWorkoutCat, setNewWorkoutCat] = useState("");

  // --- Physics Matrix Canvas ---
  const [nodes, setNodes] = useState<PhysicsNode[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const draggingNodeRef = useRef<string | null>(null);

  const markChanged = () => setUnpublished(true);

  // Dynamic color helper
  const getHexColor = (colorName: string, alpha = "1") => {
    switch (colorName) {
      case "neon-yellow": return `rgba(234, 179, 8, ${alpha})`;
      case "neon-orange": return `rgba(249, 115, 22, ${alpha})`;
      case "neon-purple": return `rgba(168, 85, 247, ${alpha})`;
      case "neon-cyan": return `rgba(6, 182, 212, ${alpha})`;
      case "neon-pink": return `rgba(236, 72, 153, ${alpha})`;
      case "neon-green": return `rgba(34, 197, 94, ${alpha})`;
      case "neon-red": return `rgba(239, 68, 68, ${alpha})`;
      case "neon-indigo": return `rgba(99, 102, 241, ${alpha})`;
      case "neon-blue": return `rgba(59, 130, 246, ${alpha})`;
      default: return `rgba(168, 85, 247, ${alpha})`;
    }
  };

  // Initialize and Sync Physics Nodes
  useEffect(() => {
    if (activeTab !== "categories") return;

    const timeout = setTimeout(() => {
      setNodes((prevNodes) => {
        const updated = habitCategories.map((c, i) => {
          const existing = prevNodes.find((n) => n.id === c.id);
          const rad = Math.max(26, Math.min(52, (c.weight / 100) * 100 + 18));
          
          if (existing) {
            return {
              ...existing,
              name: c.name,
              radius: rad,
              color: c.color,
            };
          }
          
          const angle = (i / habitCategories.length) * Math.PI * 2;
          const r = 110;
          return {
            id: c.id,
            name: c.name,
            x: 230 + Math.cos(angle) * r,
            y: 160 + Math.sin(angle) * r,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            radius: rad,
            color: c.color,
          };
        });

        // Compare if updated is actually different from prevNodes
        const isSame = prevNodes.length === updated.length && prevNodes.every((n, i) => {
          const u = updated[i];
          return n.id === u.id && n.name === u.name && n.radius === u.radius && n.color === u.color;
        });

        return isSame ? prevNodes : updated;
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [habitCategories, activeTab]);

  // Tick physics nodes and draw
  useEffect(() => {
    if (activeTab !== "categories") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const tick = () => {
      ctx.fillStyle = "rgba(12, 13, 18, 0.4)";
      ctx.fillRect(0, 0, width, height);

      const center = { x: width / 2, y: height / 2 };

      const updatedNodes = nodes.map((node) => {
        if (draggingNodeRef.current === node.id) return node;

        let ax = (center.x - node.x) * 0.0005;
        let ay = (center.y - node.y) * 0.0005;

        nodes.forEach((other) => {
          if (other.id === node.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = node.radius + other.radius + 18;
          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) * 0.015;
            ax += (dx / dist) * force;
            ay += (dy / dist) * force;
          }
        });

        const vx = (node.vx + ax) * 0.94;
        const vy = (node.vy + ay) * 0.94;
        let x = node.x + vx;
        let y = node.y + vy;

        if (x - node.radius < 5) x = node.radius + 5;
        else if (x + node.radius > width - 5) x = width - node.radius - 5;
        if (y - node.radius < 5) y = node.radius + 5;
        else if (y + node.radius > height - 5) y = height - node.radius - 5;

        return { ...node, x, y, vx, vy };
      });

      // Connection lasers
      ctx.lineWidth = 1;
      for (let i = 0; i < updatedNodes.length; i++) {
        for (let j = i + 1; j < updatedNodes.length; j++) {
          const n1 = updatedNodes[i];
          const n2 = updatedNodes[j];
          const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
          grad.addColorStop(0, getHexColor(n1.color, "0.15"));
          grad.addColorStop(1, getHexColor(n2.color, "0.15"));
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }

      // Draw circles
      updatedNodes.forEach((node) => {
        const hex = getHexColor(node.color);
        const active = selectedCatId === node.id;

        ctx.shadowBlur = active ? 25 : 8;
        ctx.shadowColor = hex;

        ctx.fillStyle = "rgba(16, 17, 26, 0.95)";
        ctx.strokeStyle = active ? "#ffffff" : hex;
        ctx.lineWidth = active ? 3.5 : 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.fillStyle = hex;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = active ? "#ffffff" : "#cbd5e1";
        ctx.font = active ? "bold 10px sans-serif" : "9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const words = node.name.split(" ");
        if (words.length > 1 && node.radius > 32) {
          ctx.fillText(words[0], node.x, node.y - 6);
          ctx.fillText(words.slice(1).join(" "), node.x, node.y + 6);
        } else {
          ctx.fillText(node.name.slice(0, 10), node.x, node.y);
        }
      });

      nodes.forEach((n, idx) => {
        const up = updatedNodes[idx];
        if (up) {
          n.x = up.x;
          n.y = up.y;
          n.vx = up.vx;
          n.vy = up.vy;
        }
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [nodes, selectedCatId, activeTab]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const mouseX = e.clientX - box.left;
    const mouseY = e.clientY - box.top;

    nodes.forEach((node) => {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= node.radius) {
        draggingNodeRef.current = node.id;
        setSelectedCatId(node.id);
      }
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNodeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const mouseX = e.clientX - box.left;
    const mouseY = e.clientY - box.top;

    setNodes(
      nodes.map((node) => {
        if (node.id === draggingNodeRef.current) {
          return { ...node, x: mouseX, y: mouseY, vx: 0, vy: 0 };
        }
        return node;
      })
    );
  };

  const handleCanvasMouseUp = () => {
    draggingNodeRef.current = null;
  };

  // Play custom synthesized audio test
  const playAlertSoundTest = (freq: number, dur: number) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {
      console.warn("Audio test failed", e);
    }
  };

  // Rebalance weights logic
  const handleRebalanceWeights = () => {
    const locked = habitCategories.filter((c) => lockedWeightIds.has(c.id));
    const unlocked = habitCategories.filter((c) => !lockedWeightIds.has(c.id));

    if (unlocked.length === 0) {
      alert("All category weights are locked. Unlock at least one to rebalance.");
      return;
    }

    const lockedSum = locked.reduce((s, c) => s + c.weight, 0);
    if (lockedSum >= 100) {
      alert("Locked categories equal or exceed 100%. Cannot rebalance unlocked categories.");
      return;
    }

    const remainingWeight = 100 - lockedSum;
    const share = Math.floor(remainingWeight / unlocked.length);
    let remainder = remainingWeight - (share * unlocked.length);

    const updated = habitCategories.map((c) => {
      if (lockedWeightIds.has(c.id)) return c;
      const extra = remainder > 0 ? 1 : 0;
      if (extra > 0) remainder--;
      return { ...c, weight: share + extra };
    });

    setHabitCategories(updated);
    markChanged();
  };

  const toggleWeightLock = (id: string) => {
    const next = new Set(lockedWeightIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLockedWeightIds(next);
  };

  // Apply visual category presets
  const applyPresetTemplate = (presetName: string) => {
    if (!selectedCatId) return;

    let preset: Partial<HabitCategory> = {};
    switch (presetName) {
      case "spartan":
        preset = {
          color: "neon-cyan",
          bgStyle: "cyber-mesh",
          xpMultiplier: 2.0,
          inputTrackingType: "counter",
          inputTargetValue: 4,
          inputUnitName: "liters",
          synthBeepFreq: 1200,
          synthBeepDuration: 0.1,
          penaltySeverity: "high",
          autoRolloverBacklog: true,
          subTags: ["health", "biohacking", "hydration"],
          motivationalQuotes: ["Sweat cleanses the spirit. Push harder.", "Comfort is the enemy of progress."],
        };
        break;
      case "zen":
        preset = {
          color: "neon-pink",
          bgStyle: "glass-blur",
          xpMultiplier: 1.5,
          inputTrackingType: "duration",
          inputTargetValue: 1200,
          inputUnitName: "seconds",
          synthBeepFreq: 440,
          synthBeepDuration: 0.5,
          penaltySeverity: "none",
          autoRolloverBacklog: false,
          subTags: ["mindset", "focus", "meditation"],
          motivationalQuotes: ["Quiet the mind and the soul will speak.", "Be here now."],
        };
        break;
      case "athlete":
        preset = {
          color: "neon-purple",
          bgStyle: "hologram",
          xpMultiplier: 2.5,
          inputTrackingType: "counter",
          inputTargetValue: 5,
          inputUnitName: "sets",
          synthBeepFreq: 1500,
          synthBeepDuration: 0.2,
          penaltySeverity: "high",
          autoRolloverBacklog: true,
          subTags: ["fitness", "training", "iron"],
          motivationalQuotes: ["No excuses. Lift the iron.", "The only bad workout is the one that didn't happen."],
        };
        break;
      case "scholar":
        preset = {
          color: "neon-yellow",
          bgStyle: "solid",
          xpMultiplier: 1.2,
          inputTrackingType: "numeric",
          inputTargetValue: 20,
          inputUnitName: "pages",
          synthBeepFreq: 880,
          synthBeepDuration: 0.15,
          penaltySeverity: "medium",
          autoRolloverBacklog: false,
          subTags: ["focus", "reading", "study"],
          motivationalQuotes: ["An investment in knowledge pays the best interest.", "Read. Learn. Conquer."],
        };
        break;
    }

    setHabitCategories(
      habitCategories.map((c) => {
        if (c.id === selectedCatId) {
          return { ...c, ...preset };
        }
        return c;
      })
    );
    markChanged();
  };

  // Single Template Backup Export
  const handleExportCategory = (cat: HabitCategory) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cat, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `category_${cat.id}_template.json`);
    dlAnchor.click();
  };

  // Single Template Backup Import
  const handleImportCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.id && parsed.name) {
            // Check matching ID
            const exists = habitCategories.some((c) => c.id === parsed.id);
            if (exists) {
              setHabitCategories(habitCategories.map((c) => (c.id === parsed.id ? { ...c, ...parsed } : c)));
            } else {
              setHabitCategories([...habitCategories, parsed]);
            }
            markChanged();
            alert("Category Template imported successfully!");
          }
        } catch {
          alert("Invalid file format.");
        }
      };
    }
  };

  // --- Habits Operations ---
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitText.trim()) return;

    const newH: Habit = {
      id: `custom_habit_${Math.random().toString(36).substr(2, 9)}`,
      category: newHabitCategory,
      text: newHabitText.trim(),
    };

    setHabits([...habits, newH]);
    setNewHabitText("");
    markChanged();
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
    markChanged();
  };

  const handleEditHabitText = (id: string, text: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, text } : h)));
    markChanged();
  };

  const handleEditHabitCategory = (id: string, category: string) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, category } : h)));
    markChanged();
  };

  // --- Exercises Operations ---
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName.trim()) return;

    const instructionsArray = exInst
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newEx: Exercise = {
      id: `custom_ex_${Math.random().toString(36).substr(2, 9)}`,
      name: exName.trim(),
      category: exCategory as Exercise["category"],
      description: exDesc.trim() || "Custom dumbbell & bodyweight routine.",
      defaultSets: exSets || 3,
      defaultReps: exReps || 10,
      restTimer: exRest || 60,
      instructions: instructionsArray.length > 0 ? instructionsArray : ["Execute form strictly."],
    };

    setExercises([...exercises, newEx]);
    setExName("");
    setExDesc("");
    setExInst("");
    markChanged();
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
    markChanged();
  };

  const handleEditExercise = (id: string, field: keyof Exercise, value: Exercise[keyof Exercise]) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === id) {
          return { ...ex, [field]: value };
        }
        return ex;
      })
    );
    markChanged();
  };

  const handleEditExerciseInstructions = (id: string, instString: string) => {
    const arr = instString.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    handleEditExercise(id, "instructions", arr);
  };

  // --- Category Operations ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newCatId.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id || !newCatName.trim()) return;

    if (habitCategories.some((c) => c.id === id)) {
      alert("A category with this ID already exists.");
      return;
    }

    const newCat: HabitCategory = {
      id,
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      weight: Number(newCatWeight) || 0,
      bgStyle: "glass-blur",
      xpMultiplier: 1.0,
      customFrequency: "daily",
      timeWindowStart: "00:00",
      timeWindowEnd: "23:59",
      inputTrackingType: "checkbox",
      inputTargetValue: 1,
      inputUnitName: "times",
      penaltySeverity: "low",
      synthBeepFreq: 880,
      synthBeepDuration: 0.15,
      visualChartType: "area",
      levelLockRequirement: 1,
      archived: false,
      subTags: [],
      motivationalQuotes: [],
      autoRolloverBacklog: false,
      warnInactiveHours: 12,
    };

    setHabitCategories([...habitCategories, newCat]);
    setSelectedCatId(id);
    setNewCatId("");
    setNewCatName("");
    setNewCatWeight(20);
    markChanged();
  };

  const handleDeleteCategory = (catId: string) => {
    if (habitCategories.length <= 1) {
      alert("You must keep at least one category to avoid score calculation crashes.");
      return;
    }
    const boundHabitsCount = habits.filter((h) => h.category === catId).length;
    if (boundHabitsCount > 0) {
      if (!confirm(`Warning: ${boundHabitsCount} habits are currently linked to this category. Deleting it will orphan them. Proceed?`)) {
        return;
      }
    }

    const filtered = habitCategories.filter((c) => c.id !== catId);
    setHabitCategories(filtered);
    if (selectedCatId === catId) setSelectedCatId(filtered[0]?.id || null);
    markChanged();
  };

  const handleEditCategory = (catId: string, field: keyof HabitCategory, value: HabitCategory[keyof HabitCategory]) => {
    setHabitCategories(
      habitCategories.map((c) => {
        if (c.id === catId) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
    markChanged();
  };

  // --- Workout Category Operations ---
  const handleAddWorkoutCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newWorkoutCat.trim();
    if (!name) return;

    if (workoutCategories.includes(name)) {
      alert("This category already exists.");
      return;
    }

    setWorkoutCategories([...workoutCategories, name]);
    setNewWorkoutCat("");
    markChanged();
  };

  const handleDeleteWorkoutCategory = (name: string) => {
    if (workoutCategories.length <= 1) {
      alert("You must keep at least one workout category.");
      return;
    }
    setWorkoutCategories(workoutCategories.filter((c) => c !== name));
    markChanged();
  };

  // --- Quotes Operations ---
  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const newQ = {
      text: qText.trim(),
      author: qAuthor.trim() || "Unknown",
    };

    setQuotes([...quotes, newQ]);
    setQText("");
    setQAuthor("");
    markChanged();
  };

  const handleDeleteQuote = (idx: number) => {
    setQuotes(quotes.filter((_, i) => i !== idx));
    markChanged();
  };

  const handleEditQuote = (idx: number, field: "text" | "author", val: string) => {
    setQuotes(
      quotes.map((q, i) => {
        if (i === idx) return { ...q, [field]: val };
        return q;
      })
    );
    markChanged();
  };

  // --- Missions Operations ---
  const handleEditMission = (idx: number, val: string) => {
    const updated = [...missions];
    updated[idx] = val;
    setMissions(updated);
    markChanged();
  };

  // --- Publish & Reset ---
  const handlePublish = async () => {
    const sumWeight = habitCategories.reduce((sum, c) => sum + c.weight, 0);
    if (sumWeight !== 100) {
      alert(`Error: The sum of habit category weights must equal exactly 100%. Currently it is ${sumWeight}%. Adjust weights before publishing.`);
      return;
    }

    try {
      await onSaveContent({
        habits,
        exercises,
        quotes,
        missions,
        habitCategories,
        workoutCategories,
      });
      setUnpublished(false);
      alert("Web Config Published successfully! Updates are now live.");
    } catch (err) {
      alert("Failed to publish content.");
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (confirm("Wipe customization database? This restores all original defaults, quote loops, and weights.")) {
      await onResetToDefaults();
    }
  };

  // Calculations
  const categoryWeightSum = habitCategories.reduce((sum, c) => sum + c.weight, 0);
  const isWeightsBalanced = categoryWeightSum === 100;

  const tabList: { id: AdminTab; name: string }[] = [
    { id: "habits", name: "Habits CRM" },
    { id: "exercises", name: "Training CMS" },
    { id: "categories", name: "Categories Hub" },
    { id: "quotes", name: "Quotes Database" },
    { id: "missions", name: "Mission Control" },
  ];

  const availableIcons = [
    "Sun", "Flame", "Dumbbell", "Smartphone", "Brain", "Shield", "Heart", "Coffee", 
    "Book", "Activity", "Award", "Crown", "Sparkles", "CheckCircle", "Watch", "Zap", 
    "Calendar", "Volume2", "Target", "Lock", "AlertTriangle", "FileText", "Moon", 
    "Smile", "Hourglass", "Compass", "GraduationCap", "MessageSquare"
  ];
  
  const availableColors = [
    "neon-yellow", "neon-orange", "neon-purple", "neon-cyan", "neon-pink", "neon-green", 
    "neon-red", "neon-indigo", "neon-blue"
  ];

  const selectedCategory = habitCategories.find((c) => c.id === selectedCatId) || habitCategories[0];

  return (
    <div className="space-y-6 text-left">
      {/* Top Console Command Console */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-neon-purple/15 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-neon-cyan/15 rounded-full blur-3xl -z-10"></div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-neon-purple font-extrabold tracking-widest uppercase">
            Year 2030 HUD Console
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Sliders className="w-6 h-6 text-neon-purple" /> Web Console Admin Panel
          </h2>
          <p className="text-gray-400 text-xs max-w-lg">
            Modify habit scoring weights, create workout splits, structure quote loops, and add dynamic categories. Publish changes to commit.
          </p>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Undo2 className="w-4 h-4" /> Reset Factory
          </button>
          
          <button
            onClick={handlePublish}
            disabled={!unpublished}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              unpublished
                ? "bg-linear-to-r from-neon-purple to-neon-cyan text-white shadow-lg animate-pulse"
                : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Commit Changes
          </button>
        </div>
      </div>

      {/* Tabs list selector */}
      <div className="flex gap-1.5 overflow-x-auto select-none bg-black/40 border border-white/5 p-1 rounded-2xl">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white/5 text-white border border-white/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Primary columns structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN 1: Settings Creation Forms */}
        <div className="space-y-6">
          {/* Habits Tab Form */}
          {activeTab === "habits" && (
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-neon-purple" /> Add Custom Habit
              </h3>
              <form onSubmit={handleAddHabit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Habit Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Read 20 pages of philosophy"
                    value={newHabitText}
                    onChange={(e) => setNewHabitText(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Category Split</label>
                  <select
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-bold uppercase tracking-wider"
                  >
                    {habitCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-xs font-bold hover:bg-neon-purple/30 cursor-pointer"
                >
                  Create Habit
                </button>
              </form>
            </div>
          )}

          {/* Exercises Tab Form */}
          {activeTab === "exercises" && (
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-neon-cyan" /> Add Custom Exercise
              </h3>
              <form onSubmit={handleAddExercise} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Exercise Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Incline DB Flyes"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Muscle Split Group</label>
                  <select
                    value={exCategory}
                    onChange={(e) => setExCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer font-bold uppercase"
                  >
                    {workoutCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Sets</label>
                    <input
                      type="number"
                      value={exSets}
                      onChange={(e) => setExSets(parseInt(e.target.value) || 3)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Reps</label>
                    <input
                      type="number"
                      value={exReps}
                      onChange={(e) => setExReps(parseInt(e.target.value) || 10)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Rest (s)</label>
                    <input
                      type="number"
                      value={exRest}
                      onChange={(e) => setExRest(parseInt(e.target.value) || 90)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Brief Details</label>
                  <input
                    type="text"
                    placeholder="Focus on stretch at the bottom..."
                    value={exDesc}
                    onChange={(e) => setExDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Form Steps (one per line)</label>
                  <textarea
                    placeholder="Lie back on an incline bench&#10;Press dumbbells upward..."
                    value={exInst}
                    onChange={(e) => setExInst(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none min-h-[80px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-xs font-bold hover:bg-neon-purple/30 cursor-pointer"
                >
                  Create Exercise
                </button>
              </form>
            </div>
          )}

          {/* Categories Tab Form Panel */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Add Habit Category Form */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-neon-purple" /> Create Habit Category
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Category ID (no spaces)</label>
                      <input
                        type="text"
                        placeholder="career"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Category Name</label>
                      <input
                        type="text"
                        placeholder="Career & Focus"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Lucide Icon</label>
                      <select
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        {availableIcons.map((ico) => (
                          <option key={ico} value={ico}>{ico}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Accent Color Theme</label>
                      <select
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        {availableColors.map((col) => (
                          <option key={col} value={col}>{col.replace("neon-", "")}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Discipline Weighting (0-100%)</label>
                    <input
                      type="number"
                      value={newCatWeight}
                      onChange={(e) => setNewCatWeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-xs font-bold hover:bg-neon-purple/30 cursor-pointer"
                  >
                    Add Category
                  </button>
                </form>
              </div>

              {/* Add Workout Split Category Form */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-neon-cyan" /> Add Muscle Category
                </h3>
                <form onSubmit={handleAddWorkoutCategory} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Muscle Group Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Triceps, Cardio, Forearms"
                      value={newWorkoutCat}
                      onChange={(e) => setNewWorkoutCat(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-xs font-bold hover:bg-neon-cyan/30 cursor-pointer"
                  >
                    Add Workout split
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Quotes Tab Form */}
          {activeTab === "quotes" && (
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-neon-yellow" /> Add Custom Quote
              </h3>
              <form onSubmit={handleAddQuote} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Quote Text</label>
                  <textarea
                    placeholder="e.g. Discipline equals freedom."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none min-h-[70px]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Author</label>
                  <input
                    type="text"
                    placeholder="e.g. Jocko Willink"
                    value={qAuthor}
                    onChange={(e) => setQAuthor(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-neon-yellow/20 border border-neon-yellow/30 text-neon-yellow text-xs font-bold hover:bg-neon-yellow/30 cursor-pointer"
                >
                  Create Quote
                </button>
              </form>
            </div>
          )}

          {activeTab === "missions" && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-gray-400 leading-relaxed">
              <strong className="text-white block mb-1">Missions Control HUD:</strong>
              Missions correspond directly to challenge Day 1 through Day 7. Simply edit the corresponding day's mission statement inside the console to alter dashboard display directives.
            </div>
          )}
        </div>

        {/* COLUMN 2 & 3: Database work tables (Render panels) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dynamic Weight HUD bar inside Categories view */}
          {activeTab === "categories" && (
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 text-left transition-all duration-300 ${
              isWeightsBalanced ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" : "bg-orange-950/20 border-orange-500/20 text-orange-400"
            }`}>
              <div className="space-y-1.5 flex-1 w-full">
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-5 h-5" />
                  {isWeightsBalanced ? "Discipline Engine Balanced (100%)" : "Rebalancing Required"}
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {isWeightsBalanced
                    ? "Categories score weightings sum up to exactly 100%. Discipline logic is locked and ready."
                    : `Habit category score weightings must equal exactly 100% to compile. Current sum: ${categoryWeightSum}%.`}
                </p>
                
                {/* Weight gauge visual bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${isWeightsBalanced ? "bg-emerald-500" : "bg-orange-500"}`}
                    style={{ width: `${Math.min(100, categoryWeightSum)}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRebalanceWeights}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Rebalance Unlocked
                </button>
                <div className={`text-xl font-black px-4 py-2.5 rounded-2xl border ${
                  isWeightsBalanced ? "bg-emerald-500/10 border-emerald-500/20" : "bg-orange-500/10 border-orange-500/20"
                }`}>
                  {categoryWeightSum}%
                </div>
              </div>
            </div>
          )}

          {/* Database Listings Card */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 text-left">
            <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-neon-cyan" /> Visual CMS Database
            </h3>

            {/* Render Habits List */}
            {activeTab === "habits" && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {habits.length === 0 ? (
                  <p className="text-gray-500 text-xs py-10 text-center">Empty habits list. Add one on the left.</p>
                ) : (
                  habits.map((h) => (
                    <div key={h.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3.5 rounded-xl bg-white/5 border border-white/5">
                      <select
                        value={h.category}
                        onChange={(e) => handleEditHabitCategory(h.id, e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none font-bold uppercase tracking-wider min-w-[130px]"
                      >
                        {habitCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        value={h.text}
                        onChange={(e) => handleEditHabitText(h.id, e.target.value)}
                        className="flex-1 bg-transparent border-b border-transparent focus:border-neon-purple py-0.5 text-xs text-white focus:outline-none font-medium"
                      />
                      
                      <button
                        onClick={() => handleDeleteHabit(h.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Render Exercises List */}
            {activeTab === "exercises" && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {exercises.length === 0 ? (
                  <p className="text-gray-500 text-xs py-10 text-center">Empty exercises list. Add one on the left.</p>
                ) : (
                  exercises.map((ex) => (
                    <div key={ex.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 text-left">
                      <div className="flex justify-between items-center gap-3 border-b border-white/5 pb-2">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => handleEditExercise(ex.id, "name", e.target.value)}
                          className="font-bold text-white bg-transparent border-b border-transparent focus:border-neon-cyan text-xs sm:text-sm focus:outline-none flex-1"
                        />
                        <button
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Split Category</span>
                          <select
                            value={ex.category}
                            onChange={(e) => handleEditExercise(ex.id, "category", e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                          >
                            {workoutCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Sets count</span>
                          <input
                            type="number"
                            value={ex.defaultSets}
                            onChange={(e) => handleEditExercise(ex.id, "defaultSets", parseInt(e.target.value) || 3)}
                            className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none text-center"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Reps limit</span>
                          <input
                            type="number"
                            value={ex.defaultReps}
                            onChange={(e) => handleEditExercise(ex.id, "defaultReps", parseInt(e.target.value) || 12)}
                            className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none text-center"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Rest secs</span>
                          <input
                            type="number"
                            value={ex.restTimer}
                            onChange={(e) => handleEditExercise(ex.id, "restTimer", parseInt(e.target.value) || 90)}
                            className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase block">Short details</label>
                        <input
                          type="text"
                          value={ex.description}
                          onChange={(e) => handleEditExercise(ex.id, "description", e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase block">Form Instructions</label>
                        <textarea
                          value={ex.instructions.join("\n")}
                          onChange={(e) => handleEditExerciseInstructions(ex.id, e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none min-h-[70px]"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* --- 4D CATEGORIES HUB 2030 --- */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                
                {/* 1. Force Directed Physics Matrix Canvas Container */}
                <div className="p-4 rounded-3xl bg-[#0c0d12]/95 border border-white/5 flex flex-col items-stretch relative overflow-hidden">
                  <div className="absolute top-3 left-3 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                    4D Physics Neural Link Matrix
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={300}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="w-full max-w-[480px] h-[300px] bg-[#0c0d12] rounded-2xl mx-auto shadow-inner border border-white/5 cursor-grab active:cursor-grabbing"
                  />
                  <span className="text-[9px] text-gray-500 text-center mt-2 font-medium">
                    Drag the category nodes above to visually inspect connections and adjust physical momentum. Click to select.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start border-t border-white/5 pt-6">
                  {/* Category Selection Sidebar List */}
                  <div className="space-y-2 select-none md:col-span-1">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block mb-2">Category List</span>
                    {habitCategories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCatId(c.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          selectedCatId === c.id
                            ? "bg-white/5 text-white border-white/15"
                            : "bg-black/20 text-gray-400 border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: getHexColor(c.color) }}></span>
                          <span className="text-xs font-bold">{c.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold">{c.weight}%</span>
                      </button>
                    ))}
                  </div>

                  {/* 4D Category Architect Inspector Drawer */}
                  <div className="md:col-span-2 space-y-4">
                    {selectedCategory && (
                      <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
                          <div className="text-left">
                            <span className="text-[9px] font-black text-neon-purple uppercase tracking-widest block">4D Category Architect</span>
                            <h4 className="text-white text-base font-black uppercase tracking-tight flex items-center gap-1.5">
                              {selectedCategory.name} <span className="text-[10px] text-gray-500">({selectedCategory.id})</span>
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleExportCategory(selectedCategory)}
                              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold flex items-center gap-1 border border-white/5"
                              title="Export Template"
                            >
                              <Download className="w-3 h-3" /> Export
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(selectedCategory.id)}
                              className="px-2.5 py-1 rounded bg-red-950/15 hover:bg-red-950/30 text-red-400 text-[10px] font-bold flex items-center gap-1 border border-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Inspector tabs list */}
                        <div className="flex gap-1 overflow-x-auto bg-black/50 p-1 rounded-xl">
                          {(["general", "schedule", "inputs", "sounds", "automation", "meta", "presets"] as InspectorTab[]).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setInspectorTab(tab)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                inspectorTab === tab
                                  ? "bg-white/5 text-white border border-white/10"
                                  : "text-gray-500 hover:text-white"
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Inspector subpanels */}
                        <div className="space-y-4 min-h-[220px]">
                          {/* TAB 1: General settings */}
                          {inspectorTab === "general" && (
                            <div className="space-y-3.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Category Display Name</label>
                                  <input
                                    type="text"
                                    value={selectedCategory.name}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "name", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Discipline Weight %</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={selectedCategory.weight}
                                      disabled={lockedWeightIds.has(selectedCategory.id)}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "weight", parseInt(e.target.value) || 0)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none text-center font-bold disabled:opacity-40"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => toggleWeightLock(selectedCategory.id)}
                                      className={`p-2 rounded-xl border ${
                                        lockedWeightIds.has(selectedCategory.id)
                                          ? "bg-neon-purple/20 border-neon-purple/40 text-neon-purple"
                                          : "bg-white/5 border-white/10 text-gray-500"
                                      }`}
                                      title={lockedWeightIds.has(selectedCategory.id) ? "Unlock Weight" : "Lock Weight for Rebalancing"}
                                    >
                                      <Lock className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Display Icon</label>
                                  <select
                                    value={selectedCategory.icon}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "icon", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    {availableIcons.map((ico) => (
                                      <option key={ico} value={ico}>{ico}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Color Palette</label>
                                  <select
                                    value={selectedCategory.color}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "color", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    {availableColors.map((col) => (
                                      <option key={col} value={col}>{col.replace("neon-", "")}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Aesthetics Wallpaper</label>
                                  <select
                                    value={selectedCategory.bgStyle || "glass-blur"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "bgStyle", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="glass-blur">Glassmorphism Blur</option>
                                    <option value="hologram">Hologram Laser Grid</option>
                                    <option value="cyber-mesh">Cyberpunk Matrix Mesh</option>
                                    <option value="audio-pulse">Audio Pulse Glow</option>
                                    <option value="particle">Ethereal Particle Wave</option>
                                    <option value="solid">Dark Cyber Solid</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[10px] text-white font-extrabold uppercase tracking-wide block">Temporary Archive Status</span>
                                  <span className="text-[9px] text-gray-500 block">Hide category from checklist without destroying user history logs.</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedCategory.archived || false}
                                  onChange={(e) => handleEditCategory(selectedCategory.id, "archived", e.target.checked)}
                                  className="w-4 h-4 rounded border-white/20 accent-neon-purple cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          {/* TAB 2: Schedule & Frequency */}
                          {inspectorTab === "schedule" && (
                            <div className="space-y-3.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Target Frequency</label>
                                  <select
                                    value={selectedCategory.customFrequency || "daily"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "customFrequency", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="daily">Every Day split</option>
                                    <option value="weekly">Weekly Routine</option>
                                    <option value="odd">Odd Days of Month</option>
                                    <option value="even">Even Days of Month</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">XP Multiplier Reward</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min={1.0}
                                      max={3.0}
                                      step={0.1}
                                      value={selectedCategory.xpMultiplier || 1.0}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "xpMultiplier", parseFloat(e.target.value))}
                                      className="flex-1 accent-neon-purple cursor-ew-resize"
                                    />
                                    <span className="text-xs font-mono font-bold text-white">{selectedCategory.xpMultiplier || 1.0}x</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Time Frame Start</label>
                                  <input
                                    type="time"
                                    value={selectedCategory.timeWindowStart || "00:00"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "timeWindowStart", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Time Frame End</label>
                                  <input
                                    type="time"
                                    value={selectedCategory.timeWindowEnd || "23:59"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "timeWindowEnd", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Min Unlock Level</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={selectedCategory.levelLockRequirement || 1}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "levelLockRequirement", parseInt(e.target.value) || 1)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none text-center font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 3: Tracking Inputs */}
                          {inspectorTab === "inputs" && (
                            <div className="space-y-3.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Habit Tracking Type</label>
                                  <select
                                    value={selectedCategory.inputTrackingType || "checkbox"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "inputTrackingType", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="checkbox">Standard Checkbox</option>
                                    <option value="counter">Counter Clicker (+/- values)</option>
                                    <option value="numeric">Raw Numeric Input Box</option>
                                    <option value="duration">Stopwatch Timer Log</option>
                                    <option value="photo">Upload Photo Proof</option>
                                    <option value="gps">GPS Location check-in</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block font-bold">Associated Affinities Badge</label>
                                  <select
                                    value={selectedCategory.associatedBadge || ""}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "associatedBadge", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer font-bold"
                                  >
                                    <option value="">None (Standard Reward)</option>
                                    <option value="early_bird">Early Bird Affinity</option>
                                    <option value="no_phone_hero">No Phone Hero Affinity</option>
                                    <option value="iron_discipline">Iron Discipline Affinity</option>
                                    <option value="workout_beast">Workout Beast Affinity</option>
                                  </select>
                                </div>
                              </div>

                              {selectedCategory.inputTrackingType !== "checkbox" && selectedCategory.inputTrackingType !== "photo" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/25 p-3 rounded-2xl border border-white/5">
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase block">Target Complete Limit Value</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={selectedCategory.inputTargetValue || 1}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "inputTargetValue", parseInt(e.target.value) || 1)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-bold text-center"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase block">Metrics unit label</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. ml, cups, pages, seconds"
                                      value={selectedCategory.inputUnitName || ""}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "inputUnitName", e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none text-center font-bold"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 4: Synthesizer sounds testing */}
                          {inspectorTab === "sounds" && (
                            <div className="space-y-3.5">
                              <div className="p-3 bg-black/40 border border-white/5 rounded-2xl text-xs text-gray-400 leading-relaxed text-left flex items-start gap-2">
                                <Volume2 className="w-4 h-4 text-neon-purple mt-0.5 flex-shrink-0" />
                                <span>
                                  Trigger synthesized retro beep sounds using Web Audio API when user logs checkmarks inside this category.
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Alarm Tone (Frequency - Hz)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min={200}
                                      max={2000}
                                      step={20}
                                      value={selectedCategory.synthBeepFreq || 880}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "synthBeepFreq", parseInt(e.target.value))}
                                      className="flex-1 accent-neon-purple cursor-ew-resize"
                                    />
                                    <span className="text-xs font-mono font-bold text-white w-14 text-center">{selectedCategory.synthBeepFreq || 880}Hz</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Alarm duration (Seconds)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min={0.05}
                                      max={1.5}
                                      step={0.05}
                                      value={selectedCategory.synthBeepDuration || 0.15}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "synthBeepDuration", parseFloat(e.target.value))}
                                      className="flex-1 accent-neon-purple cursor-ew-resize"
                                    />
                                    <span className="text-xs font-mono font-bold text-white w-14 text-center">{selectedCategory.synthBeepDuration || 0.15}s</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => playAlertSoundTest(selectedCategory.synthBeepFreq || 880, selectedCategory.synthBeepDuration || 0.15)}
                                className="px-4 py-2 bg-neon-purple/20 hover:bg-neon-purple/35 text-neon-purple text-xs font-black rounded-xl border border-neon-purple/30 cursor-pointer flex items-center gap-1.5 justify-center mx-auto"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Play Synth Preview
                              </button>
                            </div>
                          )}

                          {/* TAB 5: Automation warnings */}
                          {inspectorTab === "automation" && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Miss Penalty Level</label>
                                  <select
                                    value={selectedCategory.penaltySeverity || "low"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "penaltySeverity", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="none">None (Ignore score)</option>
                                    <option value="low">Low Deduct (-2%)</option>
                                    <option value="medium">Medium Deduct (-5%)</option>
                                    <option value="high">High Deduct (-10% + alert)</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Warn Inactive Hours</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min={2}
                                      max={24}
                                      step={1}
                                      value={selectedCategory.warnInactiveHours || 12}
                                      onChange={(e) => handleEditCategory(selectedCategory.id, "warnInactiveHours", parseInt(e.target.value))}
                                      className="flex-1 accent-neon-purple cursor-ew-resize"
                                    />
                                    <span className="text-xs font-mono font-bold text-white w-10 text-center">{selectedCategory.warnInactiveHours || 12}h</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/5">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-xs text-white font-extrabold uppercase tracking-wide block">Auto-Rollover Backlog</span>
                                  <span className="text-[9px] text-gray-500 block">Move incomplete tasks to the next day automatically.</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedCategory.autoRolloverBacklog || false}
                                  onChange={(e) => handleEditCategory(selectedCategory.id, "autoRolloverBacklog", e.target.checked)}
                                  className="w-4 h-4 rounded border-white/20 accent-neon-purple cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          {/* TAB 6: Meta tags */}
                          {inspectorTab === "meta" && (
                            <div className="space-y-3.5">
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase block">Tags (Comma Separated)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. hydration, focus, cardio"
                                  value={selectedCategory.subTags?.join(", ") || ""}
                                  onChange={(e) => {
                                    const arr = e.target.value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
                                    handleEditCategory(selectedCategory.id, "subTags", arr);
                                  }}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase block">Dashboard Analytics Plot</label>
                                  <select
                                    value={selectedCategory.visualChartType || "area"}
                                    onChange={(e) => handleEditCategory(selectedCategory.id, "visualChartType", e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="area">Area Chart</option>
                                    <option value="bar">Bar Chart</option>
                                    <option value="line">Line Chart</option>
                                    <option value="radar">Radar Plot</option>
                                    <option value="gauge">Circular Gauge</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 7: visual Presets templates */}
                          {inspectorTab === "presets" && (
                            <div className="space-y-4">
                              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block text-left">Biohacking Presets Templates</span>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => applyPresetTemplate("spartan")}
                                  className="p-3 rounded-xl bg-cyan-950/10 border border-cyan-500/25 hover:bg-cyan-950/30 text-cyan-400 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-4 h-4" /> Spartan Biohacker
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPresetTemplate("zen")}
                                  className="p-3 rounded-xl bg-pink-950/10 border border-pink-500/25 hover:bg-pink-950/30 text-pink-400 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4" /> Mindfulness Zen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPresetTemplate("athlete")}
                                  className="p-3 rounded-xl bg-purple-950/10 border border-purple-500/25 hover:bg-purple-950/30 text-purple-400 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  <Volume2 className="w-4 h-4" /> Cyber Athlete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPresetTemplate("scholar")}
                                  className="p-3 rounded-xl bg-yellow-950/10 border border-yellow-500/25 hover:bg-yellow-950/30 text-yellow-400 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4" /> Academic Scholar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Workout Split Muscle Groups */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                  <h4 className="text-white font-extrabold text-xs uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4" /> Workout Split Muscle Groups
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {workoutCategories.map((name) => (
                      <div key={name} className="flex justify-between items-center p-2.5 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkoutCategory(name)}
                          className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer border border-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import category template slot */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between gap-4">
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Template Importer</span>
                    <span className="text-[10px] text-gray-500 block">Restore a single category layout JSON file.</span>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCategory}
                    id="import-cat-file"
                    className="hidden"
                  />
                  <label
                    htmlFor="import-cat-file"
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Import Category JSON
                  </label>
                </div>
              </div>
            )}

            {/* Render Quotes List */}
            {activeTab === "quotes" && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {quotes.length === 0 ? (
                  <p className="text-gray-500 text-xs py-10 text-center">Empty quotes list.</p>
                ) : (
                  quotes.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 flex flex-col">
                      <div className="flex gap-2 items-start justify-between">
                        <textarea
                          value={q.text}
                          onChange={(e) => handleEditQuote(idx, "text", e.target.value)}
                          className="flex-1 bg-transparent border-b border-transparent focus:border-neon-yellow py-0.5 text-xs sm:text-sm text-white focus:outline-none min-h-[50px] resize-y"
                        />
                        <button
                          onClick={() => handleDeleteQuote(idx)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-all hover:bg-white/5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 pl-1.5 self-start">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">— Author:</span>
                        <input
                          type="text"
                          value={q.author}
                          onChange={(e) => handleEditQuote(idx, "author", e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-neon-yellow text-xs text-white focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Render Missions List */}
            {activeTab === "missions" && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {missions.map((mission, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-left">
                    <span className="text-[10px] font-extrabold text-neon-purple uppercase block">Day {idx + 1} Mission Prompt</span>
                    <input
                      type="text"
                      value={mission}
                      onChange={(e) => handleEditMission(idx, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-neon-purple py-0.5 text-xs sm:text-sm text-white focus:outline-none font-bold"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
