# AWS Deployment Guide - Deductly

This guide covers deploying Deductly to AWS using App Runner (backend) and S3 + CloudFront (frontend).

## Architecture Overview

```
Users
  ↓
CloudFront (CDN)
  ↓
S3 (React Frontend)

Users
  ↓
App Runner (Flask Backend)
  ↓
EFS (SQLite Database)
  ↓
Firebase Auth
```

**Estimated Monthly Cost:** $7-17/month

---

## Prerequisites

- AWS Account with billing enabled
- GitHub repository access
- Firebase project set up

---

## Part 1: Backend Deployment (App Runner + EFS)

### Step 1: Create EFS File System

1. Go to **AWS Console** → **EFS** → **Create file system**
2. **Name:** `deductly-database`
3. **VPC:** Use default VPC
4. **Availability:** Regional (recommended)
5. Click **Create**
6. **Note down the EFS ID** (e.g., `fs-1234567890abcdef0`)

### Step 2: Create Access Point for EFS

1. In EFS console, select your file system
2. Go to **Access points** tab → **Create access point**
3. Configure:
   - **Name:** `deductly-db-access`
   - **Root directory path:** `/deductly`
   - **POSIX user:**
     - User ID: `1000`
     - Group ID: `1000`
   - **Root directory creation permissions:**
     - Owner user ID: `1000`
     - Owner group ID: `1000`
     - Permissions: `755`
4. Click **Create access point**
5. **Note down the Access Point ID** (e.g., `fsap-1234567890abcdef0`)

### Step 3: Upload SQLite Database to EFS

You have two options:

**Option A: Use EC2 Instance (temporary)**
```bash
# 1. Launch a small EC2 instance (t2.micro - free tier)
# 2. Mount EFS
sudo mkdir /mnt/efs
sudo mount -t efs -o tls fs-XXXXX:/ /mnt/efs

# 3. Copy your database
sudo mkdir -p /mnt/efs/deductly
sudo cp /path/to/your/deductly.db /mnt/efs/deductly/
sudo chown -R 1000:1000 /mnt/efs/deductly

# 4. Terminate EC2 instance when done
```

**Option B: Use AWS DataSync (recommended for large files)**
- Follow AWS DataSync documentation to transfer your database file

### Step 4: Create App Runner Service

1. Go to **AWS Console** → **App Runner** → **Create service**

2. **Source:**
   - Repository type: **Source code repository**
   - Connect to GitHub (authorize AWS access)
   - Select repository: `YourUsername/Deductly`
   - Branch: `main` (or your production branch)
   - Click **Next**

3. **Build settings:**
   - Configuration: **Use a configuration file**
   - Configuration file: `apprunner.yaml`
   - Click **Next**

4. **Service settings:**
   - **Service name:** `deductly-backend`
   - **Port:** `5001`
   - **Environment variables:** (Add these)
     ```
     DB_PATH=/mnt/efs/deductly.db
     FLASK_ENV=production
     FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
     ```
   - **Instance configuration:**
     - CPU: 1 vCPU
     - Memory: 2 GB
     - Min instances: 1
     - Max instances: 5

5. **Auto-deployments:**
   - Enable: **Automatic deployments**

6. **File system:**
   - Click **Add file system**
   - **EFS file system:** Select `deductly-database`
   - **Access point:** Select `deductly-db-access`
   - **Container mount path:** `/mnt/efs`
   - Click **Add**

7. **Security:**
   - **Instance role:** Create new role or use existing
   - Ensure role has permissions:
     - `AmazonElasticFileSystemClientReadWriteAccess`
     - `CloudWatchLogsFullAccess`

8. Click **Next** → **Create & deploy**

9. **Wait 5-10 minutes** for deployment to complete

10. **Copy the App Runner URL** (e.g., `https://abc123.us-east-1.awsapprunner.com`)

### Step 5: Add Firebase Credentials

**Option 1: Use Secrets (Recommended)**
1. Go to App Runner → Your service → **Configuration** → **Secrets**
2. Add `FIREBASE_CREDENTIALS` as a secret
3. Update environment variable to point to secret

**Option 2: Bake into Docker image (Less secure)**
- Copy `firebase-credentials.json` to backend folder before deploy
- Add to `.gitignore` to avoid committing

### Step 6: Verify Backend Works

```bash
# Test the API
curl https://YOUR-APP-RUNNER-URL.awsapprunner.com/

# Should return:
# {
#   "message": "Welcome to Deductly - Education Tech Platform",
#   "version": "2.0.0",
#   ...
# }
```

---

## Part 2: Frontend Deployment (S3 + CloudFront)

### Step 1: Update Frontend API URL

Edit `.env`:
```env
VITE_API_BASE_URL=https://YOUR-APP-RUNNER-URL.awsapprunner.com/api
```

### Step 2: Build Production Frontend

```bash
npm run build
# Creates 'dist' folder with optimized React app
```

### Step 3: Create S3 Bucket

