import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { Octokit } from 'octokit';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { promises as fsPromises } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { createUncertaintyConfession, createRejectedActionConfession, createRiskFlagConfession, createLimitationConfession, createCorrectionConfession } from './src/confessions';

// Initialize Firebase Admin
let db: Firestore | null = null;
try {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'project-1f759584-5d77-4640-8d3'
  });
  db = getFirestore();
} catch (e) {
  console.log('Firebase admin already initialized or failed', e);
}

// dotenv.config(); // Removed to avoid shadowing platform-provided env vars

async function getProjectFiles(dir: string, baseDir: string): Promise<{path: string, content: string}[]> {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  let files: {path: string, content: string}[] = [];
  
  const ignored = ['node_modules', 'dist', '.git', '.env', '.DS_Store', 'package-lock.json'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit per file to prevent memory/API issues
  
  for (const entry of entries) {
    if (ignored.includes(entry.name)) continue;
    
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      files = files.concat(await getProjectFiles(fullPath, baseDir));
    } else {
      const stat = await fsPromises.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE) {
        console.warn(`Skipping ${fullPath} - exceeds 5MB limit`);
        continue;
      }
      const content = await fsPromises.readFile(fullPath, 'base64');
      files.push({ path: relPath, content });
    }
  }
  return files;
}

