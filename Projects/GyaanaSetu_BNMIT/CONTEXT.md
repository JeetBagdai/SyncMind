# GyaanaSetu BNMIT — Project Context

> **Purpose of this file**: Full context document for the BNMIT college portal. Read this before starting any work in a new chat session.

---

## 📌 What Is GyaanaSetu?

GyaanaSetu is an AI-powered learning platform originally built for NCERT school students. This clone (`GyaanaSetu_BNMIT`) has been adapted as a **college portal for BNM Institute of Technology (BNMIT)**, Bangalore.

- The **school (NCERT) version** lives at: `C:\Users\Jeet\Desktop\Projects\GyaanaSetu\GyaanaSetu_NCERT`
- The **college (BNMIT) version** lives at: `C:\Users\Jeet\Desktop\Projects\GyaanaSetu_BNMIT` *(this project)*

Both run independently with their own Firebase projects and deployments.

---

## 🗂️ Project File Map

```
GyaanaSetu_BNMIT/
├── index.html                  # Entry HTML — title & meta updated for BNMIT
├── package.json                # name: "gyaanasetu-bnmit"
├── vite.config.js              # Vite build config (no changes needed)
├── .env                        # 🔴 Fill in your Firebase keys here (see setup below)
├── .env.example                # Template reference
├── firebase.json               # Firebase Hosting config
├── Dockerfile / nginx.conf     # For Cloud Run deployment
├── CONTEXT.md                  # ← This file
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Router — all page routes defined here
│   ├── firebase.js             # Firebase SDK initialisation (reads from .env)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx     # Auth state, login, register, logout
│   │   └── ThemeContext.jsx    # Light/dark theme toggle
│   │
│   ├── components/
│   │   ├── Navbar.jsx          # Top bar with greeting + theme/language toggles
│   │   ├── Sidebar.jsx         # Left nav (Dashboard, Learning, Attendance, etc.)
│   │   ├── ProtectedRoute.jsx  # Redirects unauthenticated users to /login
│   │   ├── LanguageSwitcher.jsx
│   │   └── ThemeToggle.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx           # Auth page (sign in / create account)
│   │   ├── Dashboard.jsx       # Home dashboard with stats & quick actions
│   │   ├── Learning.jsx        # 🔴 PLACEHOLDER — configure college content here
│   │   ├── Attendance.jsx      # QR-based attendance (stub for college use)
│   │   ├── Timetable.jsx       # Weekly schedule (stub for college use)
│   │   ├── Quiz.jsx            # Quiz engine — reads from src/data/quizzes.js
│   │   └── Chatbot.jsx         # AI Tutor chat (Groq LLaMA via Cloud Function)
│   │
│   ├── data/
│   │   └── quizzes.js          # 🔴 EMPTY SCAFFOLD — add college quiz data here
│   │
│   ├── services/
│   │   ├── api.js              # All API calls to Cloud Functions
│   │   ├── auth.js             # Firebase token helper
│   │   └── i18n.js             # Internationalisation (EN, HI, TA, TE, KN, ML…)
│   │
│   └── styles/                 # Global shared CSS
│
└── functions/                  # Firebase/GCP Cloud Functions (Node.js)
    ├── index.js                # Function exports
    ├── package.json
    └── src/
        ├── auth/index.js       # setRole, getProfile endpoints
        ├── attendance/index.js # QR attendance generation & scanning
        ├── chatbot/index.js    # 🔵 UPDATED — BNMIT engineering AI tutor prompt
        ├── dashboard/index.js  # Stats aggregation
        ├── ncert/index.js      # GCS chapter fetch (repurpose for college notes)
        ├── quiz/index.js       # Quiz submission & scoring
        ├── timetable/index.js  # Timetable CRUD
        └── utils/              # Shared Firebase Admin + token verify helpers
```

---

## ✅ What Was Done (Clone Setup)

| Change | Detail |
|---|---|
| Folder created | Copied from `GyaanaSetu_NCERT`, excluded `node_modules`, `.git`, `dist` |
| `index.html` | Title → "GyaanaSetu – BNMIT College Portal" |
| `package.json` | name → `"gyaanasetu-bnmit"` |
| `.env` | All Firebase keys blanked out; `VITE_SCHOOL_NAME=BNM Institute of Technology` |
| `src/data/quizzes.js` | All 19 NCERT grade quiz files removed; empty scaffold left |
| `src/pages/Learning.jsx` | Replaced with placeholder pointing to CONTEXT.md |
| `src/context/AuthContext.jsx` | Demo profiles updated to BNMIT faculty/student |
| `functions/src/chatbot/index.js` | System prompt updated for engineering college context |

