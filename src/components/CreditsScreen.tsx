import React from "react";
import { Flame, Shield, ChevronRight } from "lucide-react";

interface CreditsScreenProps {
  onEnter: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#06070a] text-[#f3f4f6] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Immersive radial background glows */}
      <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse animation-delay-2000"></div>

      <div className="w-full max-w-lg bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 text-center space-y-8 shadow-2xl relative">
        {/* Glow overlay */}
        <div className="absolute -inset-px rounded-[32px] bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 opacity-40 blur-xs -z-10"></div>

        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="relative p-5 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-lg shadow-neon-purple/5">
            <Flame className="w-12 h-12 text-neon-purple animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-cyan rounded-full animate-ping opacity-60"></div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
            7 Days of Discipline
          </h1>
          <p className="text-[10px] text-neon-cyan font-bold tracking-[0.2em] uppercase">
            Native Android Edition
          </p>
        </div>

        {/* Credits Panel */}
        <div className="py-6 px-4 bg-white/5 border border-white/5 rounded-2xl space-y-4 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <Shield className="w-40 h-40 text-white" />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-cyan opacity-40 blur-md rounded-full"></div>
            <div className="relative w-24 h-24 rounded-full border border-white/10 bg-black/60 flex items-center justify-center shadow-lg shadow-neon-purple/20">
              <span className="text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-white to-neon-cyan leading-none font-mono">
                M
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Crafted with Rigorous Discipline
          </p>
        </div>

        {/* Quote */}
        <div className="italic text-gray-500 text-xs py-2">
          "He who conquers himself is mightier than he who conquers a city."
        </div>

        {/* Action Button */}
        <button
          onClick={onEnter}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white text-xs font-black uppercase tracking-widest cursor-pointer hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          <span>Enter Challenge Arena</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CreditsScreen;
