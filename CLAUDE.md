# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Requirements
- Update CLAUDE.md before every git commit

## Project Overview

Deductly is an education tech platform focused on LSAT preparation, featuring diagnostic assessments, personalized study plans, practice drills, and advanced psychometric modeling. Built with React frontend (Vite + Tailwind) and Flask/Python backend with PostgreSQL database.

## Architecture

### Backend Architecture (Flask + PostgreSQL)

**Three-layer architecture:**
- **Insights Layer** (`backend/insights/`) - Psychometric models (IRT, Elo, GLMM) and performance analytics
- **Personalization Layer** (`backend/personalization/`) - Study plans and adaptive learning with contextual bandits
- **Skill Builder Layer** (`backend/skill_builder/`) - Practice drills, curriculum, and question tracking

Each layer follows the pattern: `routes.py` (API endpoints) → `logic.py` (business logic)

**Database:**
- PostgreSQL database (migrated from SQLite)
- Schema defined in `backend/db/schema.py`
- Connection management in `backend/db/connection.py`
- Key tables: `skills`, `questions`, `question_skills`, `drills`, `drill_results`, `user_elo_ratings`, `user_abilities`, `user_question_history`

**Main app:** `backend/app.py`
- Runs on port 5001 (not 5000)
- Registers blueprints from all three layers
- CORS configured for local dev (`localhost:5173`) and production

### Psychometric Models (Insights Layer)

**1. ELO Rating System** (`backend/insights/elo_system.py`)
- Per-skill ratings with adaptive K-factors (BASE_K=64, FLOOR_K=16)
- Multi-skill question handling with weight normalization
- Parameters: DEFAULT_RATING=1500, ELO_SCALE=400
- Rating tiers: Beginning (<1200), Foundational (1200+), Developing (1400+), Proficient (1600+), Advanced (1800+)

**2. IRT (Item Response Theory)** (`backend/insights/irt_implementation.py`)
- Rasch model implementation using PyTorch
- Estimates user ability (theta) and item difficulty (b)
- Online updates via `rasch_online_update_theta_torch()`

**3. GLMM (Generalized Linear Mixed Model)** (`backend/insights/glmm_implementation.py`)
- Skill mastery estimation with frozen Rasch parameters
- Per-skill mastery vectors per user
- Micro-update capability for real-time learning

### Skill Taxonomy

**32 discrete skills across two domains:**

Logical Reasoning (20 skills):
- Domain I: Structural Decomposition (S_01-S_04)
- Domain II: Formal & Deductive Logic (FL_01-FL_07)
- Domain III: Rhetorical & Inductive Evaluation (RH_01-RH_08)
- Domain IV: Systemic Abstraction (ABS_01-ABS_03)

Reading Comprehension (12 skills):
- Domain I: Macro-Structural (RC_01-RC_03)
- Domain II: Micro-Syntactic (RC_04-RC_05)
- Domain III: Inferential Synthesis (RC_06-RC_10)
- Domain IV: Comparative Dynamics (RC_11-RC_12)

### Frontend Architecture (React)

**Authentication:** Firebase Authentication
- Context: `src/contexts/AuthContext.jsx` - Email/password and Google OAuth
- Service: `src/services/userProfile.js` - Firestore user profile management
- Protected routes via `src/components/PrivateRoute.jsx`

**Contexts:**
- `AuthContext.jsx` - Firebase auth, dev mode bypass
- `DrillContext.jsx` - Drill session state (config, questions, answers, highlights)

**Key Pages:**
- `Landing.jsx` / `Dashboard.jsx` - Main user hub
- `DrillBuilder.jsx` - Drill configuration with question exclusion modes
- `DrillSession.jsx` - Active drill with timer, navigation, highlighting
- `DrillResults.jsx` / `DrillSummary.jsx` - Results and review
- `StudyPlan.jsx` - Personalized study plan display
- `Analytics.jsx` - Ability estimates and skill mastery dashboard
- `Curriculum.jsx` / `VideoDetail.jsx` - Video curriculum
- `Diagnostics.jsx` / `DiagnosticSummary.jsx` - Diagnostic assessments

**API Service:** `src/services/api.js`
- Centralized API client with methods for all endpoints
- Insights endpoints (ability, mastery, Elo)
- Base URL from `VITE_API_BASE_URL`

## Database Schema

### Core Tables
- `skills` - LSAT skills taxonomy
- `questions` - Questions with difficulty (b, difficulty_elo_base)
- `question_skills` - Question-skill mapping with weights and types (primary/secondary)
- `videos` - Curriculum video content

