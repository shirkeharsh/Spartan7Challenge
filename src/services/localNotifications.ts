import { LocalNotifications } from "@capacitor/local-notifications";

const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor !== undefined;

export class LocalNotificationService {
  static async initChannels(): Promise<void> {
    if (!isCapacitor) return;
    try {
      // Suffix with _v2 to force Android to register brand new notification channels with corrected sounds
      
      // 1. Create channel for chime sound
      await LocalNotifications.createChannel({
        id: "chime_channel_v2",
        name: "Trainer Chime Alarms",
        description: "Pleasant high-pitch double chime alerts",
        sound: "chime", // Android raw resource reference (OMIT .wav EXTENSION!)
        importance: 5, // High priority (audio chime and heads-up banner display)
        visibility: 1, // Visible on lock screen
        vibration: true,
      });

      // 2. Create channel for rapid buzzer alarm sound
      await LocalNotifications.createChannel({
        id: "alarm_channel_v2",
        name: "Trainer Buzzer Alarms",
        description: "Loud repeating 1200Hz digital alarm buzzer alert",
        sound: "alarm", // OMIT .wav EXTENSION!
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      // 3. Create channel for emergency siren sound
      await LocalNotifications.createChannel({
        id: "siren_channel_v2",
        name: "Trainer Siren Alarms",
        description: "Intense sweep emergency siren workouts reminder",
        sound: "siren", // OMIT .wav EXTENSION!
        importance: 5,
        visibility: 1,
        vibration: true,
      });
      console.log("✔ Capacitor notification channels _v2 registered successfully.");
    } catch (e) {
      console.error("Failed to initialize Capacitor notification channels:", e);
    }
  }

  static async requestPermission(): Promise<boolean> {
    if (!isCapacitor) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      }
      return false;
    }
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted";
    } catch (e) {
      console.error("Capacitor requestPermission error:", e);
      return false;
    }
  }

  static async checkPermission(): Promise<boolean> {
    if (!isCapacitor) {
      if ("Notification" in window) {
        return Notification.permission === "granted";
      }
      return false;
    }
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === "granted";
    } catch (e) {
      console.error("Capacitor checkPermissions error:", e);
      return false;
    }
  }

  static async scheduleDailyAlarm(
    id: number,
    title: string,
    body: string,
    hour: number,
    minute: number,
    soundName: "chime" | "alarm" | "siren" = "chime"
  ): Promise<boolean> {
    if (!isCapacitor) {
      console.log(`[Web Fallback] Scheduled Daily Alarm #${id} at ${hour}:${minute} using tone "${soundName}" - "${title}: ${body}"`);
      return true;
    }
    try {
      await this.cancelAlarm(id);
      
      const channelId = `${soundName}_channel_v2`;
      const soundFile = soundName; // OMIT EXTENSION!

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: {
              on: { hour, minute },
              repeats: true,
              allowWhileIdle: true, // Wakes up locked/sleeping Android device
            },
            channelId, // Connects to the created native Android channel v2
            sound: soundFile, // iOS / Android legacy sound override reference
            smallIcon: "res://ic_stat_name", 
          },
        ],
      });
      return true;
    } catch (e) {
      console.error("Capacitor scheduleDailyAlarm error:", e);
      return false;
    }
  }

  static async scheduleTestAlarm(
    id: number,
    title: string,
    body: string,
    secondsDelay: number,
    soundName: "chime" | "alarm" | "siren" = "chime"
  ): Promise<boolean> {
    if (!isCapacitor) {
      console.log(`[Web Fallback] Scheduled Test Alarm #${id} in ${secondsDelay}s using tone "${soundName}" - "${title}: ${body}"`);
      setTimeout(() => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body });
        } else {
          alert(`🔔 [ALARM TEST] ${title}: ${body}`);
        }
      }, secondsDelay * 1000);
      return true;
    }
    try {
      await this.cancelAlarm(id);
      const fireAt = new Date(Date.now() + secondsDelay * 1000);
      const channelId = `${soundName}_channel_v2`;
      const soundFile = soundName; // OMIT EXTENSION!

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: fireAt, allowWhileIdle: true },
            channelId,
            sound: soundFile,
          },
        ],
      });
      return true;
    } catch (e) {
      console.error("Capacitor scheduleTestAlarm error:", e);
      return false;
    }
  }

  static async cancelAlarm(id: number): Promise<void> {
    if (!isCapacitor) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id }],
      });
    } catch (e) {
      console.error("Capacitor cancelAlarm error:", e);
    }
  }

  static async cancelAllAlarms(): Promise<void> {
    if (!isCapacitor) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
    } catch (e) {
      console.error("Capacitor cancelAllAlarms error:", e);
    }
  }

  static async getPendingAlarms(): Promise<any[]> {
    if (!isCapacitor) return [];
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (e) {
      console.error("Capacitor getPendingAlarms error:", e);
      return [];
    }
  }
}

export default LocalNotificationService;