1. Go to **AWS Console** → **S3** → **Create bucket**
2. **Bucket name:** `deductly-frontend` (must be globally unique)
3. **Region:** `us-east-1` (recommended for CloudFront)
4. **Block all public access:** Uncheck (we'll use CloudFront)
5. Click **Create bucket**

### Step 4: Upload Built Files to S3

```bash
# Install AWS CLI if not already installed
# brew install awscli  # macOS
# pip install awscli   # Python

# Configure AWS credentials
aws configure

# Upload build files
aws s3 sync dist/ s3://deductly-frontend/ --delete
```

### Step 5: Set Up S3 Bucket Policy

1. Go to your S3 bucket → **Permissions** → **Bucket Policy**
2. Add this policy (replace `deductly-frontend` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::deductly-frontend/*"
    }
  ]
}
```

### Step 6: Create CloudFront Distribution

1. Go to **AWS Console** → **CloudFront** → **Create distribution**

2. **Origin settings:**
   - **Origin domain:** Select your S3 bucket
   - **Origin path:** Leave empty
   - **Name:** `deductly-s3-origin`
   - **Origin access:** Public

3. **Default cache behavior:**
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP methods:** GET, HEAD, OPTIONS
   - **Cache policy:** CachingOptimized

4. **Settings:**
   - **Price class:** Use all edge locations (or choose based on budget)
   - **Alternate domain names (CNAMEs):** Add your custom domain if you have one
   - **Custom SSL certificate:** Request/import if using custom domain
   - **Default root object:** `index.html`

5. **Error pages (for SPA routing):**
   - Click **Create custom error response**
   - **HTTP error code:** 403
   - **Customize error response:** Yes
   - **Response page path:** `/index.html`
   - **HTTP response code:** 200
   - Repeat for error code 404

6. Click **Create distribution**

7. **Wait 10-15 minutes** for CloudFront to deploy

8. **Copy the CloudFront domain** (e.g., `d1234567890abc.cloudfront.net`)

### Step 7: Update CORS in Backend

Update `backend/app.py` CORS configuration:

```python
CORS(app,
    origins=[
        'http://localhost:5173',
        'https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net',
        'https://yourdomain.com'  # If using custom domain
    ],
    allow_headers=['Content-Type', 'Authorization'],
    expose_headers=['Content-Type', 'Authorization'],
    supports_credentials=True
)
```

Commit and push - App Runner will auto-deploy!

---

## Part 3: Deployment Workflow

### Daily Development Workflow

```bash
# 1. Make changes to backend
git add backend/
git commit -m "Update backend feature"
git push origin main

# ✨ App Runner automatically deploys in 3-5 minutes

# 2. Make changes to frontend
git add src/
npm run build
aws s3 sync dist/ s3://deductly-frontend/ --delete

# ✨ Changes live immediately (CloudFront may take 5-10 min to invalidate cache)
```

### Invalidate CloudFront Cache (if needed)

```bash
# After frontend updates, force CloudFront to refresh
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

---

## Part 4: Monitoring & Logs

### App Runner Logs

1. Go to **App Runner** → Your service → **Logs**
2. View application logs and deployment logs
3. Or use CloudWatch:
   - **CloudWatch** → **Log groups** → `/aws/apprunner/deductly-backend`

### CloudFront Monitoring

1. Go to **CloudFront** → Your distribution → **Monitoring**
2. View requests, data transfer, error rates

### Cost Monitoring

1. Go to **AWS Console** → **Billing Dashboard**
2. Set up budget alerts:
   - Budgets → Create budget
   - Set monthly limit (e.g., $20)
   - Enable email alerts at 80% and 100%

---

## Part 5: Custom Domain (Optional)

### For Backend (App Runner):

1. Go to App Runner → Your service → **Custom domains**
2. Click **Link domain**
3. Add your domain (e.g., `api.deductly.com`)
4. Follow DNS configuration instructions (add CNAME records)

### For Frontend (CloudFront):

1. Request SSL certificate in **AWS Certificate Manager** (must be in us-east-1)
2. Add domain to CloudFront distribution alternate domains
3. Update DNS to point to CloudFront domain (CNAME or ALIAS record)

---

## Troubleshooting

### Backend not starting:
- Check App Runner logs in CloudWatch
- Verify EFS is mounted correctly
- Ensure database file exists at `/mnt/efs/deductly.db`

### Database locked errors:
- Check if WAL mode is enabled (should be automatic)
- Verify only 1 App Runner instance is writing (for now)

### Frontend not loading:
- Check S3 bucket policy allows public read
- Verify CloudFront error pages redirect to index.html
- Check browser console for CORS errors

### CORS errors:
- Ensure App Runner URL is in CORS origins
- Check if Firebase credentials are loaded correctly

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| App Runner | $5-12/month | 1 vCPU, 2GB RAM |
| EFS | $1-3/month | ~1GB database storage |
| S3 | $0.50-1/month | Static files + requests |
| CloudFront | $1-3/month | Data transfer |
| **Total** | **$7-19/month** | For low traffic |

**Free Tier Benefits** (first 12 months):
- App Runner: 450,000 vCPU-seconds + 900,000 memory-seconds/month
- S3: 5GB storage + 20,000 GET requests
- CloudFront: 1TB data transfer

---

## Next Steps

- [ ] Set up automated database backups (EFS → S3)
- [ ] Configure CloudWatch alarms for errors
- [ ] Set up GitHub Actions for automated frontend deployment
- [ ] Add custom domain
- [ ] Set up staging environment

---

## Support

For issues or questions:
- Check AWS App Runner documentation
- Review CloudWatch logs
- Open GitHub issue in the repository
