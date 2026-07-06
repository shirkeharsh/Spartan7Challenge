import React, { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== "undefined") {
      return !!(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone);
    }
    return false;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled) return null;

  // iOS Safari check
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & typeof globalThis & { MSStream?: unknown }).MSStream;

  if (isIOS) {
    return (
      <div className="glass-card p-4 rounded-2xl mb-6 text-sm border border-neon-purple/20">
        <div className="flex items-center gap-3 text-neon-purple font-semibold mb-1">
          <Share className="w-4 h-4 text-neon-purple" />
          Install Mobile App
        </div>
        <p className="text-gray-400 text-xs">
          To install this app on your iPhone: tap the{" "}
          <span className="font-bold text-white text-xs">Share</span> button in Safari,
          then select <span className="font-bold text-white text-xs">Add to Home Screen</span>.
        </p>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="glass-panel-glow p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-neon-purple/30">
      <div>
        <h4 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
          <Download className="w-5 h-5 text-neon-cyan" />
          Install Discipline App
        </h4>
        <p className="text-gray-400 text-xs mt-1">
          Add "7 Days of Discipline" to your home screen for rapid offline loading, full-screen immersion, and alerts.
        </p>
      </div>
      <button
        onClick={handleInstallClick}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
      >
        Install Now
      </button>
    </div>
  );
};
