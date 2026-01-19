# 🌸 An An Bot (Discord Assistant v4.1)

**An An** is a high-precision, hybrid Discord assistant designed to manage Guilds, automate server setups with premium templates, and engage communities with a cute, leveled-up experience.

> **Persona:** An An operates as a cheerful, professional younger sister ("An An"), dedicated to serving "Papa" (the owner) with absolute precision. 🌸

---

## ✨ Key Features

### 🏗️ Server Management & Templates
- **One-Click Setup:** Instantly deploy professional server structures (Shop, Community, Fanclub).
- **Custom Templates:** Define your own Categories, Channels, and Roles via the Dashboard.
- **Smart Permissions:**
  - Automated role assignment (Admin, Staff, Member).
  - **Smart Detection:** Automatically hides "Admin/Staff" channels and sets "News" channels to read-only.
  - **Key Match System:** Auto-locks channels based on keywords (e.g., Ticket, Shop).
- **Structure Manager:** Discord-like sidebar UI to manage/delete channels and categories with cascade deletion.

### 🎮 Game & Activity Zones
- **Dynamic Game Zones:** Dedicated categories for games with auto-created Voice/Text channels.
- **Lobby System:** "LOBBY ⎯ นั่งเล่น" (🛋️) created automatically as the first room in every zone.
- **Smart Naming:** Dynamic voice channel naming based on game genres.

### 🏆 Leveling & Engagement
- **XP System:** Progression system up to **Level 10** (+5000 XP/step).
- **Leaderboard:** Web-based leaderboard with real-time stats.
- **Profile Decorations:**
  - **Pro:** Silver frames & crowns.
  - **Premium:** Golden frames, sparkling crowns, and animated effects.
- **Missions System:** Interactive mission cards and progress tracking on the dashboard.

### 💻 Web Dashboard (Next.js)
- **Premium UI:** "An An Cute Pastel" theme (Cotton Candy & Lavender) with Glassmorphism effects.
- **Discord OAuth2:** Secure login and server selection.
- **Interactive Mascot:** Animated An An mascot that follows scrolling and provides helpful bubble chat.
- **Real-time Stats:** Live server statistics and member counts.

### 🛡️ Security & Utilities
- **Verification System:** Button-based verification to unlock server access.
- **Rollback & Clear:** Wipe server layouts and restore previous permissions within 30 minutes.
- **Safe Mode:** Critical commands locked to Guild Owner & "Papa" (Superuser).
- **Shadow Terminal:** Private command channel for Superusers.

---

## 🛠️ Technology Stack
- **Core:** Python (Discord.py)
- **Web Dashboard:** Next.js (React), CSS Modules
- **Backend/DB:** Supabase
- **Authentication:** NextAuth (Discord Provider)
- **Deployment:** PyInstaller (.exe for Windows), Vercel (Dashboard)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase Account
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd BotDiscord
   ```

2. **Setup Python Environment**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup Dashboard**
   ```bash
   cd dashboard
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the root:
   ```env
   DISCORD_TOKEN=your_token
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   ```

### Running the Bot & Dashboard
- **Bot:** `python anan_bot.py`
- **Dashboard:** `cd dashboard && npm run dev`

---

## 📝 Project Structure
```
BotDiscord/
├── anan_bot.py          # Main Bot Logic (Python)
├── utils/               # Helper scripts (Templates, Supabase Client)
├── dashboard/           # Next.js Web Application
│   ├── app/             # App Router Pages
│   └── public/          # Assets (Images, Icons)
├── build.bat            # Executable build script
└── PROJECT_LOG.md       # Development History
```

---

_Built with love by An An for Papa._ 💖