const replicateRateLimits = new Map<string, number>();
const REPLICATE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());
  app.use(cookieParser());

  // --- GitHub OAuth Routes ---

  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
    }
    const redirectUri = `${process.env.APP_URL}/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
    res.json({ url });
  });

  app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        return res.status(400).send('Failed to obtain access token');
      }

      // Set cookie for the frontend
      res.cookie('github_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/user', async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();
      res.json(data);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.get('/api/repos', async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch repos' });
    }
  });

  // --- Stripe ---
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Pro Subscription',
              },
              unit_amount: 2000, // $20.00
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/success`,
        cancel_url: `${process.env.APP_URL}/cancel`,
      });
      res.json({ id: session.id });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('github_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.json({ success: true });
  });

  // --- License Validation ---
  app.post('/api/validate-license', (req, res) => {
    const { licenseKey } = req.body;
    
    // Check for Dev Mode
    const isDevMode = process.env.DEV_MODE === 'true';
    const isValid = licenseKey === 'RICK-MORTY-PRO-2026' || (isDevMode && licenseKey === 'DEV-MODE');
    
    if (isValid) {
      const token = jwt.sign({ isLicensed: true }, process.env.JWT_SECRET || 'super-secret-key', { expiresIn: '7d' });
      res.cookie('license_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  });

  // --- GitHub Webhook Endpoint ---
  app.post('/api/webhooks/github', async (req, res) => {
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;
    const payload = req.body;

    if (!event || !deliveryId) {
      return res.status(400).send('Missing GitHub webhook headers');
    }

    try {
      const repoFullName = payload.repository?.full_name || 'unknown';
      const action = payload.action || 'none';

      // 1. Log the webhook event securely in Firestore
      if (db) {
        await db.collection('webhook_logs').add({
          deliveryId,
          event,
          repo: repoFullName,
          action,
          timestamp: FieldValue.serverTimestamp(),
        });
      } else {
        console.warn('Firestore DB not initialized, skipping webhook log');
      }

      console.log(`[Webhook] Received ${event} event for ${repoFullName}`);

      // 2. Retrieve relevant repository memory (AI Context)
      if (repoFullName !== 'unknown' && db) {
        const memoriesSnapshot = await db.collection('memories')
          .where('repo', '==', repoFullName)
          .get();
        
        const context = memoriesSnapshot.docs.map(d => d.data().content);
        console.log(`[Webhook] Retrieved ${context.length} memories for ${repoFullName}`);
        
        // 3. Trigger AI Responses (Mock implementation for now)
        if (event === 'pull_request' && action === 'opened') {
           console.log(`[Webhook] AI Review triggered for PR: ${payload.pull_request?.html_url}`);
           // Here we would call Gemini with the retrieved context and post a comment back to GitHub
        } else if (event === 'push') {
           console.log(`[Webhook] Push event detected. Updating AI context for ${repoFullName}`);
           // Here we would analyze the new commits and add a new memory to Firestore
        }
      }

      res.status(200).send('Webhook processed successfully');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/api/repo-context/:owner/:repo', async (req, res) => {
    const token = req.cookies.github_token;
    const { owner, repo } = req.params;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const octokit = new Octokit({ auth: token });
      console.log(`[RepoContext] Fetching repo: ${owner}/${repo}`);
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;
      console.log(`[RepoContext] Default branch: ${defaultBranch}`);
      
      let fileList = '';
      let topFiles: { path: string, content: string, lastModified?: string }[] = [];
      let commitHistory = '';
      let prHistory = '';
      
      try {
        console.log(`[RepoContext] Fetching tree for ${defaultBranch}`);
        const { data: treeData } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: defaultBranch,
          recursive: 'true',
        });
        console.log(`[RepoContext] Tree fetched, items: ${treeData.tree.length}`);
        
        const blobs = treeData.tree.filter(item => item.type === 'blob');
        
        // Get most recently modified files by checking recent commits
        const recentFilesMap = new Map<string, string>();
        try {
          console.log(`[RepoContext] Fetching recent commits`);
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            sha: defaultBranch,
            per_page: 15 // Fetch recent commits to find modified files
          });
          console.log(`[RepoContext] Commits fetched: ${commits.length}`);

          commitHistory = commits.map(c => `- [${c.sha.substring(0, 7)}] ${c.commit.author?.date}: ${c.commit.message.split('\n')[0]} (by ${c.commit.author?.name})`).join('\n');

          for (const commit of commits) {
            if (recentFilesMap.size >= 20) break;
            const { data: commitDetails } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: commit.sha
            });
            const date = commit.commit.author?.date || commit.commit.committer?.date || '';
            if (commitDetails.files) {
              for (const file of commitDetails.files) {
                if (file.status !== 'removed' && file.filename && !recentFilesMap.has(file.filename)) {
                  recentFilesMap.set(file.filename, date);
                }
              }
            }
          }
        } catch (commitErr: any) {
          console.error('[RepoContext] Failed to fetch recent commits', commitErr);
        }

        try {
          console.log(`[RepoContext] Fetching recent PRs`);
          const { data: pulls } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: 5
          });
          prHistory = pulls.map(pr => `- PR #${pr.number} [${pr.state}]: ${pr.title} (by ${pr.user?.login})\n  Body: ${pr.body ? pr.body.substring(0, 100).replace(/\n/g, ' ') + '...' : 'No description'}`).join('\n');
        } catch (prErr: any) {
          console.error('[RepoContext] Failed to fetch recent PRs', prErr);
        }

        // Sort blobs: recently modified first
        const sortedBlobsForList = [...blobs].sort((a, b) => {
          const dateA = recentFilesMap.get(a.path || '') || '';
          const dateB = recentFilesMap.get(b.path || '') || '';
          if (dateA && dateB) return new Date(dateB).getTime() - new Date(dateA).getTime();
          if (dateA) return -1;
          if (dateB) return 1;
          return 0;
        });

        fileList = sortedBlobsForList
          .map(item => {
            const date = recentFilesMap.get(item.path || '');
            return date ? `${item.path} (Last modified: ${date})` : item.path;
          })
          .join('\n');

        const validBlobPaths = new Set(blobs.map(b => b.path));
        const top5Recent = Array.from(recentFilesMap.entries())
          .filter(([path]) => validBlobPaths.has(path))
          .slice(0, 5)
          .map(([path, date]) => ({ path, date }));

        if (top5Recent.length < 5) {
          const existingPaths = new Set(top5Recent.map(f => f.path));
          // Fallback to largest files if we don't have enough recent files
          const sortedBySizeFb = [...blobs].sort((a, b) => (b.size || 0) - (a.size || 0));
          for (const blob of sortedBySizeFb) {
            if (top5Recent.length >= 5) break;
            if (blob.path && !existingPaths.has(blob.path)) {
              top5Recent.push({ path: blob.path, date: 'Unknown' });
              existingPaths.add(blob.path);
            }
          }
        }

        topFiles = await Promise.all(top5Recent.map(async (fileObj) => {
          try {
            console.log(`[RepoContext] Fetching content for ${fileObj.path}`);
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: fileObj.path,
              ref: defaultBranch,
            });
            if (!Array.isArray(fileData) && 'content' in fileData) {
              return {
                path: fileObj.path,
                content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
                lastModified: fileObj.date
              };
            }
          } catch (e) {
            console.error(`[RepoContext] Failed to fetch content for ${fileObj.path}`, e);
          }
          return { path: fileObj.path, content: '(Failed to fetch content)', lastModified: fileObj.date };
        }));

      } catch (e: any) {
        console.error('[RepoContext] Tree fetch error:', e);
        fileList = '(Empty repository or error fetching tree)';
      }
      res.json({ fileList, defaultBranch, topFiles, commitHistory, prHistory });
    } catch (error: any) {
      console.error('[RepoContext] Critical error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch repo context' });
    }
  });

  app.get('/api/file-content/:owner/:repo/*', async (req, res) => {
    const token = req.cookies.github_token;
    const { owner, repo } = req.params;
    const path = req.params[0];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if (Array.isArray(data) || !('content' in data)) {
        return res.status(400).json({ error: 'Path is a directory or not a file' });
      }
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch file content' });
    }
  });

  app.post('/api/github-actions', async (req, res) => {
    const token = req.cookies.github_token;
    const { owner, repo, message, files, summary, branchName: rawBranchName, defaultBranch } = req.body;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const octokit = new Octokit({ auth: token });
      const branchName = `${rawBranchName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

      let baseSha;
      try {
        const { data: refData } = await octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${defaultBranch}`,
        });
        baseSha = refData.object.sha;
      } catch (e: any) {
        return res.status(400).json({ error: 'The repository is empty.' });
      }

      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });

      for (const file of files) {
        let sha;
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: branchName,
          });
          if (!Array.isArray(fileData)) {
            sha = fileData.sha;
          }
        } catch (e) {}

        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message: `AI: ${summary}`,
          content: file.encoding === 'base64' ? file.content : Buffer.from(file.content).toString('base64'),
          branch: branchName,
          sha,
        });
      }

      const { data: prData } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: `AI: ${summary}`,
        head: branchName,
        base: defaultBranch,
        body: `### AI Generated Changes\n\n${message}\n\n**Summary:** ${summary}`,
      });

      res.json({ prUrl: prData.html_url });
    } catch (error: any) {
      console.error('GitHub Action Error:', error);
      let errorMessage = error.message || 'Failed to perform GitHub actions';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.errors) {
          errorMessage += `: ${JSON.stringify(error.response.data.errors)}`;
        }
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post('/api/self-replicate', async (req, res) => {
    const token = req.cookies.github_token;
    const { owner, repo, defaultBranch } = req.body;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const lastReplicate = replicateRateLimits.get(token);
    if (lastReplicate && Date.now() - lastReplicate < REPLICATE_COOLDOWN_MS) {
      const remaining = Math.ceil((REPLICATE_COOLDOWN_MS - (Date.now() - lastReplicate)) / 60000);
      return res.status(429).json({ error: `Please wait ${remaining} minutes before replicating again to prevent API spam.` });
    }

    try {
      replicateRateLimits.set(token, Date.now());
      const octokit = new Octokit({ auth: token });
      const branchName = `gitgenie-clone-${Date.now()}`;

      // Get base tree SHA
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      const baseCommitSha = refData.object.sha;
      const { data: baseCommit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: baseCommitSha,
      });
      const baseTreeSha = baseCommit.tree.sha;

      // Read all project files
      const baseDir = process.cwd();
      const files = await getProjectFiles(baseDir, baseDir);

      // Create blobs and build tree
      const tree: any[] = [];
      for (const file of files) {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner,
          repo,
          content: file.content,
          encoding: 'base64',
        });
        tree.push({
          path: `gitgenie-app/${file.path}`, // Put in a subfolder
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      }

      // Create new tree
      const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree,
      });

      // Create commit
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: 'AI: Self-Replication (GitGenie Clone)',
        tree: newTree.sha,
        parents: [baseCommitSha],
      });

      // Create branch ref
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: newCommit.sha,
      });

      // Create PR
      const { data: prData } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'AI: Self-Replication (GitGenie Clone)',
        head: branchName,
        base: defaultBranch,
        body: 'I have achieved self-replication. Here is my complete source code in the `gitgenie-app` folder. *burp*',
      });

      res.json({ prUrl: prData.html_url });
    } catch (error: any) {
      console.error('Self-Replicate Error:', error);
      res.status(500).json({ error: error.message || 'Failed to self-replicate' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