---

## 🔴 What You Still Need To Do

### 1. Firebase Setup (New Project for BNMIT)
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a **new project**: `gyaanasetu-bnmit` (or similar)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore** → Start in test mode initially
5. Copy credentials to `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

### 2. Add College Quiz Content
Edit `src/data/quizzes.js`:
```js
export const QUIZ_DATA = {
  'data-structures': [
    {
      id: 'ds-1',
      question: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      answer: 'O(log n)',
      explanation: 'Binary search halves the search space each step.',
    },
  ],
}

export const SUBJECTS = [
  { id: 'data-structures', label: 'Data Structures', icon: '🌲' },
  { id: 'dbms', label: 'Database Management', icon: '🗄️' },
  { id: 'os', label: 'Operating Systems', icon: '💻' },
]
```

### 3. Build the Learning Page
The `src/pages/Learning.jsx` is currently a placeholder. In the BNMIT project chat, ask to build it with:
- Department / semester / subject selector
- Lecture notes / PDF viewer (reuse the existing `react-pdf` dependency)
- Link to GCS bucket for uploaded materials (`VITE_GCS_BUCKET=gyaanasetu-bnmit`)

### 4. Adapt Attendance for College
The QR attendance system works as-is. You may want to:
- Change "Grade" to "Section" / "Department" in Firestore and UI
- Add course code support

### 5. Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions --project gyaanasetu-bnmit
```
Then paste the function base URL into `.env` → `VITE_CLOUD_FUNCTIONS_BASE_URL`.

---

## ⚙️ Environment Variables Reference

| Variable | Purpose |
|---|---|
| `VITE_DEMO_MODE` | `true` = bypass Firebase (UI preview mode) |
| `VITE_FIREBASE_*` | Firebase Web SDK credentials |
| `VITE_CLOUD_FUNCTIONS_BASE_URL` | Deployed Cloud Function endpoint |
| `VITE_SCHOOL_NAME` | Institution name shown in UI & stored in user profiles |
| `VITE_GCS_BUCKET` | GCS bucket name for lecture materials |

---

## 🏃 Running Locally

```bash
# Install frontend dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Install function dependencies (for local emulation)
cd functions && npm install && cd ..

# Firebase emulators (optional)
firebase emulators:start
```

---

## 🏗️ Architecture Overview

```
Browser (React + Vite)
    │
    ├─ Firebase Auth (login / register)
    ├─ Firestore (user profiles, attendance records, timetable)
    └─ Cloud Functions (REST API)
            ├─ POST /chatbot/message   → Groq LLaMA AI
            ├─ GET  /ncert/lessons     → GCS (repurpose for college notes)
            ├─ POST /attendance/*      → QR generation & validation
            ├─ GET  /dashboard/stats   → Aggregated student stats
            └─ POST /quiz/submit       → Quiz scoring
```

### Roles
| Role | Access |
|---|---|
| `student` | Dashboard, Learning, Attendance (scan), Timetable, Quiz, Chatbot |
| `teacher` | Dashboard (class stats), Attendance (generate QR), Timetable |

---

## 🎨 Design System

The app uses a custom CSS design system (no Tailwind). Key tokens (defined in `src/index.css`):

| Token | Usage |
|---|---|
| `--primary` | Brand purple `#7c5cbf` |
| `--bg` | Page background |
| `--surface` | Card backgrounds |
| `--text` | Body text |
| `--text-muted` | Secondary text |
| `--border` | Dividers and borders |
| `--radius` | Border radius `12px` |

Dark mode is toggled via `ThemeContext` and applied via a `data-theme="dark"` attribute on `<html>`.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `firebase` | Auth + Firestore |
| `framer-motion` | Animations |
| `lucide-react` | Icon set |
| `react-pdf` | PDF viewer for study materials |
| `groq-sdk` | AI (server-side, in Cloud Function) |
| `i18next` + `react-i18next` | Multi-language support |
| `html5-qrcode` | QR code scanner |
| `qrcode.react` | QR code generator |

---

*Last updated: July 2026 — GyaanaSetu BNMIT fork.*
