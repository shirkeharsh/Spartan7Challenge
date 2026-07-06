export class NotificationService {
  static isSupported(): boolean {
    return "Notification" in window;
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return "denied";
    }
    return await Notification.requestPermission();
  }

  static getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return "denied";
    }
    return Notification.permission;
  }

  static triggerLocalNotification(title: string, body: string, delayMs = 0): void {
    if (!this.isSupported() || this.getPermission() !== "granted") {
      console.warn("Notifications not supported or permission not granted.");
      return;
    }

    if (delayMs > 0) {
      setTimeout(() => {
        this.fire(title, body);
      }, delayMs);
    } else {
      this.fire(title, body);
    }
  }

  static playNotificationSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;

      // Play double-tone chime sound (C5 and G5)
      // First tone: C5 (523.25 Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.06, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone: G5 (783.99 Hz, starting slightly later)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain2.gain.setValueAtTime(0.06, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn("Notification sound play blocked or unsupported:", err);
    }
  }

  private static fire(title: string, body: string): void {
    try {
      // Trigger Audio Chime
      this.playNotificationSound();

      // iOS PWA standalone requires ServiceWorkerRegistration to show notifications when minimized
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/logo.jpg",
            badge: "/logo.jpg",
            vibrate: [200, 100, 200],
          } as NotificationOptions);
        });
      } else {
        // Fallback to standard window Notification
        new Notification(title, {
          body,
          icon: "/logo.jpg",
          badge: "/logo.jpg",
        });
      }
    } catch (err) {
      console.error("Failed to fire notification:", err);
    }
  }
}

export default NotificationService;
