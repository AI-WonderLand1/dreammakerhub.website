# Hostinger Deployment Guide for DreamMakerHub.website

This guide will help you fix the 502 Bad Gateway error and deploy your application successfully on Hostinger.

## Current 502 Error Diagnosis

The 502 Bad Gateway error typically indicates:
1. **Application server not running** 
2. **Application crashing on startup**
3. **Missing environment variables** (especially Supabase service role key)
4. **Port configuration mismatch**

## Step 1: Fix Environment Variables on Hostinger

### Critical Environment Variables Needed:

1. **Log into Hostinger Control Panel**
2. Go to **Advanced → Environment Variables**
3. Add the following variables:

```bash
# REQUIRED - From your Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://wwuvfvdylnxiegnowbur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dXZmdmR5bG54aWVnbm93YnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjIwMjEsImV4cCI6MjA4NDAzODAyMX0.QhF4PFCXGJcxaeQY4fODjzngLlNL7h8fZTlUY6b8tlE
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here  # GET THIS FROM SUPABASE

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_URL=https://dreammakerhub.website
PORT=3000  # Hostinger default port

# Security Keys (generate new ones for production)
SECRETS_ENCRYPTION_KEY=$(openssl rand -base64 32)
BYOC_CREDENTIALS_ENCRYPTION_KEY=$(openssl rand -base64 32)
TOKEN_HASH_SECRET=$(openssl rand -base64 32)
```

### How to get Supabase Service Role Key:
1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** → **API**
3. Find **Project API keys** section
4. Copy the **service_role key** (NOT the anon/public key)
5. This key starts with `eyJhbGciOiJIUzI1NiIs...`

## Step 2: Update Supabase Database Schema

Run these migrations in your Supabase SQL Editor:

### 1. Marketplace Tables
```sql
-- Run the migration from: supabase/migrations/004_create_marketplace_tables.sql
```

### 2. Project Domains Table  
```sql
-- Run the migration from: supabase/migrations/005_create_project_domains_table.sql
```

## Step 3: Hostinger Application Setup

### Option A: Using Hostinger Node.js Manager

1. **Connect via SSH** or use **Hostinger File Manager**
2. **Upload your application** to `domains/dreammakerhub.website/public_html/`
3. **Install dependencies**:
   ```bash
   cd ~/domains/dreammakerhub.website/public_html
   npm install
   npm run build
   ```

4. **Configure PM2** (Process Manager):
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start your application with PM2
   pm2 start npm --name "dreammakerhub" -- start
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

### Option B: Using Hostinger Application Manager

1. In Hostinger Control Panel, go to **Advanced → Application Manager**
2. Click **Create Application**
3. Configure:
   - **Application Name**: dreammakerhub
   - **Runtime**: Node.js
   - **Version**: 18.x or 20.x
   - **Port**: 3000
   - **Start Command**: `npm start`
   - **Working Directory**: `/domains/dreammakerhub.website/public_html`

## Step 4: Nginx Configuration (if needed)

If you need custom nginx configuration, create `.htaccess` in public_html:

```nginx
# .htaccess for Next.js on Hostinger
RewriteEngine On
RewriteBase /

# Redirect to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Next.js routing
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Step 5: Test Your Deployment

1. **Check application status**:
   ```bash
   pm2 status  # or check in Hostinger Application Manager
   ```

2. **View application logs**:
   ```bash
   pm2 logs dreammakerhub --lines 100
   ```

3. **Common log errors to check**:
   - `Missing SUPABASE_SERVICE_ROLE_KEY`
   - `Port 3000 already in use`
   - `Module not found` errors

## Step 6: Domain Configuration

1. **In Hostinger DNS settings**, ensure:
   - `dreammakerhub.website` points to your hosting IP
   - `www.dreammakerhub.website` redirects to main domain

2. **In Supabase**, configure custom domains if needed

## Troubleshooting 502 Errors

### 1. Check Application Logs
```bash
# SSH into Hostinger
cd ~/domains/dreammakerhub.website/public_html
cat ~/.pm2/logs/dreammakerhub-error.log
```

### 2. Verify Port Configuration
- Hostinger typically uses port **3000** for Node.js
- Check your `.env` has `PORT=3000`
- Check no other app is using port 3000

### 3. Verify Supabase Connection
```bash
# Test Supabase connection (temporarily add to a route)
curl https://wwuvfvdylnxiegnowbur.supabase.co/rest/v1/
```

### 4. Memory Issues
If memory is low (you mentioned 70%+):
```bash
# Check memory
free -h

# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=512"
```

## Production Monitoring

### 1. Enable Logging
The application now includes:
- **Error boundaries** for React components
- **Structured logging** with trace IDs
- **API error handling middleware**

### 2. Health Check Endpoint
Add to `apps/web/app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
}
```

### 3. Monitor with PM2
```bash
pm2 monit  # Monitor CPU/Memory usage
pm2 logs   # View all logs
```

## Security Checklist

✅ **Environment variables** set in Hostinger (not in code)  
✅ **Supabase RLS policies** enabled  
✅ **Encryption keys** generated for production  
✅ **HTTPS enforced**  
✅ **CSP headers** configured in next.config.js  
✅ **Rate limiting** implemented for auth routes  

## Support

If issues persist:
1. Check **Hostinger error logs** in control panel
2. Check **PM2 logs** via SSH
3. Verify **Supabase project** is active
4. Test **database connection** from Supabase SQL Editor

## Updated Application Features

With this deployment, you now have:

1. **Production-ready Supabase integration** for:
   - Marketplace package management
   - Custom domain resolution  
   - Cloud connections
   - User authentication

2. **Error handling**:
   - React error boundaries
   - API error middleware
   - Structured logging

3. **Database schema** for:
   - Marketplace packages & installs
   - Project domains
   - Cloud connections
   - User projects