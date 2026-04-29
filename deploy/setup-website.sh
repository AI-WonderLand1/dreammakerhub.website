#!/bin/bash
set -e

echo "=== WonderSpace Web Deployment ==="

# 1. Install dependencies (if not already)
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# 2. Setup app directory
sudo mkdir -p /srv/wonderspace
sudo chown -R $USER:$USER /srv/wonderspace
cd /srv/wonderspace

# 3. Clone or pull repo (replace with your actual repo URL)
if [ ! -d ".git" ]; then
  echo "Enter your repo URL when prompted, or manually place app files"
  # git clone <YOUR_REPO_URL> .
  echo "Please manually copy your app to /srv/wonderspace"
  exit 1
fi

git pull origin main 2>/dev/null || echo "Git pull skipped"

# 4. Install & build
npm ci
npm run build --workspace=ai-wonder-web

# 5. Create .env.production (fill in your Supabase keys)
if [ ! -f "apps/web/.env.production" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > apps/web/.env.production
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> apps/web/.env.production
  echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> apps/web/.env.production
  echo "Created .env.production - UPDATE WITH YOUR KEYS"
fi

# 6. Start with PM2
cd apps/web
pm2 delete ai-wonder-web 2>/dev/null || true
pm2 start npm --name ai-wonder-web -- start
pm2 save

# 7. Verify
curl -I http://127.0.0.1:5000

echo "=== Deployment complete ==="
echo "Next: configure NGINX (see next step)"