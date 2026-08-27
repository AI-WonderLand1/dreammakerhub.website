# CMS Engine & Dashboard Plan

## Overview

Replace external WordPress publishing with a built-in CMS engine. Add a proper file manager to the dashboard. Wire save/export/import to the new system.

---

## Phase 1: Remove External WordPress

### Files to Change

| File | Action |
|------|--------|
| `app/(builder)/wonder-build/components/PublishModal.tsx` | Remove WP URL/API key fields. Keep HTML export. Add "Publish to Site" option. |
| `app/api/projects/publish/route.ts` | Remove WordPress POST handler. Keep HTML export. Add new handler to save to `pages` table. |
| `lib/marketplace/client.ts` | Remove WordPress SEO and Puck CLI extensions. |
| `packages/aiw-cli/src/commands/wordpress.ts` | Delete or gate behind optional flag. |
| `config/ai/policy.json` | Remove `puck_blocks` from `build_scope`. |

### What Users See

**Before:**
```
PublishModal → "WordPress Site URL" + "API Key" → Publish to external WP
```

**After:**
```
PublishModal → "Page Title" + "Slug" → Publish to yoursite.com/{slug}
                 └── also has "Export HTML" button
```

---

## Phase 2: Publish to Own CMS

### Database: `pages` Table (Already Exists)

```sql
-- Already in prisma/schema.prisma
CREATE TABLE pages (
  id              TEXT PRIMARY KEY,
  user_id         TEXT,
  title           TEXT,
  slug            TEXT UNIQUE,
  body_html       TEXT,
  cover_image_url TEXT,
  content         JSONB,        -- CanvasElement[] from WonderBuild
  published       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### New API Route: `app/api/pages/publish/route.ts`

```
POST /api/pages/publish
Body: {
  title: string,
  slug: string,           // auto-generated from title if empty
  content: CanvasElement[],  // from WonderBuild store
  body_html: string,        // generated HTML from CodeGenerationService
  cover_image_url?: string
}

Logic:
  1. Authenticate user
  2. Generate slug from title (slugify, check uniqueness)
  3. UPSERT into pages table
  4. Set published: true
  5. Return { url: /{slug} }
```

### Connect WonderBuild Publish Button

```
PublishModal.tsx
  → onClick: gather elements from Zustand store
  → generate HTML via CodeGenerationService
  → POST /api/pages/publish
  → show success with public URL
```

---

## Phase 3: Public Page Rendering

### New Route: `app/(public)/[slug]/page.tsx`

```
app/(public)/[slug]/
  ├── page.tsx           # Server component, reads from pages table
  ├── layout.tsx         # Public layout with navbar
  └── opengraph-image.tsx # Auto-generate OG image
```

### page.tsx

```tsx
import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/cms';

export async function generateMetadata({ params }) {
  const page = await getPageBySlug(params.slug);
  if (!page) return {};
  return {
    title: page.title,
    openGraph: { title: page.title, images: [page.cover_image_url] },
  };
}

export default async function PublicPage({ params }) {
  const page = await getPageBySlug(params.slug);
  if (!page || !page.published) notFound();

  return (
    <article>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.body_html }} />
    </article>
  );
}
```

### generateStaticParams (Build-Time)

```tsx
export async function generateStaticParams() {
  const pages = await getPublishedSlugs();
  return pages.map(({ slug }) => ({ slug }));
}
```

### New Lib: `lib/cms.ts`

```tsx
import { db } from '@/lib/db';

export async function getPageBySlug(slug: string) {
  const { rows } = await db.query(
    'SELECT * FROM pages WHERE slug = $1 AND published = true',
    [slug]
  );
  return rows[0] || null;
}

export async function getPublishedSlugs() {
  const { rows } = await db.query(
    'SELECT slug FROM pages WHERE published = true'
  );
  return rows;
}

