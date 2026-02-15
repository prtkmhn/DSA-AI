# 📚 **DSA-AI Complete Codebase Walkthrough**

A comprehensive guide to understanding your DSA learning platform!

---

## **🏗️ 1. OVERALL ARCHITECTURE**

Your app is a **Full-Stack TypeScript Application** with this structure:

```
┌─────────────────────────────────────────────────────┐
│                  USER'S BROWSER                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   React Frontend (client/)                  │   │
│  │   - UI Components                            │   │
│  │   - Pages (Home, Unit, Review, etc.)        │   │
│  │   - Zustand Store (local state)             │   │
│  │   - AI Integration (Gemini/Groq)            │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 │ HTTP Requests (fetch)              │
│                 ↓                                    │
└─────────────────────────────────────────────────────┘
                  │
                  │
┌─────────────────┴───────────────────────────────────┐
│              EXPRESS SERVER (server/)               │
│  ┌──────────────────────────────────────────────┐  │
│  │  REST API Routes (/api/*)                    │  │
│  │  - /api/progress                             │  │
│  │  - /api/flashcards                           │  │
│  │  - /api/units                                │  │
│  │  - /api/problems                             │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│                 │ SQL Queries (Drizzle ORM)          │
│                 ↓                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │   PostgreSQL Database                        │  │
│  │   - user_progress                            │  │
│  │   - flashcard_states                         │  │
│  │   - generated_units                          │  │
│  │   - tracked_problems                         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key Concept**: It's a **monolith** - one server serves both the API and the React app on port 5000.

---

## **📂 2. FOLDER STRUCTURE EXPLAINED**

```
DSA-AI/
│
├── client/                      # 🎨 FRONTEND (React)
│   └── src/
│       ├── components/
│       │   ├── features/        # Custom learning components
│       │   │   ├── CodeVerifier.tsx      # Python code testing
│       │   │   ├── FlashcardReview.tsx   # Spaced repetition
│       │   │   ├── LessonView.tsx        # Multi-slide lessons
│       │   │   ├── ParsonsProblem.tsx    # Drag-drop coding
│       │   │   └── UnitCard.tsx          # Learning unit display
│       │   │
│       │   ├── layout/          # App structure
│       │   │   ├── BottomNav.tsx         # Mobile navigation
│       │   │   └── MobileLayout.tsx      # Page wrapper
│       │   │
│       │   └── ui/              # Reusable UI components
│       │       └── [50+ shadcn components]
│       │
│       ├── pages/               # 📄 ROUTES (URL pages)
│       │   ├── Home.tsx                  # / - Dashboard
│       │   ├── UnitPage.tsx              # /unit/:id - Lesson
│       │   ├── ReviewPage.tsx            # /review - Flashcards
│       │   ├── TrackPage.tsx             # /track - AI creator
│       │   ├── ProfilePage.tsx           # /profile - User stats
│       │   └── SettingsPage.tsx          # /settings - AI config
│       │
│       ├── lib/                 # 🧰 UTILITIES
│       │   ├── types.ts                  # TypeScript interfaces
│       │   ├── data.ts                   # Hardcoded "Two Sum" unit
│       │   ├── store.ts                  # Zustand state management
│       │   ├── ai.ts                     # Gemini/Groq integration
│       │   ├── pyodide.ts                # Python in browser
│       │   ├── queryClient.ts            # React Query config
│       │   └── utils.ts                  # Helper functions
│       │
│       ├── App.tsx              # Router setup
│       └── main.tsx             # React entry point
│
├── server/                      # 🖥️ BACKEND (Express)
│   ├── index.ts                 # Express app setup
│   ├── routes.ts                # API endpoint definitions
│   ├── storage.ts               # Database CRUD operations
│   ├── db.ts                    # Database connection
│   ├── vite.ts                  # Dev server (Vite integration)
│   └── static.ts                # Production static file serving
│
├── shared/                      # 🔗 SHARED CODE
│   └── schema.ts                # Database schema (Drizzle ORM)
│
├── script/                      # 🏗️ BUILD SCRIPTS
│   └── build.ts                 # Production bundler
│
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite bundler config
└── drizzle.config.ts            # Database migration config
```

---

## **🔑 3. KEY FILES EXPLAINED**

### **Frontend Core Files**

#### **`client/src/lib/types.ts`** - Data Structure Definitions
This defines the shape of all your learning content:

```typescript
Unit {
  - id: "two-sum"
  - title: "Two Sum & Hash Maps"
  - lesson: { slides: [...] }      // Theory slides
  - toyExample: {...}               // Interactive coding (Stage 1)
  - parsons: {...}                  // Code ordering (Stage 2)
  - flashcards: [...]               // Spaced repetition
  - mainProblem: {...}              // LeetCode link info
}
```

**Think of it like**: A blueprint for one complete learning module.

---

#### **`client/src/lib/data.ts`** - Content Database
Contains the hardcoded "Two Sum" unit with all its:
- Concept slides (theory)
- Code examples
- Interactive toy problem
- Parsons puzzle
- Flashcards

**This is the only pre-built content**. Everything else comes from AI generation.

---

#### **`client/src/lib/store.ts`** - Application State (Zustand)
This is your **global state manager** (like Redux but simpler):

```typescript
useStore = {
  progress: {
    completedUnits: ["two-sum"],    // What user finished
    unlockedUnits: ["two-sum"],     // What user can access
    parsonsProgress: {}              // Stage tracking per unit
  },

  flashcardData: {                  // SM-2 algorithm data
    "card-id": {
      nextReview: timestamp,
      interval: 6,                   // Days until next review
      efactor: 2.5                   // Difficulty multiplier
    }
  },

  aiSettings: {                     // User's API keys
    geminiKey: "...",
    groqKey: "...",
    primaryProvider: "gemini"
  },

  units: [...],                     // All available units
  trackedProblems: [...]            // AI generation queue
}
```

**Persistence**: Saved to browser's `localStorage` automatically!

---

#### **`client/src/lib/ai.ts`** - AI Integration
Handles calling Google Gemini or Groq to generate new learning units.

**Flow**:
1. User enters topic (e.g., "Binary Search")
2. AI receives a detailed prompt with JSON schema
3. AI generates: lesson, toy problem, parsons, flashcards
4. Response parsed and added to `units` array

---

#### **`client/src/App.tsx`** - Router
Maps URLs to pages:
```
/               → Home.tsx
/unit/:id       → UnitPage.tsx
/track          → TrackPage.tsx
/review         → ReviewPage.tsx
/profile        → ProfilePage.tsx
/settings       → SettingsPage.tsx
```

---

### **Backend Core Files**

#### **`server/index.ts`** - Express Server Entry
1. Creates Express app
2. Sets up JSON body parsing
3. Registers API routes
4. In dev: Starts Vite dev server
5. In prod: Serves static files
6. Listens on port 5000

---

#### **`server/routes.ts`** - API Endpoints
Defines REST API:

```
GET  /api/progress/:sessionId       # Get user progress
POST /api/progress                  # Save progress

