# Oracle + Supabase Deployment (No Vercel)

This runbook is for hosting `apps/web` on your own Oracle Cloud VM while continuing to use Supabase for auth, database, and storage.

## What this repo currently confirms

- The web app is a Next.js service with start command: `next start -p 5000 -H 0.0.0.0` (`apps/web/package.json`).
- The app has broad Supabase integration across API routes and UI modules (`apps/web/app/**`, `apps/web/services/storage/SupabaseProvider.ts`).
- The repository still contains Vercel deployment references in docs (`README.md`, `DOCS.md`, `openapi.yaml`).
- There is an OCI-oriented IDE deployment script (`deploy-ide.sh`), but it references `deploy/k8s/*.yaml` files that are not present in this repository.

## Target architecture (no Vercel)

- **Runtime:** Node.js process for `apps/web` (port `5000`)
- **Process manager:** `pm2` or `systemd`
- **Reverse proxy + TLS:** NGINX + Let's Encrypt (Certbot)
- **DNS:** `dreammakerhub.website` A record to your Oracle VM public IP
- **Backend services:** Supabase (remote)

## 1) Prepare Oracle VM

Run on the VM:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2) Deploy app code

```bash
sudo mkdir -p /srv/wonderspace
sudo chown -R "$USER":"$USER" /srv/wonderspace
cd /srv/wonderspace
git clone <your-repo-url> .
npm ci
npm run build --workspace=ai-wonder-web
```

## 3) Set runtime environment

Create `/srv/wonderspace/apps/web/.env.production` and include at minimum:

```env
NODE_ENV=production
PORT=5000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # server only
```

> Keep server-only secrets out of client-exposed `NEXT_PUBLIC_*` variables.

## 4) Start the app without Vercel

```bash
cd /srv/wonderspace/apps/web
pm2 start npm --name ai-wonder-web -- start
pm2 save
pm2 startup
```

Validate local service:

```bash
curl -I http://127.0.0.1:5000
```

## 5) Configure domain + HTTPS

### DNS (at your domain registrar)

- `A  dreammakerhub.website  -> <ORACLE_VM_PUBLIC_IP>`
- Optional: `A  www.dreammakerhub.website -> <ORACLE_VM_PUBLIC_IP>`

### NGINX reverse proxy

Create `/etc/nginx/sites-available/dreammakerhub.website`:

```nginx
server {
  listen 80;
  server_name dreammakerhub.website www.dreammakerhub.website;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Enable site + TLS:

```bash
sudo ln -s /etc/nginx/sites-available/dreammakerhub.website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d dreammakerhub.website -d www.dreammakerhub.website
```

## 6) Post-deploy checks

```bash
curl -I https://dreammakerhub.website
curl -s https://dreammakerhub.website/api/health/auth
curl -s https://dreammakerhub.website/api/health/db
curl -s https://dreammakerhub.website/api/health/storage
```

If any health endpoint returns auth-related errors, re-check Supabase keys and site URL settings in Supabase dashboard.

## 7) Notes and known gaps in this repo

- `deploy-ide.sh` currently cannot be used as-is because referenced manifest files under `deploy/k8s/` are missing.
- `kubernetes-devcontainer/terraform.tfvars` includes sensitive values and should be rotated + removed from version control if still active.

## 8) Optional hardening

- Restrict firewall to `22`, `80`, `443`.
- Run app as a dedicated Linux user.
- Set up log rotation for PM2 and NGINX.
- Add CI to build/test before deploy.