### Drill Tables
- `drills` - Practice drill sessions (question_ids, status, user_answers)
- `drill_results` - Completion results (scores, skill_performance)

### User Progress Tables
- `user_abilities` - IRT ability (theta_scalar) and mastery vector
- `user_elo_ratings` - Per-skill Elo ratings (rating, num_updates)
- `user_question_history` - Question attempt tracking for exclusion
- `item_difficulties` - Item difficulty parameters

### Study Plan Tables
- `study_plans` - User study plan metadata
- `study_plan_tasks` - Weekly tasks (drill/video references)
- `bandit_models` - Contextual bandit state for adaptive planning

## Development Commands

### Initial Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Database Setup:**
```bash
# PostgreSQL must be running
psql -c "CREATE DATABASE deductly;"
# Schema is auto-created on first run via backend/db/schema.py
```

**Frontend:**
```bash
npm install
```

### Running the Application

**Frontend (port 5173):**
```bash
npm run dev
```

**Backend (port 5001):**
```bash
npm run backend
# Or manually:
cd backend
source venv/bin/activate
python app.py
```

### Building

```bash
npm run build       # Production build
npm run preview     # Preview production build
```

## Environment Variables

### Development
Create `.env` in project root:
```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5001/api

# Dev mode (bypasses auth)
VITE_DEV_MODE=true

# PostgreSQL (backend)
PG_DATABASE=deductly
PG_USER=your_user
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
# Or use DATABASE_URL for Render
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

## API Endpoints

### Insights Layer (`/api/insights/`)
```
GET  /irt/<user_id>                    - Fetch IRT ability estimate
GET  /elo/<user_id>                    - Fetch Elo skill ratings
GET  /glmm/<user_id>                   - Fetch skill mastery
POST /online/irt/update/<user_id>      - Update IRT estimates
POST /online/elo/update/<user_id>      - Update Elo ratings
POST /online/glmm/update/<user_id>     - Update mastery
```

### Personalization Layer (`/api/personalization/`)
```
GET  /study-plans                      - Get user's study plans
GET  /study-plans/<id>                 - Get specific plan
POST /study-plans                      - Create study plan
PUT  /study-plans/<id>/progress        - Update task progress
POST /diagnostic                       - Create diagnostic session
```

### Skill Builder Layer (`/api/skill-builder/`)
```
POST /drill                            - Create drill session
POST /drill/submit                     - Submit drill answers
POST /drill/<id>/start                 - Mark drill started
POST /drill/<id>/progress              - Save partial progress
GET  /drills/history                   - Get drill history
GET  /drills/<id>                      - Get drill by ID
GET  /drills/<id>/results              - Get drill results
GET  /questions/history                - Get question stats
GET  /curriculum/videos                - Get all videos
GET  /curriculum/videos/<id>           - Get video details
POST /curriculum/videos/<id>/complete  - Mark video complete
```

### Question Exclusion Modes
When creating drills, `exclusion_mode` controls question selection:
- `all_seen` (default) - Exclude all previously answered questions
- `correct_only` - Exclude only correctly answered questions
- `none` - Include all questions (allow repeats)

## Deployment

- **Frontend:** GitHub Pages (via GitHub Actions)
- **Backend:** Render (with PostgreSQL)
- **Database:** PostgreSQL (Render managed or external)

## Key Implementation Details

1. **Backend runs on port 5001** (not 5000)
2. **PostgreSQL database** - connection via psycopg, supports DATABASE_URL
3. **Three psychometric models** - IRT (ability), Elo (per-skill ratings), GLMM (mastery)
4. **Question tracking** - `user_question_history` table tracks all answered questions
5. **Adaptive K-factor** - Elo uses `K = max(BASE_K / sqrt(n+1), FLOOR_K)` for responsive updates
6. **Firebase authentication** - user profiles in Firestore, auth tokens validated server-side
7. **Drill auto-updates** - Submitting drills automatically updates IRT and Elo ratings
8. **Contextual bandits** - Personalization layer uses Bayesian bandits for adaptive study plans

## Recent Changes

- Migrated from SQLite to PostgreSQL
- Implemented Elo rating system with per-skill tracking
- Added question tracking with exclusion modes
- Added IRT and GLMM psychometric models
- Updated skill taxonomy to 32 discrete skills
- Added adaptive study planning with contextual bandits
- Frontend Analytics page showing ability and mastery
