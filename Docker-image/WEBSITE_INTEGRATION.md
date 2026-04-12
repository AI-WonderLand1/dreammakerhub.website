# WonderSpace IDE - Website Integration Guide

## DNS Configuration

Add these DNS A records pointing to your server IP:

```
ide.dreammakerhub.website     A     YOUR_SERVER_IP
*.ide.dreammakerhub.website   A     YOUR_SERVER_IP
```

## Flow

### 1. User visits your main website
**URL**: `https://dreammakerhub.website`

Your main site handles:
- Marketing/landing page
- Pricing display
- Stripe payments
- User accounts

### 2. User pays and gets API key
After Stripe payment:
```javascript
// On your main website (Node.js/Express example)
app.post('/webhook/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const customer = event.data.object;
    
    // Generate WonderSpace API key
    const apiKey = 'ws-live-' + crypto.randomBytes(16).toString('hex');
    
    // Store in database
    await db.query(
      'INSERT INTO wonderspace_users (email, api_key, tier) VALUES ($1, $2, $3)',
      [customer.customer_email, apiKey, 'pro']
    );
    
    // Email API key to user
    await sendEmail(customer.customer_email, 'Your WonderSpace API Key', 
      `Your API key: ${apiKey}\nUse it at: https://ide.dreammakerhub.website`);
  }
});
```

### 3. User goes to IDE dashboard
**URL**: `https://ide.dreammakerhub.website`

This is the Coder dashboard where they:
- Log in
- Create their first workspace
- Enter their API key
- Choose template (Docker, DevContainer, etc.)

### 4. User workspace launches
**URL**: `https://username.ide.dreammakerhub.website`

Each user gets their own isolated workspace on a unique subdomain.

## Deploy with Your Domain

```bash
# Deploy to any cloud provider with your domain
./Docker-image/deploy/aws.sh ide.dreammakerhub.website
# or
./Docker-image/deploy/gcp.sh ide.dreammakerhub.website
# or
./Docker-image/deploy/digitalocean.sh ide.dreammakerhub.website
```

## Environment Variables

```bash
# Required
echo "OPENCODE_API_KEY=op-your-secret-key" > .env
echo "DOMAIN=ide.dreammakerhub.website" >> .env
echo "ENABLE_TLS=true" >> .env

# Optional - set your branded API key prefix
echo "WONDERSPACE_API_KEY=ws-live-dreammaker-$(openssl rand -hex 8)" >> .env
```

## Website Integration Code

Add this to your main website's "Launch IDE" button:

```html
<!-- On your landing page -->
<a href="https://ide.dreammakerhub.website?ref=website" class="cta-button">
  Launch IDE
</a>

<!-- Or with API key pre-fill -->
<script>
  // If user is logged into your main site
  const userApiKey = getUserApiKey(); // From your auth system
  document.getElementById('launch-ide').href = 
    `https://ide.dreammakerhub.website?api_key=${userApiKey}`;
</script>
```

## API Key Management Page

Create a page on your main site: `dreammakerhub.website/dashboard`

```html
<h1>Your WonderSpace API Key</h1>
<div class="api-key-box">
  <code id="api-key">ws-live-abc123...</code>
  <button onclick="copyToClipboard()">Copy</button>
</div>
<p>Use this key when creating workspaces in the IDE.</p>
<a href="https://ide.dreammakerhub.website" class="button">
  Open IDE Dashboard
</a>
```

## Branding Consistency

To make the IDE feel like part of your website:

1. **Same colors**: Edit the workspace template settings
2. **Your logo**: Add to Coder dashboard via admin settings
3. **Custom domain**: Already set up with ide.yourdomain.com
4. **Email templates**: Send API keys from your domain

## Monitoring

Track usage from your main site:

```javascript
// Query your billing database
const usage = await db.query(`
  SELECT 
    email,
    tier,
    SUM(charged_usd) as revenue,
    SUM(cost_usd) as costs
  FROM wonderspace_users u
  JOIN ai_usage a ON u.id = a.user_id
  WHERE a.created_at > NOW() - INTERVAL '30 days'
  GROUP BY email, tier
`);

console.log('Monthly revenue:', usage.rows);
```