GET  /api/flashcards/:sessionId     # Get flashcard states
POST /api/flashcards                # Update flashcard

GET  /api/units                     # Get all AI-generated units
GET  /api/units/:unitId             # Get specific unit
POST /api/units                     # Save new AI unit

GET  /api/problems/:sessionId       # Get tracked problems
POST /api/problems                  # Create tracked problem
PATCH /api/problems/:id             # Update problem status
```

**Pattern**: Routes → call `storage.ts` functions → return JSON

---

#### **`server/storage.ts`** - Database CRUD
Contains functions like:
- `getProgress(sessionId)` - Fetch user progress
- `upsertProgress(data)` - Create or update progress
- `getFlashcardStates(sessionId)` - Get all card states
- `createGeneratedUnit(unit)` - Save AI-generated unit
- etc.

Uses **Drizzle ORM** to talk to PostgreSQL.

---

#### **`shared/schema.ts`** - Database Schema
Defines 5 PostgreSQL tables:

```sql
users               # (Not used yet - auth placeholder)
  - id, username, password

user_progress       # User learning state
  - sessionId, completedUnits[], unlockedUnits[], parsonsProgress

flashcard_states    # Spaced repetition data (SM-2)
  - sessionId, cardId, nextReview, interval, repetition, efactor

generated_units     # AI-created content
  - unitId, unitData (JSON blob)

tracked_problems    # AI generation queue
  - sessionId, topic, status, unitId
