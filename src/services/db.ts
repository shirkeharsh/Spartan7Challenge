import type { DayLog, UserProfile } from "../types";

const DB_NAME = "DisciplineChallengeDB";
const DB_VERSION = 2;
const LOG_STORE = "logs";
const STATE_STORE = "state";
const USERS_STORE = "users";

class DBService {
  private db: IDBDatabase | null = null;
  private fallbackMode = false;

  constructor() {
    this.initDB().catch((err) => {
      console.warn("IndexedDB failed to initialize. Falling back to localStorage:", err);
      this.fallbackMode = true;
    });
  }

  public get isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (e) => {
        const db = request.result;
        const oldVersion = e.oldVersion;

        // Recreate logs store if upgrade happens from 1 to 2
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(LOG_STORE)) {
            db.deleteObjectStore(LOG_STORE);
          }
        }

        if (!db.objectStoreNames.contains(LOG_STORE)) {
          db.createObjectStore(LOG_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE);
        }
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          db.createObjectStore(USERS_STORE, { keyPath: "id" });
        }
      };
    });
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return this.initDB();
  }

  // --- Day Logs API ---

  // Save Day Log
  async saveDayLog(log: DayLog): Promise<void> {
    if (this.fallbackMode) {
      localStorage.setItem(`day_log_${log.id}`, JSON.stringify(log));
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOG_STORE], "readwrite");
        const store = transaction.objectStore(LOG_STORE);
        const request = store.put(log);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB write failed, writing to localStorage:", err);
      localStorage.setItem(`day_log_${log.id}`, JSON.stringify(log));
    }
  }

  // Get Day Log
  async getDayLog(userId: string, dayNumber: number): Promise<DayLog | null> {
    const key = `${userId}_${dayNumber}`;
    if (this.fallbackMode) {
      const val = localStorage.getItem(`day_log_${key}`);
      return val ? JSON.parse(val) : null;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOG_STORE], "readonly");
        const store = transaction.objectStore(LOG_STORE);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB read failed, reading from localStorage:", err);
      const val = localStorage.getItem(`day_log_${key}`);
      return val ? JSON.parse(val) : null;
    }
  }

  // Get All Day Logs for User
  async getAllDayLogsForUser(userId: string): Promise<DayLog[]> {
    if (this.fallbackMode) {
      const logs: DayLog[] = [];
      for (let i = 1; i <= 7; i++) {
        const key = `${userId}_${i}`;
        const val = localStorage.getItem(`day_log_${key}`);
        if (val) logs.push(JSON.parse(val));
      }
      return logs.sort((a, b) => a.dayNumber - b.dayNumber);
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOG_STORE], "readonly");
        const store = transaction.objectStore(LOG_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = (request.result || []) as DayLog[];
          const userLogs = results.filter((log) => log.userId === userId);
          resolve(userLogs.sort((a, b) => a.dayNumber - b.dayNumber));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IndexedDB read all failed, reading from localStorage:", err);
      const logs: DayLog[] = [];
      for (let i = 1; i <= 7; i++) {
        const key = `${userId}_${i}`;
        const val = localStorage.getItem(`day_log_${key}`);
        if (val) logs.push(JSON.parse(val));
      }
      return logs;
    }
  }

  // --- Users API ---

  // Get All User Profiles
  async getAllUsers(): Promise<UserProfile[]> {
    if (this.fallbackMode) {
      const val = localStorage.getItem("users_list");
      return val ? JSON.parse(val) : [];
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE], "readonly");
        const store = transaction.objectStore(USERS_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("Failed to read users from IndexedDB:", err);
      const val = localStorage.getItem("users_list");
      return val ? JSON.parse(val) : [];
    }
  }

  // Save User Profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    // 1. Save specific user profile in users list
    if (this.fallbackMode) {
      const list = await this.getAllUsers();
      const next = list.filter((u) => u.id !== profile.id);
      next.push(profile);
      localStorage.setItem("users_list", JSON.stringify(next));
      return;
    }

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE], "readwrite");
        const store = transaction.objectStore(USERS_STORE);
        const request = store.put(profile);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("Failed to save user profile in IndexedDB:", err);
      const list = await this.getAllUsers();
      const next = list.filter((u) => u.id !== profile.id);
      next.push(profile);
      localStorage.setItem("users_list", JSON.stringify(next));
    }
  }

  // Get Active User ID
  async getActiveUserId(): Promise<string | null> {
    return this.getState("active_user_id");
  }

  // Set Active User ID
  async setActiveUserId(userId: string): Promise<void> {
    await this.saveState("active_user_id", userId);
  }

  // Delete User and all associated day logs
  async deleteUser(userId: string): Promise<void> {
    // LocalStorage delete
    if (this.fallbackMode) {
      const list = await this.getAllUsers();
      const next = list.filter((u) => u.id !== userId);
      localStorage.setItem("users_list", JSON.stringify(next));

      for (let i = 1; i <= 7; i++) {
        localStorage.removeItem(`day_log_${userId}_${i}`);
      }
      return;
    }

    try {
      const db = await this.getDB();
      // Delete user profile
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE], "readwrite");
        const store = transaction.objectStore(USERS_STORE);
        const request = store.delete(userId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Delete user logs
      const transaction = db.transaction([LOG_STORE], "readwrite");
      const store = transaction.objectStore(LOG_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as DayLog[];
        results.forEach((log) => {
          if (log.userId === userId) {
            store.delete(log.id);
          }
        });
      };
    } catch (err) {
      console.error("Failed to delete user from IndexedDB:", err);
    }
  }

  // --- Backup Exporter/Importer ---

  // Export entire DB to JSON
  async exportToJSON(): Promise<string> {
    const users = await this.getAllUsers();
    
    // Fetch day logs for all users
    let logs: DayLog[] = [];
    if (this.fallbackMode) {
      users.forEach((u) => {
        for (let i = 1; i <= 7; i++) {
          const val = localStorage.getItem(`day_log_${u.id}_${i}`);
          if (val) logs.push(JSON.parse(val));
        }
      });
    } else {
      try {
        const db = await this.getDB();
        logs = await new Promise<DayLog[]>((resolve, reject) => {
          const transaction = db.transaction([LOG_STORE], "readonly");
          const store = transaction.objectStore(LOG_STORE);
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } catch (err) {
        console.error("Failed to export logs:", err);
      }
    }

    const activeUserId = await this.getActiveUserId();
    const customHabits = await this.getState("custom_habits");
    const customExercises = await this.getState("custom_exercises");
    const customQuotes = await this.getState("custom_quotes");
    const customMissions = await this.getState("custom_missions");
    const customHabitCategories = await this.getState("custom_habit_categories");
    const customWorkoutCategories = await this.getState("custom_workout_categories");

    const backupData = {
      users,
      logs,
      activeUserId,
      customHabits,
      customExercises,
      customQuotes,
      customMissions,
      customHabitCategories,
      customWorkoutCategories,
      exportTimestamp: new Date().toISOString(),
      version: DB_VERSION,
    };
    return JSON.stringify(backupData, null, 2);
  }

  // Import entire DB from JSON
  async importFromJSON(jsonString: string): Promise<void> {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup || typeof backup !== "object") {
        throw new Error("Invalid backup data format.");
      }

      // Save users
      if (Array.isArray(backup.users)) {
        for (const u of backup.users) {
          await this.saveUserProfile(u);
        }
      }

      // Save day logs
      if (Array.isArray(backup.logs)) {
        for (const log of backup.logs) {
          if (log && log.id) {
            await this.saveDayLog(log);
          }
        }
      }

      // Save states
      if (backup.activeUserId) await this.setActiveUserId(backup.activeUserId);
      if (backup.customHabits) await this.saveState("custom_habits", backup.customHabits);
      if (backup.customExercises) await this.saveState("custom_exercises", backup.customExercises);
      if (backup.customQuotes) await this.saveState("custom_quotes", backup.customQuotes);
      if (backup.customMissions) await this.saveState("custom_missions", backup.customMissions);
      if (backup.customHabitCategories) await this.saveState("custom_habit_categories", backup.customHabitCategories);
      if (backup.customWorkoutCategories) await this.saveState("custom_workout_categories", backup.customWorkoutCategories);
    } catch (err) {
      console.error("Backup import failed:", err);
      throw err;
    }
  }

  // Generic Save State
  async saveState<T>(key: string, data: T): Promise<void> {
    if (this.fallbackMode) {
      localStorage.setItem(`state_${key}`, JSON.stringify(data));
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STATE_STORE], "readwrite");
        const store = transaction.objectStore(STATE_STORE);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`IndexedDB write failed for key ${key}, writing to localStorage:`, err);
      localStorage.setItem(`state_${key}`, JSON.stringify(data));
    }
  }

  // Generic Get State
  async getState<T>(key: string): Promise<T | null> {
    if (this.fallbackMode) {
      const val = localStorage.getItem(`state_${key}`);
      return val ? JSON.parse(val) as T : null;
    }

    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction([STATE_STORE], "readonly");
        const store = transaction.objectStore(STATE_STORE);
        const request = store.get(key);

        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`IndexedDB read failed for key ${key}, reading from localStorage:`, err);
      const val = localStorage.getItem(`state_${key}`);
      return val ? JSON.parse(val) as T : null;
    }
  }

  // Clear all databases
  async clearAll(): Promise<void> {
    if (this.fallbackMode) {
      localStorage.clear();
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([LOG_STORE, STATE_STORE, USERS_STORE], "readwrite");
        transaction.objectStore(LOG_STORE).clear();
        transaction.objectStore(STATE_STORE).clear();
        transaction.objectStore(USERS_STORE).clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      console.error("Clear database failed, clearing localStorage:", err);
      localStorage.clear();
    }
  }
}

export const dbService = new DBService();
export default dbService;
