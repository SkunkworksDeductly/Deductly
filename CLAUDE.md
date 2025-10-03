# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deductly is an education tech platform built with React frontend and Flask/Python backend. The platform provides diagnostic assessments, personalized study plans, and interactive drill practice sessions.

## Architecture

### Frontend (React + Vite + Tailwind CSS)
- **Main App**: `src/App.jsx` - Router setup and main layout with sidebar navigation
- **Components**:
  - `src/components/Sidebar.jsx` - Hamburger menu navigation component
- **Pages**:
  - `src/pages/Landing.jsx` - Home page with hero section and feature cards
  - `src/pages/Diagnostics.jsx` - Interactive diagnostic assessment interface
  - `src/pages/StudyPlan.jsx` - Personalized study plan dashboard
  - `src/pages/Drill.jsx` - Practice drill sessions with customizable settings
- **Services**: `src/services/api.js` - API service for backend communication
- **Styling**: Tailwind CSS with responsive design and clean minimalistic UI

### Backend (Flask/Python)
- **Main App**: `backend/app.py` - Flask server with CORS enabled
- **API Endpoints**:
  - `/` - Welcome message
  - `/api/diagnostics` - Get all diagnostic questions
  - `/api/diagnostics/<id>` - Get specific diagnostic
  - `/api/study-plans` - Get all study plans
  - `/api/study-plans/<id>` - Get specific study plan
  - `/api/drill` - POST to create drill session
  - `/api/drill/submit` - POST to submit drill answers

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development
```bash
# First time setup - Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start Flask development server (http://localhost:5000)
# Use the shortcut script:
npm run backend

# Or manually:
cd backend
source venv/bin/activate
python app.py
```

## Key Features

1. **Responsive Navigation**: Hamburger menu sidebar that works on mobile and desktop
2. **Diagnostic Assessment**: Multi-question assessment with progress tracking and results
3. **Study Plans**: Progress tracking with visual indicators and topic management
4. **Drill Practice**: Customizable practice sessions with different subjects and difficulty levels
5. **Clean UI**: Minimalistic design with Tailwind CSS, proper spacing, and modern aesthetics

## Technology Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS
- **Backend**: Flask, Flask-CORS, Python-dotenv
- **Development**: Hot reload, responsive design, component-based architecture

## Project Structure

```
├── backend/
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # React entry point
│   └── index.css         # Tailwind imports
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Node dependencies
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
```

## Development Notes

- Frontend runs on port 5173 (Vite default)
- Backend runs on port 5000 (Flask default)
- CORS is enabled for frontend-backend communication
- Mock data is currently used in frontend components
- API service is ready for backend integration
- All components use modern React hooks and functional components
- Responsive design works on mobile, tablet, and desktop screen sizes