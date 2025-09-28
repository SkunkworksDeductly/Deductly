# Deductly
Education Tech Platform

A modern education technology platform built with React frontend and Flask/Python backend, featuring diagnostic assessments, personalized study plans, and interactive drill practice sessions.

## Features

- **Smart Diagnostics**: Interactive assessment system with progress tracking
- **Personalized Study Plans**: Customized learning paths with progress visualization
- **Practice Drills**: Targeted exercises with customizable difficulty and subject areas
- **Responsive Design**: Clean, minimalistic UI that works on all devices
- **Hamburger Navigation**: Smooth sidebar menu for easy navigation

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Modern responsive design

### Backend
- Flask/Python REST API
- CORS enabled for frontend communication
- JSON data handling

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start Flask server
python app.py

# Backend will run on http://localhost:5000
```

### Full Development Setup
1. Open two terminal windows
2. In terminal 1: Run `npm run dev` (frontend)
3. In terminal 2: Run `cd backend && python app.py` (backend)
4. Open http://localhost:5173 to view the application

## Project Structure

```
├── backend/
│   ├── app.py              # Flask server with API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── src/
│   ├── components/        # React components
│   │   └── Sidebar.jsx    # Navigation component
│   ├── pages/            # Page components
│   │   ├── Landing.jsx   # Home page
│   │   ├── Diagnostics.jsx # Assessment interface
│   │   ├── StudyPlan.jsx # Study plan dashboard
│   │   └── Drill.jsx     # Practice sessions
│   ├── services/         # API services
│   └── App.jsx           # Main app component
├── public/               # Static assets
├── index.html           # HTML template
└── package.json         # Node.js dependencies
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `python app.py` - Start Flask development server

## API Endpoints

- `GET /` - Welcome message
- `GET /api/diagnostics` - Get diagnostic questions
- `GET /api/study-plans` - Get study plans
- `POST /api/drill` - Create drill session
- `POST /api/drill/submit` - Submit drill answers

## Development

The application is set up for easy development with:
- Hot reload for both frontend and backend
- CORS configured for local development
- Mock data for frontend development
- Clean separation between frontend and backend

## License

This project is licensed under the MIT License.