export async function listUserPages(userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM pages WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return rows;
}
```

---

## Phase 4: Dashboard File Manager

### New Pages

| Route | Purpose |
|-------|---------|
| `/dashboard/projects` | Project list (already exists) |
| `/dashboard/projects/[id]/files` | **NEW** — File tree + code editor |
| `/dashboard/projects/[id]/pages` | **NEW** — Published pages list |

### File Tree Panel Component

```
components/file-manager/
  ├── FileTree.tsx          # Recursive folder/file tree
  ├── FileTreeNode.tsx      # Single node (file or folder)
  ├── CodeEditor.tsx        # Monaco editor wrapper
  ├── FileManagerToolbar.tsx # New file, New folder, Delete, Rename
  └── BreadcrumbBar.tsx     # Current path breadcrumb
```

### FileTree.tsx

```tsx
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

function FileTree({ files, onSelect, selectedPath }) {
  // Group files by folder
  // Render recursive tree
  // Click file → open in CodeEditor
  // Click folder → expand/collapse
}
```

### CodeEditor.tsx

```tsx
import Monaco from '@monaco-editor/react';

function CodeEditor({ file, content, onSave }) {
  return (
    <Monaco
      language={getLanguage(file.path)}
      value={content}
      onChange={(val) => onSave(file.path, val)}
      options={{ minimap: false, fontSize: 14 }}
    />
  );
}
```

### File Manager API Additions

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/projects/[id]/files` | GET | List all files (already exists) |
| `/api/projects/[id]/files` | POST | Write files (already exists) |
| `/api/projects/[id]/files` | DELETE | Delete file (already exists) |
| `/api/projects/[id]/files/mkdir` | POST | **NEW** — Create folder |
| `/api/projects/[id]/files/rename` | POST | **NEW** — Rename file/folder |
| `/api/projects/[id]/files/move` | POST | **NEW** — Move file/folder |

### New Storage Functions (lib/projects/storage.ts)

```tsx
export async function createFolder(projectId: string, ownerId: string, folderPath: string) {
  // Create a .gitkeep or placeholder file in the folder
  await writeFile(projectId, ownerId, `${folderPath}/.gitkeep`, '');
}

export async function renamePath(projectId: string, ownerId: string, oldPath: string, newPath: string) {
  // Read all files with oldPath prefix
  // Write to new paths
  // Delete old paths
}

export async function movePath(projectId: string, ownerId: string, oldPath: string, newDir: string) {
  // Same as rename but changes directory
}
```

---

## Phase 5: Export & Import

### Export

**From PublishModal:**
```
Export HTML → downloads {project-name}.html (self-contained with Tailwind CDN)
Export JSON → downloads {project-name}.json (CanvasElement[] array)
```

**From File Manager:**
```
Export Project → downloads {project-name}.zip (all files from _project_files)
```

### New API: `/api/projects/[id]/export`

```
GET /api/projects/[id]/export?format=html|json|zip

format=html → returns generated HTML (already exists in publish route)
format=json → returns CanvasElement[] as JSON
format=zip  → creates zip from all files in _project_files
```

### Import

**From Dashboard:**
```
Import HTML → parses HTML → creates CanvasElement[] → opens in builder
Import JSON → loads CanvasElement[] directly → opens in builder
Import ZIP  → extracts files → writes to _project_files → opens in file manager
```

**From File Manager:**
```
Import File → upload single file → write to current directory
Import Folder → upload multiple files → write to current directory
```

### New API: `/api/projects/[id]/import`

```
POST /api/projects/[id]/import
Body: { format: 'html' | 'json' | 'zip', data: string | File }

Logic:
  html → parse via html-parser.ts → save as CanvasElement[] to _project_files
  json → validate CanvasElement[] → save to _project_files
  zip  → extract → write each file to _project_files
```

### Import Components

```
components/file-manager/
  ├── ImportModal.tsx      # Drag-drop zone for HTML/JSON/ZIP
  └── ImportButton.tsx     # Toolbar button that opens ImportModal
```

---

## Phase 6: Page Management in Dashboard

### New Page: `/dashboard/projects/[id]/pages`

```
┌─────────────────────────────────────────────┐
│  Published Pages                            │
├─────────────────────────────────────────────┤
│  Title       | Slug        | Status | Actions|
│  ───────────────────────────────────────────│
│  My Blog     | /my-blog    | Live   | Edit  |
│  About Us    | /about      | Draft  | Edit  │
│  Pricing     | /pricing    | Live   | Edit  │
│                                      + New  │
└─────────────────────────────────────────────┘
```

