# 🛡️ Spartan 7 Challenge (7 Days of Discipline)

<p align="center">
  <img src="public/logo.jpg" alt="Spartan 7 Challenge Logo" width="160" style="border-radius: 20px;" />
</p>

[![React 19](https://img.shields.io/badge/React-19.0.0-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Capacitor 8](https://img.shields.io/badge/Capacitor-v8.4-119EFF.svg?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Spartan 7 Challenge** is a premium, feature-rich, and gamified self-discipline tracker built to help users master their habits, workouts, nutrition, and mental focus over a strict 7-day sprint. Available as a highly responsive Web App (PWA) and a native Mobile App (via Capacitor).

---

## 🚀 Key Features

The project is built around modular React components that provide a high-fidelity experience:

### 1. 📊 Interactive Dashboard
- **Discipline Score**: Dynamically calculated percentage based on your completed habits, workouts, water intake, and journaling.
- **Daily Missions**: Time-sensitive tasks to earn extra experience points (XP).
- **Daily Quote Engine**: Keeps you motivated with handpicked Stoic and warrior mindset quotes.

### 2. 📝 Gamified Habit Tracker
- Tracks custom and default habits across distinct categories (e.g., Mind, Body, Spirit).
- Automatic streak tracking and leveling up through an XP-based gamification engine.

### 3. 🏋️ Workout & Fitness Planner
- Pre-loaded exercise routines with detailed instructions, durations, sets, and rep tracking.
- Interactive workout logging system with category filters.

### 4. 🍎 Nutrition & Hydration Monitor
- **Water Tracker**: Incremental hydration logger (mL) with progress bars matching daily targets.
- **Calorie & Macronutrient Tracker**: Logs protein, carbs, fats, and overall calories.

### 5. 🤖 AI Discipline Coach (AIChat)
- An integrated AI assistant powered by local prompts to answer discipline-related questions, offer tips, and act as an accountability partner.

### 6. ⚖️ Punishment & Accountability System
- Penalizes streaks and profiles if rules are broken or daily minimum requirements are missed.

### 7. 📈 Advanced Analytics (Recharts)
- Visualizes discipline scores, habits completion history, and caloric input trends over time.

### 8. 🏆 Social & Gamification Leaderboard
- Compare your discipline scores, level, and XP with friends.
- Search and add friends directly inside the app.

### 9. 🔔 Local Reminders & Notifications
- Integration with `@capacitor/local-notifications` to schedule periodic check-ins.
- Local custom scheduling controls inside the app interface.

---

## 🛠️ Technology Stack

- **Core Library:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** IndexedDB (implemented via a robust, transaction-safe local database service `db.ts`)
- **Native Mobile Wrapper:** [Capacitor 8](https://capacitorjs.com/) (configured for Android build pipelines)
- **Charts & Graphics:** [Recharts](https://recharts.org/) & [Lucide React](https://lucide.dev/) for crisp vector iconography

---

## 📁 Repository Structure

```bash
├── android/               # Native Android studio project files (Capacitor wrapper)
├── dist/                  # Built assets for production deployment
├── public/                # Static public assets (manifest, icons, service worker)
├── src/
│   ├── assets/            # App icons and media assets
│   ├── components/        # Reusable React components (Dashboard, HabitTracker, etc.)
│   ├── data/              # Core datasets (exercises lists, constants)
│   ├── services/          # Services (IndexedDB wrapper, notification scheduler)
│   ├── utils/             # Helper utilities (haptics, calculation formulas)
│   ├── App.tsx            # Main Application routing, layout, and global states
│   ├── index.css          # Tailwind CSS global styles & theme configurations
│   └── main.tsx           # Application root entrypoint
├── capacitor.config.ts    # Capacitor platform settings
├── package.json           # Project dependencies & scripts
├── tsconfig.json          # TypeScript project configuration
└── vite.config.ts         # Vite build configuration
```

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/Spartan7Challange.git
cd Spartan7Challange
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run Development Server
Start the local server to run the application in your browser:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
Generate optimized static assets in the `dist` directory:
```bash
npm run build
```

---

## 📱 Mobile (Android) Deployment

This project uses Capacitor to compile into a native Android app.

### 1. Build the Web App
Ensure you have built the static assets:
```bash
npm run build
```

### 2. Synchronize Assets with Android Studio
Copy the web builds and plugins into the Android project folder:
```bash
npx cap sync
```

### 3. Open in Android Studio
Launch Android Studio with the project configuration to run on an emulator or a physical device:
```bash
npx cap open android
```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
