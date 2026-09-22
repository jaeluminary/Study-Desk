# 📌 Study Desk

> A cozy, soft, pinboard-style web app where students track their study journey: focus intentions, goals, study timer, music, materials, scores, and reminders.

---

## ✨ Features Overview

- **Warm Pinboard UI**: Felt/cork board aesthetics with realistic paper notes, pushpins with specular highlights, washi tape strips, code-drawn postmarks, clean modern bold sans typography (`Plus Jakarta Sans` / `Arial Bold`), and whimsical twinkling stars & floating swirls (`★ 𖦹`).
- **Zero AI-Generated Assets**: Pure CSS, inline SVGs, and Web Audio synthesis for sound effects. Clearly labeled artwork placeholder slots for custom user art.
- **Switchable Accessible Themes**:
  - **Theme A**: Citrus & Cranberry (`#DFEF00`, `#B5D14C`, `#F5DE8F`, `#D02618`, `#910608`)
  - **Theme B**: Sunset & Teal (`#CD060D`, `#FE8128`, `#F9D81E`, `#D0EF53`, `#6CDD6C`, `#00ABB4`)
- **Focus Postcard**: Session intention setter, linked material connector, postmark stamp, and focus history.
- **Study Timer**: Timestamp-accurate chronometer (`Date.now()` delta math), presets & Pomodoro mode, Web Audio chime synthesis, and weekly study hour SVG bar charts.
- **Goals Tracking**: Target progress bars, 12-hour rate-limited check-in countdown, 5-minute undo window, completion celebrations, streak tracking, and a trophy shelf.
- **Spotify Web API**: OAuth 2.0 PKCE flow (zero client secrets exposed) with real-time track polling and fallback demo player.
- **Hall of Materials**: Markdown notes with autosave, document uploads/viewer (PDF, images, text), subject folders, and Gemini AI auto-sorting.
- **Score Tracker & Monthly Postcards**: Assessment logs, weighted averages, SVG trend line chart, monthly progress postcard generator, and printable archive.
- **Reminders & Tasks**: Checklists, priorities, smart filter tabs (*Today*, *Upcoming*, *Overdue*, *Completed*).
- **Accounts & Local-First Mode**: Seamless local-first storage (LocalStorage/IndexedDB) with optional Firebase Cloud sync (Auth, Firestore, Storage) and full JSON data export.

---

## 🚀 Quick Start (Local Server)

Because Study Desk uses standard ES Modules (`import`/`export`), it should be served via a local web server:

```bash
# Using Python 3
python -m http.server 8080

# Or using Node.js / npx serve
npx -y serve .
```

Open your browser at `http://localhost:8080`.

---

## 🔧 Integrations & Setup

### 1. Spotify Web API (OAuth PKCE Flow)
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an App.
2. In your App settings, add your Redirect URI:
   - For local development: `http://localhost:8080/` (or your local port).
3. Copy the **Client ID** (you do *not* need the Client Secret).
4. Click **Settings** or the **Music** card on your Study Desk and paste your Client ID.

### 2. Gemini AI Auto-Sorter
The application includes an intelligent client-side keyword and structure classifier fallback out of the box. To connect a live Google Cloud serverless proxy:
1. Deploy a secure serverless function (e.g. Firebase Cloud Function) that wraps the Gemini API `@google/genai` SDK with your `GEMINI_API_KEY`.
2. Configure the endpoint URL in `js/core/gemini.js` or via the Settings panel.

### 3. Firebase (Auth, Firestore, Storage)
To enable multi-device sync and Cloud Storage:
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password and Google sign-in).
3. Create a **Cloud Firestore** database in production mode and deploy `firestore.rules`.
4. Create a **Cloud Storage** bucket and deploy `storage.rules`.
5. Pass your Firebase config object to `initFirebase(config)` in `js/core/firebase.js`.
