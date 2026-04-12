#!/usr/bin/env node
/**
 * WonderSpace Billing API Gateway
 * 
 * This service sits between user workspaces and OpenCode AI:
 * 1. Authenticates requests via Coder session tokens
 * 2. Tracks usage per user/workspace
 * 3. Routes to OpenCode with YOUR API key
 * 4. Enforces quotas and limits
 * 5. Returns responses to users
 * 
 * Run: node billing/gateway.js
 */

const http = require('http');
const https = require('https');
const { Pool } = require('pg');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  PORT: process.env.BILLING_PORT || 8888,
  CODER_URL: process.env.CODER_ACCESS_URL || 'http://localhost:7080',
  OPENCODE_API_URL: process.env.OPENCODE_API_URL || 'https://api.opencode.ai',
  // OPENCODE_API_KEY is YOUR key - hidden from users, never exposed
  OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
  // WONDERSPACE_API_KEY is what you give to users (your branded key)
  WONDERSPACE_API_KEY: process.env.WONDERSPACE_API_KEY || 'ws-live-' + crypto.randomBytes(16).toString('hex'),
  
  // Pricing (what you pay OpenCode)
  COSTS: {
    text_per_1k_tokens: 0.002,
    voice_per_minute: 0.006,
    agent_per_task: 0.03,
    runner_per_execution: 0.05
  },
  
  // Your markup
  MARKUP: {
    text: 2.0,      // 2x markup = 100% profit
    voice: 2.0,
    agent: 2.67,    // $0.03 cost -> $0.08 price
    runner: 3.0     // $0.05 cost -> $0.15 price
  }
};

// Database connection
const pool = new Pool({
  connectionString: process.env.CODER_PG_CONNECTION_URL || 'postgres://coder@localhost:5432/coder'
});

// Middleware: Authenticate request
// Users authenticate with Coder session + WonderSpace API key (your branded key)
async function authenticate(req) {
  const sessionToken = req.headers['coder-session-token'] || req.headers.authorization?.replace('Bearer ', '');
  const apiKey = req.headers['x-wonderspace-api-key'] || req.headers['x-api-key'];
  
  // Check if they provided the WonderSpace API key (your branded key)
  // This is what you sell to users - NOT the OpenCode key
  if (apiKey && apiKey === CONFIG.WONDERSPACE_API_KEY) {
    // API key auth (for programmatic access)
    // Look up user by API key in database
    const result = await pool.query(
      'SELECT * FROM wonderspace_users WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  }
  
  // Otherwise use Coder session auth (for dashboard users)
  if (!sessionToken) {
    throw new Error('Authentication required. Provide Coder session token or WonderSpace API key.');
  }
  
  // Verify with Coder API
  return new Promise((resolve, reject) => {
    const request = https.get(`${CONFIG.CODER_URL}/api/v2/users/me`, {
      headers: { 'Coder-Session-Token': sessionToken }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error('Invalid session'));
        }
      });
    });
    request.on('error', reject);
  });
}

// Track usage in database
async function trackUsage(userId, workspaceId, requestType, tokensIn = 0, tokensOut = 0) {
  const costBase = requestType === 'text' 
    ? ((tokensIn + tokensOut) / 1000) * CONFIG.COSTS.text_per_1k_tokens
    : requestType === 'voice'
    ? CONFIG.COSTS.voice_per_minute
    : requestType === 'agent'
    ? CONFIG.COSTS.agent_per_task
    : CONFIG.COSTS.runner_per_execution;
  
  const markup = CONFIG.MARKUP[requestType] || 2.0;
  const charged = costBase * markup;
  
  await pool.query(
    `INSERT INTO ai_usage (user_id, workspace_id, request_type, tokens_input, tokens_output, cost_usd, charged_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, workspaceId, requestType, tokensIn, tokensOut, costBase, charged]
  );
  
  return { costBase, charged };
}

// Check user quota
async function checkQuota(userId) {
  const result = await pool.query(
    `SELECT tier, quota_used, monthly_quota FROM wonderspace_users WHERE coder_user_id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    // Auto-create free user
    await pool.query(
      `INSERT INTO wonderspace_users (coder_user_id, tier) VALUES ($1, 'free')`,
      [userId]
    );
    return { allowed: true, tier: 'free', remaining: 100 };
  }
  
  const user = result.rows[0];
  const remaining = user.monthly_quota - user.quota_used;
  
  return {
    allowed: user.tier !== 'free' || remaining > 0,
    tier: user.tier,
    remaining
  };
}

// Route request to OpenCode
async function routeToOpenCode(endpoint, body, method = 'POST') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONFIG.OPENCODE_API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENCODE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const request = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

// Main request handler
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Coder-Session-Token');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // Only handle /api/ai/* paths
    if (!req.url.startsWith('/api/ai/')) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    
    // Authenticate
    const user = await authenticate(req);
    
    // Check quota
    const quota = await checkQuota(user.id);
    if (!quota.allowed) {
      res.writeHead(429);
      res.end(JSON.stringify({ 
        error: 'Quota exceeded',
        message: 'Upgrade to Pro for unlimited AI',
        upgrade_url: '/billing/upgrade'
      }));
      return;
    }
    
    // Parse body
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise(resolve => req.on('end', resolve));
    const parsedBody = body ? JSON.parse(body) : {};
    
    // Determine request type from URL
    const requestType = req.url.includes('/agent') ? 'agent' 
      : req.url.includes('/runner') ? 'runner'
      : req.url.includes('/voice') ? 'voice'
      : 'text';
    
    // Track usage (async, don't block)
    const workspaceId = parsedBody.workspace_id || req.headers['coder-workspace-id'];
    trackUsage(user.id, workspaceId, requestType, 
      parsedBody.tokens_input || 0, 
      parsedBody.tokens_output || 0
    ).catch(console.error);
    
    // Route to OpenCode
    const openCodeResponse = await routeToOpenCode(
      req.url.replace('/api/ai', ''),
      parsedBody,
      req.method
    );
    
    // Return response with usage info
    res.writeHead(openCodeResponse.status, {
      'Content-Type': 'application/json'
    });
    
    const responseBody = JSON.parse(openCodeResponse.body);
    responseBody._wonderspace = {
      tier: quota.tier,
      quota_remaining: quota.remaining,
      request_type: requestType
    };
    
    res.end(JSON.stringify(responseBody));
    
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'wonderspace-billing' }));
  }
});

server.listen(CONFIG.PORT, () => {
  console.log(`✅ WonderSpace Billing Gateway running on port ${CONFIG.PORT}`);
  console.log(`📊 Tracking usage and billing for OpenCode AI`);
  console.log(`💰 Markup: ${CONFIG.MARKUP.text}x cost + profit`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  pool.end();
  server.close();
});