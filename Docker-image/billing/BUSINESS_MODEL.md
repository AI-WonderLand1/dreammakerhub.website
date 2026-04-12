# WonderSpace IDE - Business Model & Pricing

## Revenue Flow

```
User pays YOU (WonderSpace)
    ↓
You pay OpenCode (cost of goods sold)
    ↓
YOUR PROFIT = User Price - OpenCode Cost
```

## Pricing Structure

### Cost Base (What you pay OpenCode)
- **Text AI**: ~$0.002 per 1K tokens (variable based on model)
- **Voice AI**: ~$0.006 per minute (Whisper transcription)
- **Agent Tasks**: ~$0.03 per task (estimated)
- **Runner Executions**: ~$0.05 per run (estimated)

### Your Pricing (What users pay you)

| Tier | User Price | Your Cost | Your Margin |
|------|-----------|-----------|-------------|
| **Free** | $0 | ~$0.50/mo avg usage | Loss leader |
| **Pro** | $19/mo or $0.08/task | ~$0.03/task | 60%+ margin |
| **Enterprise** | $49/mo or $0.15/run | ~$0.05/run | 65%+ margin |

### Recommended Pricing

**Option A: Subscription Model (RECOMMENDED)**
- Free: $0 (limited usage)
- Pro: $19/month unlimited agents
- Enterprise: $49/month unlimited runners

**Option B: Pay-Per-Use**
- Free tier: 100 AI requests/month
- Pro: $0.08 per agent task
- Enterprise: $0.15 per runner execution

**Option C: Hybrid (Best of both)**
- Free: 100 requests/month
- Pro: $9/month + $0.05 per task
- Enterprise: $29/month + $0.10 per run

## Implementation

### API Key Management
You need to:
1. Get OpenCode API key
2. Store it securely (not in repos)
3. Route all user AI requests through your backend
4. Track usage per user/workspace
5. Bill users monthly or per-use

### User Authentication
- Integrate with Stripe/PayPal for payments
- Track usage in PostgreSQL
- Enforce limits based on tier

### Cost Optimization
- Cache common AI responses
- Batch runner executions
- Use cheaper models for simple tasks
- Set hard limits to prevent abuse