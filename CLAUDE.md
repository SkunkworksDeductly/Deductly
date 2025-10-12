# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deductly is an education tech platform focused on LSAT preparation, featuring diagnostic assessments, personalized study plans, and practice drills. Built with React frontend (Vite + Tailwind) and Flask/Python backend with SQLite database.

## Architecture

### Backend Architecture (Flask + SQLite)

**Three-layer architecture:**
- **Insights Layer** (`backend/insights/`) - Diagnostic assessments and performance analytics
- **Personalization Layer** (`backend/personalization/`) - Study plans and adaptive learning paths
- **Skill Builder Layer** (`backend/skill_builder/`) - Practice drills and skill-targeted exercises

Each layer follows the pattern: `routes.py` (API endpoints) → `logic.py` (business logic)

**Database:**
- SQLite database at `backend/data/deductly.db`
- Schema defined in `setup_database.py`
- Key tables: `skills`, `questions`, `question_skills`
- LSAT skills taxonomy in `backend/data/lsat_skills_taxonomy.json`
- Questions scraped from LSAT resources in `backend/data/lsat_questions.json`

**Main app:** `backend/app.py`
- Runs on port 5001 (not 5000)
- Registers blueprints from all three layers
- Maintains legacy endpoints for backward compatibility
- CORS configured for both local dev (`localhost:5173`) and production (`nikhilanand1998.github.io`)

### Frontend Architecture (React)

**Authentication:** Firebase Authentication
- Context: `src/contexts/AuthContext.jsx` - Email/password and Google OAuth
- Service: `src/services/userProfile.js` - Firestore user profile management
- Protected routes via `src/components/PrivateRoute.jsx`
- Public routes: `/login`, `/signup`

**API Communication:**
- Service: `src/services/api.js`
- Base URL from environment variable `VITE_API_BASE_URL`
- Defaults to `http://localhost:5001/api` in development

**Pages:**
- `Landing.jsx` - Home page (protected)
- `Login.jsx` / `Signup.jsx` - Authentication (public)
- `Diagnostics.jsx` - LSAT diagnostic assessments
- `StudyPlan.jsx` - Personalized study planning
- `Drill.jsx` - Practice sessions

**Navigation:**
- Hamburger sidebar (`src/components/Sidebar.jsx`)
- Routes in `src/App.jsx`

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
# From project root
python setup_database.py          # Create tables and load skills taxonomy
python insert_lsat_questions.py   # Load LSAT questions
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
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5001/api
```

### Production
- Frontend: Set in GitHub Secrets (see DEPLOYMENT.md)
- Backend: Set in Render dashboard environment variables

## API Endpoints

### New Structure (v2.0.0)
- `/api/insights/*` - Diagnostics and analytics
- `/api/personalization/*` - Study plans and recommendations
- `/api/skill-builder/*` - Practice drills

### Legacy Endpoints (maintained for compatibility)
- `GET /api/diagnostics` → insights layer
- `GET /api/study-plans` → personalization layer
- `POST /api/drill` → skill builder layer

## Data Pipeline

### LSAT Content Scrapers
Located in `backend/scrapers/`:
- `lsat_scraper.py` / `lsat_scraper_enhanced.py` - Web scraping for LSAT questions
- `run_lsat_scraper.py` - Execute scrapers
- Output: `backend/data/lsat_questions.json`

### Skills Taxonomy
- Defined in `backend/data/lsat_skills_taxonomy.json`
- Two domains: Logical Reasoning (LR) and Reading Comprehension (RC)
- Each skill has ID, name, category, and description
- Loaded into database via `setup_database.py`

## Deployment

- **Frontend:** GitHub Pages (via GitHub Actions)
- **Backend:** Render (free tier)
- **Database:** SQLite (file-based, deployed with backend)

See DEPLOYMENT.md for detailed deployment instructions.

## Key Implementation Details

1. **Backend runs on port 5001** (not 5000) - check `backend/app.py:89`
2. **Firebase for authentication** - user profiles stored in Firestore
3. **SQLite database** - located at `backend/data/deductly.db`
4. **Three-layer backend architecture** - each layer is a Flask Blueprint
5. **Legacy endpoint support** - old API routes redirect to new structure
6. **Environment-based API URL** - frontend uses `VITE_API_BASE_URL`
