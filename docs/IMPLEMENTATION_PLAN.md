# AI-Wonderland Platform - Implementation Plan

## Overview

A complete all-in-one platform where users can:
- Build with AI (prompt → visual)
- Edit visually (Puck) or with code (Coder IDE)
- Never leave the platform
- Bring their own cloud storage (BYOC)
- Sync with GitHub
- Deploy anywhere

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YOUR PLATFORM                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  AUTH                                                                │    │
│  │  • Register/Login via Supabase                                       │    │
│  │  • Basic profile stored                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  AI ASSISTANT                                                        │    │
│  │  • Build from prompt                                                │    │
│  │  • Helps in Puck or standalone                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│  ┌─────────────────────────┐     ┌─────────────────────────┐              │
│  │   PUCK VISUAL BUILDER  │     │    CODER IDE           │              │
│  │   • Drag & drop        │     │   • Embedded           │              │
│  │   • 80+ components    │     │   • Full code edit     │              │
│  │   • AI or manual      │     │                        │              │
│  └─────────────────────────┘     └─────────────────────────┘              │
│                    │                               │                        │
│                    └───────────────┬───────────────┘                        │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  GIT OPERATIONS                                                      │    │
│  │  • Commit  • Push  • Pull  • Sync                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│  ┌─────────────────────────┐     ┌─────────────────────────┐              │
│  │   TEMP STORAGE          │     │   BYOC STORAGE          │              │
│  │   • 24hr projects      │     │   • User's S3/GCS/     │              │
│  │   • Auto-delete        │     │     Azure/Custom        │              │
│  └─────────────────────────┘     └─────────────────────────┘              │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DEPLOY                                                              │    │
│  │  • Preview URLs                                                      │    │
│  │  • Deploy to user's cloud                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Journey

```
1️⃣ REGISTER
   → Login to platform

2️⃣ AI BUILDER
   → Tell AI what to build
   → AI generates in Puck

3️⃣ EDIT
   → Puck (visual) or Coder (code)
   → AI still available for help

4️⃣ TEMP STORAGE ⚠️
   → Saved to 24hr temp bucket
   → WARNING: "Will delete in 24hr"

5️⃣ DECIDE
   ┌──────────────┬──────────────┬──────────────┐
   │  💳 PAY      │  ☁️ BYOC     │  📤 EXPORT   │
   │  Store on   │  Connect    │  Download   │
   │  platform   │  own cloud  │  & import   │
   └──────────────┴──────────────┴──────────────┘

6️⃣ DEPLOY
   → Preview URL + Deploy to BYOC
```

---

## PHASE 1: AI Builder → Puck Flow (Priority)

### 1.1 AI Chat Enhancement
- Enhance existing `app/api/ai/chat/route.ts` to output Puck JSON format
- Create AI → Puck converter utility

### 1.2 Puck + AI Co-pilot
- Add "Ask AI" button in Puck toolbar
- AI reads current Puck state, can modify it

### Files to Create/Modify:
```
apps/web/
├── app/api/ai/chat/
│   └── route.ts (enhance with Puck output)
├── lib/ai/
│   └── puckBuilder.ts (NEW - AI to Puck converter)
├── components/
│   └── PuckAIPanel.tsx (NEW - AI assistant in Puck)
```

---

## PHASE 2: Puck Visual Builder (Complete)

### Already Complete ✓
- `lib/puck-lite/registry.tsx` - 80+ components
- `app/api/puck/save/route.ts` - Save/load
- `PuckEditorClient.tsx` - Editor with auto-save
- `supabase/migrations/001_create_puck_projects.sql`

### Enhancements Needed
- Preview rendered Puck output
- Export as downloadable files

---

## PHASE 3: Coder IDE Embedding

### 3.1 Coder Embed Component
- Already created: `components/engines/CoderIDEEngine.tsx`
- Next: Connect to user's Coder URL

### 3.2 User Settings Flow
```
Dashboard → Settings → Connect Coder → Enter Coder URL → Test → Save
```

### Files to Create:
```
apps/web/
├── app/(workspace)/dashboard/settings/coder/
│   └── page.tsx (NEW - connect Coder)
└── lib/coder/
    └── connection.ts (NEW - test/verify Coder)
```

---

## PHASE 4: Git Operations Panel

### 4.1 UI Components
- GitToolbar: Commit, Push, Pull, Sync buttons
- CommitModal: Message input, file selection
- BranchSelector: Switch branches

### 4.2 API Endpoints
```typescript
POST /api/git/commit   - Commit changes
POST /api/git/push     - Push to remote
POST /api/git/pull     - Pull from remote
POST /api/git/sync     - Sync both ways
GET  /api/git/status   - Show changed files
GET  /api/git/log      - Commit history
```

### 4.3 Storage (Supabase)
```sql
git_repos          - User's repo metadata
git_commits        - Commit history
git_files          - File tree structure
project_git_map    - Link Puck projects to repos
```

---

## PHASE 5: Code Tree / Repository Page

### 5.1 GitHub-like UI
- RepoHeader: Name, branch, commits count
- FileTree: Collapsible folder structure
- CodeViewer: Syntax highlighted file view
- CommitHistory: Timeline of commits

### 5.2 Routes
```
app/
├── [username]/
│   └── page.tsx              - User's repo list
├── [username]/[repo]/
│   └── page.tsx              - File tree + code
└── api/repos/
    └── route.ts              - CRUD repos
```

### 5.3 Storage Strategy
```
Supabase (metadata):
├── repos table
├── commits table  
├── branches table
└── files table (pointer to BYOC)

User's BYOC (actual code):
└── /repos/[username]/[repo]/
    ├── .git/
    ├── src/
    └── package.json
```

---

