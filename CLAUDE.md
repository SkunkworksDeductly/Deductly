# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Requirements
- Update CLAUDE.md before every git commit

## Project Overview

Deductly is an education tech platform focused on LSAT preparation, featuring diagnostic assessments, personalized study plans, and practice drills. Built with React frontend (Vite + Tailwind) and Flask/Python backend with PostgreSQL database, deployed on AWS infrastructure.

## Architecture

### Backend Architecture (Flask + PostgreSQL/SQLite)

**Three-layer architecture:**
- **Insights Layer** (`backend/insights/`) - Diagnostic assessments and performance analytics
- **Personalization Layer** (`backend/personalization/`) - Study plans and adaptive learning paths
- **Skill Builder Layer** (`backend/skill_builder/`) - Practice drills and skill-targeted exercises

Each layer follows the pattern: `routes.py` (API endpoints) → `logic.py` (business logic)

**Database:**
- **Production:** PostgreSQL on AWS RDS (db.t3.micro, free tier)
  - Endpoint: `deductly-db.c0nakqaysihe.us-east-1.rds.amazonaws.com`
  - Database: `deductly`
  - Configured via `DB_TYPE=postgres` environment variable
- **Local Development:** SQLite at `backend/data/deductly.db`
  - Configured via `DB_TYPE=sqlite` (default)
- Schema defined in `setup_database.py`
- Key tables: `skills`, `questions`, `question_skills`
- Dual database support in `backend/db/connection.py`
- LSAT skills taxonomy in `backend/data/lsat_skills_taxonomy.json`
- Questions scraped from LSAT resources in `backend/data/lsat_questions.json`

**Main app:** `backend/app.py`
- Runs on port 5001 (not 5000) locally
- Deployed on AWS Lambda via `backend/lambda_handler.py`
- Registers blueprints from all three layers
- Maintains legacy endpoints for backward compatibility
- CORS configured for both local dev (`localhost:5173`) and production (`deductly.org`, `www.deductly.org`)

### Frontend Architecture (React)

**Authentication:** Firebase Authentication
- Context: `src/contexts/AuthContext.jsx` - Email/password and Google OAuth
- Service: `src/services/userProfile.js` - Firestore user profile management
- Protected routes via `src/components/PrivateRoute.jsx`
- Public routes: `/login`, `/signup`

**API Communication:**
- Service: `src/services/api.js`
- Base URL from environment variable `VITE_API_BASE_URL`
- Local: `http://localhost:5001/api` (development)
- Production: `https://api.deductly.org/api` (AWS API Gateway + Lambda)

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
- Backend: Set in AWS Lambda environment variables
  - `DB_TYPE=postgres`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` for RDS connection

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

### Production Architecture (AWS)

**Custom Domains:**
- Frontend: `https://deductly.org`, `https://www.deductly.org`
- Backend API: `https://api.deductly.org`
- DNS: Namecheap with CNAME records to AWS services
- SSL: AWS Certificate Manager (ACM) certificates

**Frontend: S3 + CloudFront**
- S3 Bucket: `deductly-frontend` (static website hosting)
- CloudFront Distribution: `E3897ANC87L60Y`
- GitHub Actions CI/CD: Auto-deploy on push to `main` or `production` branches
- Workflow: `.github/workflows/deploy-s3.yml`
  - Triggers only on changes to: `src/**`, `public/**`, `index.html`, `vite.config.js`, `package.json`, `package-lock.json`, or the workflow file itself
- Invalidates CloudFront cache on each deployment

**Backend: Lambda + API Gateway**
- Lambda Function: `deductly-backend` (3GB memory, 300s timeout)
- Architecture: ARM64 (AWS Graviton2)
- API Gateway: HTTP API with custom domain `api.deductly.org`
- Container Image: ECR repository `205960220508.dkr.ecr.us-east-1.amazonaws.com/deductly-backend`
- Runtime: Python 3.11 with Flask via Mangum ASGI adapter
- GitHub Actions CI/CD: Auto-deploy on push to `main` or `production` branches
- Workflow: `.github/workflows/deploy-lambda.yml`
  - Triggers only on changes to: `backend/**`, `Dockerfile.lambda`, or the workflow file itself
