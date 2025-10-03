# Deployment Guide

This guide explains how to deploy Deductly with the frontend on GitHub Pages (free) and the backend on Render (free).

## Backend Deployment (Render)

### 1. Create a Render Account
- Go to https://render.com
- Sign up with your GitHub account

### 2. Create a New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `Deductly` repository
4. Configure the service:
   - **Name**: `deductly-backend` (or your choice)
   - **Region**: Select closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free`

### 3. Add Environment Variables (if needed)
- In Render dashboard → Environment
- Add any variables from your `.env` file if you have them

### 4. Deploy
- Click "Create Web Service"
- Render will automatically deploy your backend
- Note the URL (e.g., `https://deductly-backend.onrender.com`)

**Important**: Free Render services sleep after 15 minutes of inactivity. First request may take ~30 seconds to wake up.

## Frontend Deployment (GitHub Pages)

### 1. Enable GitHub Pages
1. Go to your GitHub repository
2. Settings → Pages
3. Source: "GitHub Actions"

### 2. Add GitHub Secrets
1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID
   - `VITE_API_BASE_URL`: Your Render backend URL + `/api` (e.g., `https://deductly-backend.onrender.com/api`)

### 3. Deploy
- Push your code to the `main` branch
- GitHub Actions will automatically build and deploy
- Your site will be available at: `https://[your-username].github.io/Deductly/`

## Local Development

### Frontend
```bash
npm run dev
```
Runs on http://localhost:5173

### Backend
```bash
npm run backend
```
Runs on http://localhost:5001

## Environment Variables

### Development (.env file)
Create a `.env` file in the root directory:
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
- Frontend: Set in GitHub Secrets (see above)
- Backend: Set in Render dashboard → Environment

## Updating CORS Settings

After deploying, update your backend CORS settings in `backend/app.py` to allow your GitHub Pages domain:

```python
CORS(app, origins=[
    'http://localhost:5173',
    'https://[your-username].github.io'
])
```

## Troubleshooting

### Backend Issues
- Check Render logs in the dashboard
- Verify all dependencies are in `requirements.txt`
- Ensure Gunicorn is installed

### Frontend Issues
- Check GitHub Actions tab for build errors
- Verify all secrets are set correctly
- Check browser console for CORS errors

### Database Connection
- Ensure Firestore is enabled in Firebase Console
- Verify Firebase security rules allow authenticated access
- Check that all Firebase env variables are correct

## Cost
- **GitHub Pages**: Free (1GB storage, 100GB bandwidth/month)
- **Render**: Free tier (750 hours/month, sleeps after inactivity)
- **Total**: $0/month

## Notes
- Render free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid tier for production use (no sleep)