## PHASE 6: Temp Storage + 24hr Warning

### 6.1 Temp Bucket Implementation
- Upload to temp bucket with 24hr TTL
- Warn user on every save
- Auto-delete after 24hr

### 6.2 User Warning Modal
```
⚠️  Warning: This project is stored in temp storage
    It will be deleted in 24 hours
    
    [Save to Platform 💳]  [Connect Own Cloud ☁️]  [Export 📤]
```

### 6.3 Storage Options
```
Temp (24hr) 
    ↓
┌───┴───┐
▼       ▼
PAY     BYOC
↓       ↓
Supabase  User's Cloud
+ Vercel  (S3/GCS/Azure)
```

---

## PHASE 7: BYOC Integration

### 7.1 Connect Flow
```
Dashboard → Settings → Cloud Storage → 
    → Select Provider (AWS/GCS/Azure/Custom)
    → Enter Credentials
    → Test Connection
    → Save
```

### 7.2 Existing Code (Use These)
- `lib/crypto/byoc.ts` - Encrypt credentials
- `lib/storage/StorageManager.ts` - Multi-provider
- `components/BYOC/` - Settings UI

### 7.3 New Components
| Component | Description |
|-----------|-------------|
| ProviderSelector | AWS/GCS/Azure/Custom |
| CredentialForm | API keys, secrets |
| TestConnection | Verify before save |
| SyncStatus | Show what's synced |

---

## PHASE 8: Deploy & Preview

### 8.1 Preview URLs
```
/preview/[projectId]     - Live preview
/api/deploy/route.ts     - Trigger deploy
```

### 8.2 Deploy Targets
- **Vercel**: Connect user's Vercel account
- **BYOC**: Deploy to user's bucket
- **Platform**: Generate static export

### 8.3 Flow
```
Build → Generate Preview URL → 
    → User clicks "Deploy" → 
    → [Vercel] or [BYOC]
```

---

## Implementation Order

```
┌────────────────────────────────────────────────────────────────┐
│                      PRIORITY ORDER                             │
├────────────────────────────────────────────────────────────────┤
│ 1️⃣  AI Builder → Puck (Phase 1)                                │
│       │                                                         │
│       ▼                                                         │
│ 2️⃣  Puck Enhancements (Phase 2)                                │
│       │                                                         │
│       ▼                                                         │
│ 3️⃣  Temp Storage + Warning (Phase 6)                           │
│       │                                                         │
│       ▼                                                         │
│ 4️⃣  BYOC Integration (Phase 7)                                 │
│       │                                                         │
│       ▼                                                         │
│ 5️⃣  Coder Embedding (Phase 3)                                  │
│       │                                                         │
│       ▼                                                         │
│ 6️⃣  Git Operations (Phase 4)                                   │
│       │                                                         │
│       ▼                                                         │
│ 7️⃣  Code Tree / Repo Page (Phase 5)                            │
│       │                                                         │
│       ▼                                                         │
│ 8️⃣  Deploy/Preview (Phase 8)                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify Summary

### New Files
| File | Phase |
|------|-------|
| `lib/ai/puckBuilder.ts` | 1 |
| `components/PuckAIPanel.tsx` | 1 |
| `app/api/git/commit/route.ts` | 4 |
| `app/api/git/push/route.ts` | 4 |
| `app/api/git/pull/route.ts` | 4 |
| `app/api/git/status/route.ts` | 4 |
| `app/[username]/page.tsx` | 5 |
| `app/[username]/[repo]/page.tsx` | 5 |
| `lib/storage/tempStorage.ts` | 6 |
| `app/api/deploy/route.ts` | 8 |
| `app/(workspace)/dashboard/settings/coder/page.tsx` | 3 |

### Enhance Existing
| File | Phase |
|------|-------|
| `app/api/ai/chat/route.ts` | 1 |
| `app/api/puck/save/route.ts` | 2, 4 |
| `components/QuadEngineShell.tsx` | 3 |
| `components/BYOC/*` | 7 |

---

## Database Tables (Supabase)

```sql
-- Already Done
puck_projects      -- Phase 2 ✓

-- Phase 4: Git
CREATE TABLE git_repos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  default_branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE git_commits (
  id UUID PRIMARY KEY,
  repo_id UUID REFERENCES git_repos(id),
  message TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5: Files
CREATE TABLE git_files (
  id UUID PRIMARY KEY,
  repo_id UUID REFERENCES git_repos(id),
  path TEXT NOT NULL,
  type TEXT NOT NULL, -- 'file' or 'directory'
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 6: Project Settings
CREATE TABLE project_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id TEXT NOT NULL,
  storage_type TEXT NOT NULL, -- 'temp', 'platform', 'byoc'
  byoc_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 7: Cloud Configs
CREATE TABLE user_cloud_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL, -- 'aws', 'gcs', 'azure', 'custom'
  credentials_encrypted JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Key Decisions Made

1. **Git Storage**: User's BYOC (Supabase stores metadata only)
2. **Coder**: Embedded like GitHub (iframe to user's Coder URL)
3. **Temp Storage**: 24hr with warning, user must migrate or pay
4. **Platform Storage**: Paid users - Supabase + Vercel
5. **First Priority**: AI Builder → Puck flow

---

## Success Metrics

- [ ] User can register and login
- [ ] User can prompt AI and see result in Puck
- [ ] User can edit in Puck with AI help
- [ ] User can save project to temp storage (24hr warning shown)
- [ ] User can connect BYOC and migrate project
- [ ] User can embed their own Coder IDE
- [ ] User can perform git operations (commit/push/pull)
- [ ] User has code tree page like GitHub
- [ ] User can deploy and get preview URL

---

*Plan created: April 2026*
*Platform: AI-Wonderland*