```

---

## **🔄 4. DATA FLOW - HOW EVERYTHING WORKS**

Let me trace **3 real user journeys** through the system:

---

### **Journey 1: Learning a Unit** 🎓

```
1. User clicks "Two Sum" card on Home page
   ↓
2. Router navigates to /unit/two-sum
   ↓
3. UnitPage.tsx loads:
   - Gets unit from store.units (client/src/lib/data.ts)
   - Renders LessonView component
   ↓
4. LessonView shows 3 concept slides
   - User reads theory
   - Clicks "Next" through slides
   ↓
5. After slides, CodeVerifier loads:
   - Shows toy problem with starter code
   - User writes solution in code editor
   - Clicks "Run Tests"
   ↓
6. CodeVerifier runs Pyodide:
   - Loads Python in browser (WebAssembly!)
   - Runs test harness against user's code
   - Shows ✓ or ✗ for each test case
   ↓
7. After passing, ParsonsProblem loads:
   - Shows shuffled code blocks
   - User drags blocks to correct order
   - Checks indentation levels
   ↓
8. On completion:
   - Confetti animation! 🎉
   - store.completeUnit("two-sum") called
   - POST /api/progress (saves to DB)
   - Unit marked complete in progress table
```

**Key Files Involved**:
- `pages/UnitPage.tsx` - Container
- `features/LessonView.tsx` - Orchestrates stages
- `features/CodeVerifier.tsx` - Python testing
- `features/ParsonsProblem.tsx` - Code ordering
- `lib/pyodide.ts` - Python runtime
- `lib/store.ts` - State updates
- `server/routes.ts` - API endpoints
- `server/storage.ts` - DB operations

---

### **Journey 2: Reviewing Flashcards** 🃏

```
1. User clicks "Review" in bottom nav
   ↓
2. Router → /review → ReviewPage.tsx
   ↓
3. ReviewPage loads:
   - Gets all units from store
   - Extracts flashcards from each unit
   - Filters cards due for review (nextReview < now)
   ↓
4. Shows first card (front side)
   - e.g., "What is the time complexity of hash map lookup?"
   ↓
5. User clicks card → flips (CSS 3D transform)
   - Shows back: "O(1) average case"
   ↓
6. User clicks "Hard" (forgot it) or "Easy" (knew it)
   ↓
7. SM-2 Algorithm runs (in store.updateFlashcard):
   If HARD (quality < 3):
     - repetition = 0
     - interval = 1 day
   If EASY (quality >= 3):
     - repetition++
     - interval = interval * efactor
     - efactor adjusted based on performance

   nextReview = now + (interval * 24 hours)
   ↓
8. State updated in Zustand store
   ↓
9. POST /api/flashcards (saves to DB)
   ↓
10. Next card loads (repeat 4-9)
    ↓
11. When all cards done:
    - Shows completion screen
    - "Come back tomorrow!" message
```

**SM-2 Algorithm** (Spaced Repetition):
- **Easy cards**: Review after 1 day → 6 days → 15 days → 37 days...
- **Hard cards**: Reset to 1 day interval
- **efactor**: Adjusts based on your memory (1.3 to 2.5)

**Key Files**:
- `pages/ReviewPage.tsx` - Main logic
- `features/FlashcardReview.tsx` - Card display
- `lib/store.ts` - SM-2 algorithm (line 89-115)
- Database: `flashcard_states` table

---

### **Journey 3: AI Content Generation** 🤖

```
1. User navigates to /track
   ↓
2. TrackPage.tsx shows input form
   ↓
3. User types topic: "Binary Search Trees"
   Clicks "Generate"
   ↓
4. Frontend:
   - problemId = store.addTrackedProblem(topic)
   - POST /api/problems { topic, status: "generating" }
   - Shows "Generating..." in queue
   ↓
5. Frontend calls ai.ts:
   - Gets Gemini API key from store.aiSettings
   - Sends prompt with JSON schema
   - Prompt includes: "Generate a complete Unit for topic..."
   ↓
6. Gemini/Groq responds with JSON:
   {
     "id": "binary-search-trees",
     "title": "Binary Search Trees",
     "lesson": { slides: [...] },
     "toyExample": { starterCode: "...", tests: "..." },
     "parsons": { segments: [...] },
     "flashcards": [...]
   }
   ↓
