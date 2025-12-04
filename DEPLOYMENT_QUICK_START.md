# Deployment Quick Start

Quick reference for deploying Deductly to AWS.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] GitHub repository pushed
- [ ] Firebase credentials ready

---

## One-Time Setup (30-45 minutes)

### 1. Create EFS File System
```bash
# AWS Console → EFS → Create file system
# Name: deductly-database
# Note: Save EFS ID (fs-XXXXX)
```

### 2. Create EFS Access Point
```bash
# In EFS console → Access points → Create
# Root path: /deductly
# User/Group ID: 1000
# Permissions: 755
# Note: Save Access Point ID (fsap-XXXXX)
```

### 3. Upload Database to EFS
```bash
# Option: Launch t2.micro EC2, mount EFS, copy database
# Or use AWS DataSync
```

### 4. Create App Runner Service
```bash
# AWS Console → App Runner → Create service
# Source: GitHub → YourRepo/main branch
# Config file: apprunner.yaml
# Add EFS mount: /mnt/efs → your-access-point-id
# Environment variables:
#   DB_PATH=/mnt/efs/deductly.db
#   FLASK_ENV=production
```

### 5. Set Up Frontend
```bash
# Update .env
VITE_API_BASE_URL=https://YOUR-APP-RUNNER-URL.awsapprunner.com/api

# Build and deploy
npm run build
aws s3 mb s3://deductly-frontend
aws s3 sync dist/ s3://deductly-frontend/

# Create CloudFront distribution
# AWS Console → CloudFront → Create
# Origin: your S3 bucket
# Default root: index.html
# Error pages: 403/404 → /index.html (200)
```

---

## Daily Workflow

### Deploy Backend Changes
```bash
# Just push to GitHub - auto-deploys!
git add backend/
git commit -m "Update backend"
git push origin main

# App Runner detects change and deploys in 3-5 min
# Check status: AWS Console → App Runner → Your service
```

### Deploy Frontend Changes
```bash
# 1. Update code
git add src/
git commit -m "Update frontend"

# 2. Build
npm run build

# 3. Upload to S3
aws s3 sync dist/ s3://deductly-frontend/ --delete

# 4. Invalidate CloudFront cache (optional, for immediate updates)
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

---

## Useful Commands

### View App Runner Logs
```bash
# In AWS Console
# App Runner → Your service → Logs

# Or via CloudWatch
aws logs tail /aws/apprunner/deductly-backend --follow
```

### Check App Runner Status
```bash
aws apprunner list-services

aws apprunner describe-service \
  --service-arn YOUR-SERVICE-ARN
```

### Update Backend Environment Variables
```bash
# AWS Console → App Runner → Configuration → Edit
# Or via CLI:
aws apprunner update-service \
  --service-arn YOUR-SERVICE-ARN \
  --source-configuration file://config.json
```

### Sync Database Changes
```bash
# Backup current EFS database
# Launch EC2, mount EFS, copy file

# Or update via migration script in App Runner
```

### Monitor Costs
```bash
# AWS Console → Billing Dashboard → Cost Explorer
# Set up budget alerts for $20/month
```

---

## Troubleshooting Quick Fixes

### Backend won't start
```bash
# 1. Check logs
# App Runner → Logs

# 2. Verify EFS mount
# Should show /mnt/efs in service config

# 3. Test database connection
# SSH to EC2, mount EFS, check file exists:
ls -la /mnt/efs/deductly.db
```

### Frontend shows CORS errors
```bash
# 1. Update backend CORS origins in app.py
# 2. Redeploy backend (git push)
# 3. Clear browser cache
```

### Database locked errors
```bash
# 1. Check connection.py has WAL mode enabled
# 2. Verify only 1 App Runner instance running
# 3. Check EFS mount is working
```

### Frontend not updating
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR-DIST-ID \
  --paths "/*"

# Wait 5-10 minutes
```

---

## URLs to Save

```bash
# Backend
App Runner URL: https://______.awsapprunner.com
CloudWatch Logs: /aws/apprunner/deductly-backend

# Frontend
S3 Bucket: s3://deductly-frontend
CloudFront Domain: https://______.cloudfront.net

# Database
EFS ID: fs-______
Access Point: fsap-______
```

---

## Cost Monitoring

```bash
# Expected monthly costs (low traffic):
# - App Runner: $5-12
# - EFS: $1-3
# - S3: $0.50-1
# - CloudFront: $1-3
# Total: ~$7-19/month
```

---

## Rollback Procedure

### Backend (if deployment breaks)
```bash
# AWS Console → App Runner → Your service
# → Deployments tab
# → Select previous working deployment
# → Click "Deploy"
# Takes ~30 seconds
```

### Frontend (if broken build)
```bash
# 1. Checkout previous commit
git checkout HEAD~1

# 2. Rebuild and deploy
npm run build
aws s3 sync dist/ s3://deductly-frontend/ --delete
```

---

## Full Documentation

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed step-by-step instructions.
