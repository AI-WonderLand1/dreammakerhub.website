# WonderSpace IDE - Quick Start

## ⚡ One-Click Install

### Option 1: One-Line Installer (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/install.sh | bash
```

This will:
- ✅ Check/install Docker
- ✅ Ask for your domain and API key
- ✅ Download and configure everything
- ✅ Start the IDE
- ✅ Give you the API key to share with users

### Option 2: Docker Compose (Manual)

```bash
# 1. Clone/download the docker-compose.yml
curl -O https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/docker-compose.yml

# 2. Create .env file
cat > .env <<EOF
DOMAIN=ide.yourdomain.com
OPENCODE_API_KEY=your_secret_key_from_opencode_ai
ENABLE_TLS=true
EOF

# 3. Start
docker-compose up -d

# 4. Get your API key
docker-compose logs | grep "WONDERSPACE API KEY"
```

### Option 3: Cloud Deploy Buttons

#### DigitalOcean
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/wonderingtribe/wonderspace/tree/main)

#### AWS
```bash
curl -fsSL https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/Docker-image/deploy/aws.sh | bash -s ide.yourdomain.com
```

#### Google Cloud
```bash
curl -fsSL https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/Docker-image/deploy/gcp.sh | bash -s ide.yourdomain.com
```

#### Oracle Cloud (OCI)
```bash
curl -fsSL https://raw.githubusercontent.com/wonderingtribe/wonderspace/main/Docker-image/deploy/oci.sh | bash -s ide.yourdomain.com
```

## 🎯 What You Get

After running the installer:

```
✅ IDE Dashboard: https://ide.yourdomain.com
✅ User Workspaces: https://*.ide.yourdomain.com
✅ Billing API: http://localhost:8888
✅ Your branded API key: ws-live-xxxxxxxx...
```

## 💰 Making Money

1. **Give users your API key** (`ws-live-xxx`)
2. **They pay you** for Pro ($19/mo) or Enterprise ($49/mo)
3. **You pay OpenCode** ~40% of that (your cost)
4. **Keep 60% profit**

## 📋 Requirements

- A server with Docker (any cloud provider or local)
- A domain name
- OpenCode API key (get free credits at opencode.ai)

## 🆘 Support

- Docs: https://github.com/wonderingtribe/wonderspace/tree/main/docs
- Issues: https://github.com/wonderingtribe/wonderspace/issues