7. Frontend parses JSON:
   - store.addUnit(parsedUnit)
   - POST /api/units { unitId, unitData }
   - PATCH /api/problems/:id { status: "verified", unitId }
   ↓
8. Database now has:
   - generated_units table: New unit stored
   - tracked_problems table: Status = "verified"
   ↓
9. User sees:
   - Queue status changes to ✓ Verified
   - "Play" button appears
   - Clicking Play → /unit/binary-search-trees
   ↓
10. Unit is now available like any hardcoded unit!
```

**Key Files**:
- `pages/TrackPage.tsx` - UI
- `lib/ai.ts` - AI API calls
- `lib/store.ts` - State management
- `server/routes.ts` - Saves generated content
- Database: `generated_units`, `tracked_problems`

---

## **🎯 5. KEY CONCEPTS TO UNDERSTAND**

### **A. Client-Side AI (Important!)**
The AI integration is **NOT** in the backend. It's in the **frontend**:
- User's API key stored in browser localStorage
- Gemini/Groq called directly from browser
- Backend just stores the generated content
- **Why?** Simpler architecture, no backend API key management

---

### **B. Session-Based Authentication**
Right now, NO real authentication:
- `sessionId` = random UUID in localStorage
- This identifies "a user" without login
- **users table exists but unused**
- Good for MVP, needs proper auth later

---

### **C. Hybrid State Management**
**Two sources of truth**:

1. **Zustand (localStorage)**:
   - Instant access
   - No network delay
   - Survives page refresh

2. **PostgreSQL (server)**:
   - Persistent across devices
   - Sync point for future multi-device support
   - Currently synced on actions (POST requests)

**Pattern**: Optimistic updates (update Zustand first, then POST to server)

---

### **D. Progressive Pedagogy**
The learning flow follows education research:

```
Stage 1: Concept → Analogy → Code      (Theory)
Stage 2: Toy Problem                    (Scaffolded practice)
Stage 3: Parsons Problem                (Active construction)
Stage 4: Flashcards                     (Spaced repetition)
Stage 5: LeetCode                       (Independent practice)
```

This is inspired by **Parsons Problems** research - proven to be more effective than writing code from scratch for beginners.

---

### **E. Pyodide (Python in Browser)**
- WebAssembly version of CPython
- Runs actual Python code in browser
- No server needed for code execution
- `client/src/lib/pyodide.ts` manages loading
- Heavy (~6MB download first time)
- Cached after first load

---

## **📊 6. WHAT HAPPENS WHEN YOU RUN `npm run dev`**

```
1. npm run dev
   ↓
2. tsx server/index.ts (TypeScript execution)
   ↓
