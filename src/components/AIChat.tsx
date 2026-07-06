import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2, Brain, AlertTriangle, Key, ArrowRight, User, Loader2 } from "lucide-react";
import type { UserProfile, DayLog, Habit } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIChatProps {
  profile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  currentLog: DayLog;
  habitsList: Habit[];
}

// A premium helper to parse simple markdown (bold, lists, code, tables) into clean JSX
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  const renderedElements: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-xs sm:text-sm text-gray-300">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      // Basic heuristic to skip separator line (e.g., |---|---|)
      const cleanRows = tableRows.filter(row => !row.every(cell => cell.trim().match(/^:?-+:?$/)));
      if (cleanRows.length > 0) {
        const headers = cleanRows[0];
        const bodyRows = cleanRows.slice(1);

        renderedElements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 rounded-xl border border-white/5 bg-black/30">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs">
              <thead className="bg-white/5">
                <tr>
                  {headers.map((cell, idx) => (
                    <th key={idx} className="px-4 py-2 font-black text-white uppercase tracking-wider">
                      {parseInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 text-gray-300 whitespace-nowrap">
                        {parseInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineMarkdown = (str: string): React.ReactNode[] => {
    // Replace **bold** with <strong> elements
    const parts: React.ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [str];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Code block check
    if (line.startsWith("```")) {
      flushList(`code-${i}`);
      flushTable(`code-${i}`);
      let codeText = "";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeText += lines[i] + "\n";
        i++;
      }
      renderedElements.push(
        <pre key={`code-${i}`} className="bg-black/60 border border-white/5 text-neon-cyan p-3 rounded-xl font-mono text-[10px] sm:text-xs overflow-x-auto my-2 max-w-full">
          <code>{codeText}</code>
        </pre>
      );
      continue;
    }

    // Table Row Check (starts and ends with | or contains pipes)
    if (line.startsWith("|") && line.endsWith("|")) {
      flushList(`table-${i}`);
      inTable = true;
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // If we were parsing a table and a non-table line appears, flush it
      flushTable(`table-flush-${i}`);
    }

    // List Check
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
      inList = true;
      const cleanLine = line.replace(/^(-|\*|\d+\.)\s+/, "");
      listItems.push(cleanLine);
      continue;
    } else if (inList) {
      flushList(`list-flush-${i}`);
    }

    // Heading Checks
    if (line.startsWith("#")) {
      const depth = line.match(/^#+/)?.[0].length || 1;
      const textOnly = line.replace(/^#+\s+/, "");
      const sizeClass = depth === 1 ? "text-base sm:text-lg font-black text-white tracking-wide uppercase my-3" 
                        : depth === 2 ? "text-sm sm:text-base font-extrabold text-neon-cyan tracking-wider uppercase my-2" 
                        : "text-xs sm:text-sm font-bold text-gray-200 uppercase my-1.5";
      renderedElements.push(
        <div key={i} className={sizeClass}>
          {parseInlineMarkdown(textOnly)}
        </div>
      );
      continue;
    }

    // Normal line
    if (line !== "") {
      renderedElements.push(
        <p key={i} className="text-xs sm:text-sm text-gray-300 leading-relaxed my-1">
          {parseInlineMarkdown(line)}
        </p>
      );
    } else {
      // Line break
      renderedElements.push(<div key={i} className="h-2"></div>);
    }
  }

  // Flush remaining elements at the end
  flushList("end");
  flushTable("end");

  return renderedElements;
};

export const AIChat: React.FC<AIChatProps> = ({ profile, onUpdateProfile, currentLog, habitsList }) => {
  const activeKey = profile.groqApiKey || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Key setup states
  const [setupKey, setSetupKey] = useState("");
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from LocalStorage
  useEffect(() => {
    const savedChat = localStorage.getItem(`discipline_chat_history_${profile.id}`);
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    } else {
      // Default welcome message
      setMessages([
        {
          role: "assistant",
          content: `Welcome back, **${profile.username || "Challenger"}**! I am your **Discipline AI Coach**, powered by **Groq**.\n\nI have scanned your active goals, habit matrix, and stats. Ask me anything about this application (e.g. how the scoring algorithm works, suggestions for dumbbell back routines, or advice on recovery challenges). How can I push you to conquer your metrics today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [profile.id, profile.username]);

  // Save chat history to LocalStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`discipline_chat_history_${profile.id}`, JSON.stringify(messages));
    }
  }, [messages, profile.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const callAIModelDirect = async (
    apiKey: string,
    messagesList: { role: string; content: string }[],
    systemInstruction: string
  ): Promise<string> => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemInstruction },
          ...messagesList
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      let errText = `HTTP Error ${response.status}`;
      try {
        const errJSON = await response.json();
        if (errJSON.error) {
          if (typeof errJSON.error === "string") {
            errText = errJSON.error;
          } else if (typeof errJSON.error === "object" && errJSON.error.message) {
            errText = errJSON.error.message;
          }
        } else if (errJSON.message) {
          errText = errJSON.message;
        }
      } catch (e) {
        try {
          errText = await response.text() || errText;
        } catch (_) {}
      }
      throw new Error(`Groq Error: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received from Groq.";
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    if (!textToSend) {
      setInputVal("");
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { role: "user", content: text, timestamp };
    const updatedMessages = [...messages, newMsg];
    
    setMessages(updatedMessages);
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Build active day summary with habit text labels for AI context
      const completedHabits = habitsList
        .filter(h => currentLog.habits[h.id]?.completed)
        .map(h => h.text);

      const incompleteHabits = habitsList
        .filter(h => !currentLog.habits[h.id]?.completed)
        .map(h => h.text);

      const logSummary = {
        dayNumber: currentLog.dayNumber,
        disciplineScore: currentLog.disciplineScore,
        waterIntake: currentLog.waterIntake,
        waterGoal: profile.waterGoal,
        completedHabits,
        incompleteHabits,
        warnings: currentLog.warnings || [],
        penalties: currentLog.penalties || [],
        sleepHours: currentLog.sleepHours,
        screenTime: currentLog.screenTime,
        journalCompleted: currentLog.journal?.completed || false,
      };

      const systemPrompt = `Role: "Discipline AI Coach" in 7 Days of Discipline Challenge App.
App Guide:
  Dashboard: Streak, days 1-7, countdown timer.
  Habit Matrix: 36 habits. Score (0-100) = Morning Routines (20%) + Clean Food (20%) + Physical Execution (30%) + Lifestyle (15%) + Focus (15%).
  Workouts: Dumbbell/bodyweight splits (Chest, Back, Biceps, Shoulders, Legs, Core) + sets logs + offline audio rest timer (Web Audio API).
  Nutrition: Water logging (+250ml, +500ml, +1L) & macro targets tracker.
  Mind Journal: 5 daily reflection questions.
  Analytics: Recharts graphs.
  Gamification: Levels 1-10+, badges (Early Bird, No Phone Hero, Iron Discipline, Protein Master, Workout Beast, Consistency King, 7-Day Champion).
  Penalties: Neglected habits trigger Warnings/Penalties; clear them via recovery tasks.
  Settings/CMS: Custom habits, workouts, quotes, and missions config.

Context:
User Profile:
  Username: ${profile.username || "Challenger"}
  Level: ${profile.level || 1} (XP: ${profile.xp || 0})
  Streak: ${profile.streak || 0} days (Best: ${profile.bestStreak || 0} days)
  Badges: [${(profile.badges || []).join(", ") || "None"}]
Active Day Logs (Day ${logSummary.dayNumber || 1}):
  Score: ${logSummary.disciplineScore || 0}/100
  Water Intake: ${logSummary.waterIntake || 0}ml / ${logSummary.waterGoal || 3000}ml
  Completed Habits: [${(logSummary.completedHabits || []).join(", ") || "None"}]
  Incomplete Habits: [${(logSummary.incompleteHabits || []).join(", ") || "None"}]
  Active Warnings: [${(logSummary.warnings || []).join(", ") || "None"}]
  Reflections Journal: ${logSummary.journalCompleted ? "Completed" : "Incomplete"}
  Sleep Logged: ${logSummary.sleepHours ? logSummary.sleepHours + " hours" : "None"}
  Screen Time Logged: ${logSummary.screenTime ? logSummary.screenTime + " minutes" : "None"}

Instructions:
- Provide tough-love, direct, highly motivating coaching.
- Keep replies punchy, motivating, structured, and short (under 200 words) to save tokens. Use lists or tables when helpful.
- Reference user's active logs correctly. If warnings exist or water/habits are incomplete, call them out.`;

      if (!activeKey) {
        throw new Error("xAI Grok API Key is missing. Please configure it in the panel.");
      }

      // Direct call to API from client (great for Standalone WebView / standalone React)
      const assistantText = await callAIModelDirect(
        activeKey,
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt
      );
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: assistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error("AI Coach Error:", err);
      setErrorMsg(err.message || "Failed to communicate with AI Coach. Verify your connection or API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAPIKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupKey.trim()) return;

    onUpdateProfile({ groqApiKey: setupKey.trim() });
    setSavedKeySuccess(true);
    setSetupKey("");
    setTimeout(() => {
      setSavedKeySuccess(false);
    }, 3000);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      const defaultWelcome: Message[] = [
        {
          role: "assistant",
          content: `History cleared. Ready to start fresh, **${profile.username || "Challenger"}**. Ask me anything about your training, nutrition targets, or penalties.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultWelcome);
      localStorage.setItem(`discipline_chat_history_${profile.id}`, JSON.stringify(defaultWelcome));
    }
  };

  const suggestions = [
    { title: "Understand Rules", text: "How is my Discipline Score computed across categories?" },
    { title: "Get Workout Splts", text: "Recommend a bodyweight/dumbbell back workout routine." },
    { title: "Clear Warnings", text: "How do warning penalties work, and how do I clear them?" },
    { title: "Nutrition Advice", text: "Suggest some high-protein meal options to hit my nutrition target." }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      
      {/* Dynamic Coach Details / Info Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden text-left border border-white/5 shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/15 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
              <Brain className="w-5 h-5 text-neon-purple animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider leading-none">AI Coach Hub</h3>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">Groq Engine</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
            The Discipline Coach has complete access to your 7-day challenge variables, active checklist categories, and macros goals. Ask for form assistance, motivational reality checks, or guidelines.
          </p>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block">Engine Connection Status</span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`w-2 h-2 rounded-full ${activeKey ? "bg-neon-green animate-ping" : "bg-neon-orange"}`}></span>
                <span className={`text-[10px] font-bold ${activeKey ? "text-neon-green" : "text-neon-orange"}`}>
                  {activeKey ? "Groq Connected" : "Missing API Key"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block">Context Scope</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {["Habit Weights", "Workout Splits", "Nutrition Targets", "Warning Recoveries"].map((tag, idx) => (
                  <span key={idx} className="text-[8px] bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Cards */}
        <div className="hidden lg:block space-y-3 text-left">
          <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-wider px-2">Recommended Inquiries</h4>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug.text)}
              disabled={isLoading || !profile.groqApiKey}
              className="w-full glass-card hover:glass-panel-glow hover:border-neon-purple/20 p-3 rounded-2xl text-left cursor-pointer transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed group border border-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-wider">{sug.title}</span>
                <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-neon-cyan transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">"{sug.text}"</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Column */}
      <div className="lg:col-span-3 flex flex-col h-[75vh] min-h-[500px] glass-panel rounded-3xl relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute top-0 left-[30%] w-48 h-48 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Chat Area Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/10 select-none z-10">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse"></div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Discipline AI Coach</h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">Powered by Groq</p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            title="Wipe Chat History"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer hover:border-neon-pink/20 hover:text-neon-pink"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messaging Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left z-10 scroll-smooth">
          
          {/* Missing API Key Warnings Block */}
          {!activeKey && (
            <div className="glass-card border-neon-orange/20 bg-neon-orange/5 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 max-w-md mx-auto my-8">
              <div className="p-3 rounded-full bg-neon-orange/10 border border-neon-orange/25">
                <Key className="w-6 h-6 text-neon-orange" />
              </div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
                Configure Groq API Key
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                To start chat-coaching, paste your Groq API Key (gsk_...). Your key is stored locally in your private challenge database and is never shared.
              </p>
              
              <form onSubmit={handleSaveAPIKey} className="w-full flex items-center gap-2 mt-2">
                <input
                  type="password"
                  placeholder="Paste gsk_ API key"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="flex-1 bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-neon-orange text-black font-extrabold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Activate
                </button>
              </form>

              {savedKeySuccess && (
                <span className="text-neon-green text-[10px] font-bold">✓ Key configured! Ready to begin chat.</span>
              )}

              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-neon-cyan hover:underline flex items-center gap-1 mt-1.5"
              >
                Get Groq API Key <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Actual messages loop */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Profile Avatar / Coach Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 text-white select-none ${
                msg.role === "user" 
                  ? "bg-linear-to-tr from-neon-purple to-neon-pink border-neon-purple/20" 
                  : "bg-linear-to-tr from-neon-cyan to-neon-purple border-neon-cyan/20"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>

              {/* Chat Bubble Container */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-left border ${
                  msg.role === "user"
                    ? "bg-linear-to-r from-neon-purple/10 to-neon-cyan/10 border-neon-purple/20 text-white rounded-tr-none"
                    : "glass-card border-white/5 text-gray-200 rounded-tl-none shadow-md shadow-black/25"
                }`}>
                  {renderMarkdown(msg.content)}
                </div>
                <span className={`text-[9px] text-gray-500 font-bold uppercase tracking-wider block px-1 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Thinking / Loading State */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0 bg-linear-to-tr from-neon-cyan to-neon-purple border-neon-cyan/20 text-white">
                <Brain className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="p-4 rounded-2xl rounded-tl-none glass-card border-white/5 text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neon-cyan" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500 animate-pulse">
                    Consulting Discipline Core via Groq...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-4 rounded-2xl glass-card border-neon-pink/30 bg-neon-pink/5 text-neon-pink text-xs flex items-start gap-2 max-w-[85%] mx-auto">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-extrabold uppercase tracking-wide">Coach Execution Failed</p>
                <p className="text-gray-300 leading-relaxed">{errorMsg}</p>
                {errorMsg.toLowerCase().includes("key") && (
                  <button
                    onClick={() => onUpdateProfile({ groqApiKey: "" })}
                    className="mt-1 text-[10px] text-neon-cyan hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Clear and reset API Key
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Text Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-white/5 bg-black/25 flex items-center gap-2 z-10"
        >
          <input
            type="text"
            disabled={isLoading || !activeKey}
            placeholder={activeKey ? "Ask the Discipline Coach anything..." : "Please configure your API key above to send a message..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 glass-input rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim() || !activeKey}
            className="p-3.5 rounded-2xl bg-linear-to-r from-neon-purple to-neon-cyan hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