### Actions

- **Edit** → Opens WonderBuild with that page's CanvasElement[] loaded
- **Toggle Publish** → Sets `published: true/false`
- **Delete** → Removes from `pages` table
- **View** → Opens `/{slug}` in new tab
- **New** → Opens empty WonderBuild editor

---

## File Structure After Implementation

```
apps/web/
├── app/
│   ├── (public)/
│   │   ├── [slug]/
│   │   │   └── page.tsx              # Public page renderer
│   │   ├── blog/page.tsx
│   │   ├── about/page.tsx
│   │   └── ...
│   ├── (workspace)/dashboard/
│   │   ├── projects/
│   │   │   ├── page.tsx              # Project list (exists)
│   │   │   └── [id]/
│   │   │       ├── files/page.tsx    # NEW: File manager
│   │   │       └── pages/page.tsx    # NEW: Page management
│   │   └── ...
│   └── api/
│       ├── pages/
│       │   ├── route.ts              # Exists: CRUD
│       │   ├── [id]/route.ts         # Exists: GET/PUT/DELETE
│       │   └── publish/route.ts      # NEW: Publish to CMS
│       └── projects/[id]/
│           ├── files/route.ts        # Exists: GET/POST/DELETE
│           ├── files/mkdir/route.ts  # NEW
│           ├── files/rename/route.ts # NEW
│           ├── export/route.ts       # NEW
│           └── import/route.ts       # NEW
├── components/
│   └── file-manager/
│       ├── FileTree.tsx              # NEW
│       ├── FileTreeNode.tsx          # NEW
│       ├── CodeEditor.tsx            # NEW
│       ├── FileManagerToolbar.tsx    # NEW
│       ├── BreadcrumbBar.tsx         # NEW
│       ├── ImportModal.tsx           # NEW
│       └── ImportButton.tsx          # NEW
├── lib/
│   ├── cms.ts                        # NEW: Page queries
│   ├── projects/storage.ts           # MODIFY: Add mkdir/rename/move
│   └── builder/
│       ├── services/
│       │   └── CodeGenerationService.ts  # MODIFY: Output for publish
│       └── components/
│           └── ImportExportPanel.tsx  # MODIFY: Add ZIP support
└── PLAN-cms-engine.md                # THIS FILE
```

---

## Implementation Order

| Step | What | Est. Time |
|------|------|-----------|
| 1 | Remove WordPress from PublishModal + API | 30 min |
| 2 | Create `/api/pages/publish` route | 30 min |
| 3 | Create `lib/cms.ts` helpers | 20 min |
| 4 | Create `app/(public)/[slug]/page.tsx` | 45 min |
| 5 | Connect WonderBuild publish button to new route | 30 min |
| 6 | Add `mkdir`, `rename`, `move` to storage.ts + API | 1 hr |
| 7 | Build FileTree + CodeEditor components | 2 hr |
| 8 | Build `/dashboard/projects/[id]/files` page | 1.5 hr |
| 9 | Build export (ZIP) endpoint + import modal | 1.5 hr |
| 10 | Build `/dashboard/projects/[id]/pages` page | 1 hr |
| 11 | Cleanup: remove WP references from CLI, marketplace, etc. | 30 min |

**Total: ~9 hours of work**

---

## Data Flow Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  WonderBuild │     │   Dashboard  │     │   Public     │
│  Visual Editor│    │   File Mgr   │     │   Site       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ Ctrl+S             │ Browse/Edit        │ Visit /{slug}
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
│  _project_files          pages                          │
│  (source files)          (published content)            │
│                                                         │
│  id, file_path, content  id, slug, title, body_html,   │
│                          content (JSON), published      │
└─────────────────────────────────────────────────────────┘
       │                    │
       │ Publish            │ Render
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│ pages table  │ ←── │ [slug] route │
│ (CMS)        │     │ (Server)     │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Browser     │
                     │  yoursite.com│
                     │  /my-page    │
                     └──────────────┘
```