3. Express app starts:
   - Parses JSON bodies
   - Registers API routes (/api/*)
   - Connects to PostgreSQL via DATABASE_URL
   ↓
4. Since NODE_ENV=development:
   - Loads server/vite.ts
   - Starts Vite dev server (for React)
   - Vite watches client/ folder
   - Hot Module Replacement (HMR) enabled
   ↓
5. Server listens on port 5000
   ↓
6. You open http://localhost:5000
   ↓
7. Server sends React app (client/src/main.tsx)
   ↓
8. Browser loads React:
   - Zustand hydrates from localStorage
   - React Query initializes
   - Router matches URL to page
   - Components render
   ↓
9. Components make API calls:
   - fetch('/api/progress/...') → Express → PostgreSQL
   - Data flows back to React
```

---

## **🚀 7. GETTING STARTED**

### **Prerequisites**
1. **Node.js** (v20 or later)
2. **PostgreSQL database** (local or cloud)

---

### **Option A: Local PostgreSQL on Windows**

#### **Step 1: Install PostgreSQL**

1. Download PostgreSQL from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the wizard
3. **Remember your password** for the `postgres` user (default: `postgres`)
4. Default installation path: `C:\Program Files\PostgreSQL\17\`

#### **Step 2: Verify PostgreSQL is Running**

Open Command Prompt or PowerShell and run:
```cmd
sc query postgresql-x64-17
```

You should see `STATE: RUNNING`. If not, start the service:
```cmd
net start postgresql-x64-17
```

#### **Step 3: Create the Database**

Run this command (replace password if you set a different one):
```cmd
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE dsa_ai;"
```

If prompted for a password, enter your postgres password.

#### **Step 4: Install Dependencies**

```bash
npm install
```

#### **Step 5: Create `.env` File**

Create a `.env` file in the project root:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/dsa_ai

# Server Configuration
NODE_ENV=development
PORT=5000
```

**Important:** Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

**Note:** If you used the default installation and set password to `postgres`, your connection string would be:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dsa_ai
```

#### **Step 6: Run Database Migrations**

```bash
npm run db:push
```

This creates all the required tables in your database.

#### **Step 7: Start Development Server**

```bash
npm run dev
```

#### **Step 8: Open Browser**

Navigate to: `http://localhost:5000`

---

### **Option B: Cloud PostgreSQL (Neon)**

If you prefer serverless PostgreSQL:

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project and database
3. Copy your connection string

4. **Update `server/db.ts`** to use Neon driver:
   ```typescript
   import { drizzle } from "drizzle-orm/neon-http";
   import { neon } from "@neondatabase/serverless";
   import * as schema from "@shared/schema";

   if (!process.env.DATABASE_URL) {
     throw new Error("DATABASE_URL environment variable is required");
   }

   const sql = neon(process.env.DATABASE_URL);
   export const db = drizzle(sql, { schema });
   ```

5. Install Neon dependencies:
   ```bash
   npm install @neondatabase/serverless drizzle-orm/neon-http
   ```

6. Add your connection string to `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

7. Run migrations and start:
   ```bash
   npm run db:push
   npm run dev
   ```

---

### **Troubleshooting PostgreSQL on Windows**

| Issue | Solution |
|-------|----------|
| `psql` not recognized | Add `C:\Program Files\PostgreSQL\17\bin` to your PATH environment variable |
| Connection refused | Ensure PostgreSQL service is running: `net start postgresql-x64-17` |
| Password authentication failed | Check the password in your `.env` matches your postgres user password |
| Database does not exist | Run: `psql -U postgres -c "CREATE DATABASE dsa_ai;"` |
| Port 5432 in use | Check if another PostgreSQL instance is running, or change the port |

---

### **Configure AI** (in app)

After the app is running:
1. Navigate to the Settings page
2. Add your Google Gemini API key (get from [ai.google.dev](https://ai.google.dev))
3. Optionally add Groq API key for fallback

---

## **🎓 SUMMARY**

Your DSA-AI app is a **pedagogically-sound learning platform** that:

1. **Teaches DSA concepts** through multi-stage lessons (theory → practice → construction)
2. **Uses spaced repetition** (SM-2 algorithm) for long-term retention
3. **Leverages AI** (Gemini/Groq) to generate unlimited custom content
4. **Runs Python in the browser** (Pyodide) for instant code testing
5. **Persists progress** in PostgreSQL for long-term tracking
6. **Uses modern React** patterns (Zustand, React Query, Wouter)

### **The Technology Stack**:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind + Framer Motion
- **Backend**: Express + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (local or Neon serverless)
- **AI**: Google Gemini + Groq (client-side)
- **Code Execution**: Pyodide (Python WebAssembly)

---

## **📝 TODO / INCOMPLETE FEATURES**

### **What's Done**:
- ✅ Complete lesson flow with interactive coding challenges
- ✅ Parsons problem implementation
- ✅ Spaced repetition flashcard system (SM-2 algorithm)
- ✅ AI-powered unit generation (Gemini + Groq fallback)
- ✅ Problem tracking and queue management
- ✅ Database persistence layer
- ✅ Mobile-optimized UI
- ✅ API endpoints for all features

### **What's Missing**:
- ❌ User authentication and multi-user support
- ❌ Detailed statistics/analytics dashboard with visualizations
- ❌ More pre-built learning units (currently only "Two Sum")
- ❌ Advanced Parsons problem stages (fading, distractors)
- ❌ Test suite
- ❌ Error tracking/logging
- ❌ Performance optimizations

### **Next Steps**:
1. Implement authentication (schema exists)
2. Add visualizations for user progress (Recharts library available)
3. Create more pre-built learning units
4. Add comprehensive unit tests
5. Implement user feedback/review system

---

## **🤝 Contributing**

This project was built on Replit and is designed for educational purposes. Feel free to extend it with:
- More DSA topics
- Better visualizations
- Algorithm animations
- Social features
- Gamification elements

---

## **📄 License**

MIT License