- **Lambda Warming:** Landing page (`src/pages/Landing.jsx`) pings `/api/warm` on load to prevent cold starts
  - Ensures Lambda is hot when users navigate to Study Plan or other pages
  - Zero additional cost (only warms when users visit)
  - Reduces perceived load time from ~2-3s (cold start) to ~200-500ms (warm)
- **Firebase Credentials:** Stored in AWS Secrets Manager (`deductly/firebase-credentials`)
  - Lambda has IAM permission to read secret via `SecretsManagerReadAccess` policy
  - `backend/app.py` automatically fetches credentials from Secrets Manager when running in Lambda
- **IMPORTANT:** Build with legacy Docker builder (no BuildKit) to avoid multi-platform manifest issues:
  ```bash
  DOCKER_BUILDKIT=0 docker build -f Dockerfile.lambda -t IMAGE_URI .
  ```

**Database: AWS RDS PostgreSQL**
- Instance: `db.t3.micro` (20GB storage)
- Endpoint: `deductly-db.c0nakqaysihe.us-east-1.rds.amazonaws.com`
- Database: `deductly`
- Connection: Via environment variables in Lambda

**Key Deployment Files:**
- `Dockerfile.lambda` - Container image for Lambda with PyTorch dependencies
- `backend/lambda_handler.py` - Mangum wrapper for Flask WSGI-to-ASGI
- `backend/db/connection.py` - Dual database support (SQLite local / PostgreSQL production)
- `.github/workflows/deploy-s3.yml` - Frontend CI/CD automation
- `AWS_MIGRATION_STATUS.md` - Complete AWS infrastructure documentation

**Cost Control:**
- AWS Budget: $10/month limit with email alerts at 80%, 100%, forecasted 100%
- Estimated monthly cost: ~$19-20 (Lambda $2, RDS $15, CloudFront $1, S3 $0.50)

See `AWS_MIGRATION_STATUS.md` for complete infrastructure details and troubleshooting.

## Key Implementation Details

1. **Backend runs on port 5001** (not 5000) locally - check `backend/app.py`
2. **Firebase for authentication**:
   - User profiles stored in Firestore
   - Production: Firebase Admin SDK credentials stored in AWS Secrets Manager (`deductly/firebase-credentials`)
   - Local: Credentials read from `backend/firebase-credentials.json`
   - `backend/app.py` automatically detects Lambda environment and fetches from Secrets Manager
3. **Dual database support**:
   - Local: SQLite at `backend/data/deductly.db` (DB_TYPE=sqlite)
   - Production: PostgreSQL on AWS RDS (DB_TYPE=postgres)
   - ⚠️ **IMPORTANT:** All SQL queries must use PostgreSQL parameter syntax (`%s`) not SQLite (`?`)
4. **Three-layer backend architecture** - each layer is a Flask Blueprint
5. **Legacy endpoint support** - old API routes redirect to new structure
6. **Environment-based API URL** - frontend uses `VITE_API_BASE_URL`:
   - ⚠️ **CRITICAL:** All frontend API calls MUST use `import.meta.env.VITE_API_BASE_URL` or `/api`
   - Local: `http://localhost:5001/api`
   - Production: `https://api.deductly.org/api` (set in `.env` and GitHub Secrets)
   - **NEVER hardcode** API URLs in frontend code (causes 403 errors when calling CloudFront instead of API Gateway)
7. **Docker builds for Lambda** - Must use `DOCKER_BUILDKIT=0` to avoid multi-platform manifest issues
8. **Lambda warming optimization** - Landing page pings `/api/warm` on load to prevent cold starts for better UX
