# WonderSpace IDE - Monetization Setup

## How You Make Money

```
User pays YOU (WonderSpace)
    ↓
You pay OpenCode (API costs)
    ↓
YOUR PROFIT = User Price - OpenCode Cost
```

## Quick Start

### 1. Get Your OpenCode API Key (YOUR secret key)

1. Sign up at https://opencode.ai
2. Get your API key from the dashboard
3. **KEEP THIS SECRET** - this is what YOU pay OpenCode with
4. Set it as environment variable: `OPENCODE_API_KEY=your_secret_key_here`

### 2. Build and Run

```bash
# Build the image
cd Docker-image
make build

# Run locally (HTTP only, for testing)
# Note: WONDERSPACE_API_KEY is auto-generated or set your own branded key
docker run -d \
  --name wonderspace \
  -p 7080:7080 \
  -p 8888:8888 \
  -e OPENCODE_API_KEY=your_secret_opencode_key_here \
  -e WONDERSPACE_API_KEY=ws-live-your-branded-key \
  -e CODER_ACCESS_URL=http://localhost:7080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wonderspace-ide:latest

# Or use docker-compose
docker-compose up -d
```

### 3. Get Your WonderSpace API Key (what you sell to users)

After starting, you'll see:
```
🔑 WONDERSPACE API KEY (give this to your users):
   ws-live-abc123...

🔒 OPENCODE_API_KEY (hidden - only you have this)
```

**Give the WonderSpace key to your users. Keep the OpenCode key secret.**

### 3. Set Up Payments (Stripe Recommended)

1. Sign up at https://stripe.com
2. Create products:
   - Pro Plan: $19/month
   - Enterprise Plan: $49/month
3. Integrate Stripe Checkout into your landing page
4. When users pay, update their tier in the database:

```sql
-- After user pays via Stripe
UPDATE wonderspace_users 
SET tier = 'pro', 
    stripe_subscription_id = 'sub_xxx',
    monthly_quota = 999999
WHERE email = 'user@example.com';
```

## Pricing Strategy

### Your Costs (what you pay OpenCode)
- Text AI: ~$0.002 per 1K tokens
- Voice AI: ~$0.006 per minute
- Agent tasks: ~$0.03 per task
- Runner executions: ~$0.05 per run

### Your Prices (what users pay you)

**Recommended: Subscription Model**

| Tier | Price | Includes | Your Margin |
|------|-------|----------|-------------|
| **Free** | $0 | 100 AI requests/month | Loss leader |
| **Pro** | $19/month | Unlimited agents | 80%+ profit |
| **Enterprise** | $49/month | Unlimited runners | 85%+ profit |

**Alternative: Pay-Per-Use**
- Free: 100 requests/month
- Pro: $0.08 per agent task (your cost: $0.03)
- Enterprise: $0.15 per runner (your cost: $0.05)

**Best: Hybrid Model**
- Free: 100 requests/month
- Pro: $9/month + $0.05 per task
- Enterprise: $29/month + $0.10 per run

## Architecture

### API Key Flow (The "Hide and Sell" Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│  USER'S SIDE (what they see)                                │
│  - WonderSpace API Key: ws-live-xxx                         │
│  - They think: "I'm using WonderSpace AI"                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  YOUR BILLING GATEWAY (port 8888)                           │
│  - Validates WonderSpace API key                            │
│  - Tracks usage per user                                    │
│  - Enforces quotas & billing                                │
│  - YOU control everything here                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ (Hidden from users)
┌─────────────────────────────────────────────────────────────┐
│  OPENCODE API (using YOUR secret key)                       │
│  - OpenCode receives: "API Key: op-xxx"                     │
│  - User never sees this key                                 │
│  - You pay OpenCode for usage                               │
│  - You bill users at a markup                               │
└─────────────────────────────────────────────────────────────┘
```

### The Keys

| Key | Who Has It | Purpose | Exposure |
|-----|-----------|---------|----------|
| **OPENCODE_API_KEY** | Only you | Pay OpenCode for AI usage | 🔒 Secret - never share |
| **WONDERSPACE_API_KEY** | You + your users | Access your branded AI service | 🌐 Public - this is your product |

### Revenue Flow

1. User signs up on your website (your brand)
2. User pays you $19/month (subscription) or $0.08/task (pay-per-use)
3. You give them a **WonderSpace API Key** (your branded key)
4. User makes AI requests through your billing gateway
5. Your gateway uses **YOUR** OpenCode key (hidden) to fulfill requests
6. You pay OpenCode ~$0.03 per task
7. **Your profit: $0.05 per task (60%+ margin)**

## Database Tables

The billing system tracks:
- **wonderspace_users**: User tiers and quotas
- **ai_usage**: Every AI request with cost breakdown
- **monthly_bills**: Monthly billing records

Query to see your monthly profit:
```sql
SELECT 
  year, month,
  SUM(charged_usd) as revenue,
  SUM(cost_usd) as costs,
  SUM(charged_usd) - SUM(cost_usd) as profit
FROM ai_usage
WHERE year = 2026
GROUP BY year, month;
```

## Customization

### White-Label Branding
All OpenCode branding is removed. Users see:
- "AI Assistant" (not "OpenCode")
- "WonderSpace IDE" (your brand)
- Generic icons

### Custom Domain
Set your domain:
```bash
docker run -d \
  -e DOMAIN=ide.yourcompany.com \
  -e ENABLE_TLS=true \
  -e OPENCODE_API_KEY=xxx \
  wonderspace-ide:latest
```

### Custom Pricing
Edit `Docker-image/billing/gateway.js`:
```javascript
MARKUP: {
  text: 3.0,    // 3x markup
  voice: 3.0,
  agent: 4.0,   // Higher margin on agents
  runner: 5.0   // Even higher on enterprise
}
```

## Deploy to Cloud

### AWS
```bash
./Docker-image/deploy/aws.sh ide.yourdomain.com
```

### Google Cloud
```bash
./Docker-image/deploy/gcp.sh ide.yourdomain.com
```

### DigitalOcean
```bash
./Docker-image/deploy/digitalocean.sh ide.yourdomain.com
```

## Monitoring

Check billing gateway health:
```bash
curl http://localhost:8888/healthz
```

View real-time usage:
```bash
docker exec wonderspace psql -U coder -d coder -c "SELECT * FROM ai_usage ORDER BY created_at DESC LIMIT 10;"
```

## Support

- OpenCode API docs: https://opencode.ai/docs
- Coder docs: https://coder.com/docs
- WonderSpace issues: GitHub issues