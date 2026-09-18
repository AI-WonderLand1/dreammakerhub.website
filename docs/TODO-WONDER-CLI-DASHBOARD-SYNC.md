# TODO: Wonder CLI + local Git + dashboard file-manager sync

**Status:** Deferred. This is a plan, not implemented or deployed functionality.

**Goal:** Users operate `wonder` on their *own computers*, authorize their DreamMakerHub account, link a local folder to *their* dashboard project, optionally clone/push Git repositories using *their local SSH key or PAT*, and explicitly sync local files into the dashboard file manager. Do not make using the cloud Coder IDE or entering private Git credentials on the website a prerequisite.

## Proposed CLI experience (not yet working)

```bash
wonder login                   # Browser approval for this device and DreamMakerHub account
wonder whoami
wonder link                    # Select or create an owned dashboard project
wonder sync --dry-run          # Preview local -> dashboard file changes
wonder sync                    # Explicitly upload approved changes to that project
wonder clone OWNER/REPO        # Local Git clone
wonder remote list
wonder remote add origin URL
wonder config auth ssh         # Choose local SSH key / SSH agent
wonder config auth pat         # Secure masked local PAT prompt
wonder push [REPO_NAME]        # Review remote and branch, then explicitly push
wonder unlink
wonder logout
```

`wonder sync` updates the DreamMakerHub dashboard file manager. `wonder push` updates a Git remote. **Never silently trigger one from the other.** The existing `packages/aiw-cli` currently exposes `aiw`; extend it with a compatible `wonder` alias instead of creating an unrelated CLI.

## Implementation checklist

### 1. Inspect existing pieces

- [ ] Audit `packages/aiw-cli`, dashboard project and file APIs, project ownership checks, and the real file storage schema before changing anything.
- [ ] Define the mapping between a local folder, an immutable dashboard project ID, an optional Git remote, and an optional Coder workspace. Do not match by project name alone.
- [ ] Audit old `/api/github` and `wonder-sync` routes. Do **not** reuse Git operations that run in the website server's repository as if they were the user's local Git repo.

### 2. User pairing and project selection

- [ ] Implement `wonder login` with short-lived device/browser approval by the currently signed-in DreamMakerHub user; support deny, expiry, logout, and revocation.
- [ ] Store narrowly scoped CLI session credentials securely on the local machine, separately from GitHub credentials. Never put tokens in Git, `.wonder` project metadata, URLs, command arguments, client analytics, or logs.
- [ ] `wonder link` lists only projects the authenticated user owns or is explicitly authorized to access, lets them select/create one, and records its non-secret project ID locally.
- [ ] Provide linked device/project status and revoke/unlink controls in the user's dashboard.

### 3. Local Git commands and auth

- [ ] Implement `wonder clone`, `wonder remote`, `wonder config auth ssh|pat`, and `wonder push` against the **local** repository and its actual branch.
- [ ] SSH uses the user's locally stored private key or SSH agent; do not upload private keys to DreamMakerHub or shared pods. PAT mode uses a masked prompt and OS credential helper, ideally a fine-grained PAT with limited repository access.
- [ ] Validate remote URLs, show destination repo/branch and pending commits before push, and require explicit confirmation. Respect protected branches and non-fast-forward failures; never force-push or auto-commit without a specific request.
- [ ] Handle missing credentials, wrong account/repo permission, detached HEAD, missing upstream, and expired PAT safely without leaking secrets.

### 4. Dashboard file-manager sync

- [ ] Add `wonder sync --dry-run` and explicit upload to authenticated, project-scoped APIs. Recheck ownership on every server operation; never trust a caller-supplied user ID.
- [ ] Sync file changes with a versioned manifest/checksums, handle conflicts, and ask before overwriting or deleting remote files. Keep both copies recoverable if interrupted.
- [ ] Honor `.gitignore` and exclude `.env*`, `.git`, private keys, `.ssh`, PATs, `node_modules`, and other secrets by default; preview included files. Block traversal and symlinks escaping the selected directory.
- [ ] The existing dashboard file storage is text-oriented. Add appropriate private object-storage handling, integrity checks, limits, and progress for binary assets (images/video/3D) rather than converting them to text.
- [ ] Refresh the project's file manager after sync and show source, last sync, and conflicts. Add dashboard-to-local retrieval later with the same conflict checks; do not claim automatic two-way sync before implementing it.

### 5. Verify before shipping

- [ ] Test account isolation across two users and devices; no cross-user file, project, or credential access.
- [ ] Test public/private Git clone and push with both local SSH and PAT, including revoked credentials and protected branches.
- [ ] Test nested folders, README display, binary integrity, secret exclusions, conflict/deletion previews, interrupted uploads, and no accidental Git push on dashboard sync.
- [ ] Preserve existing `aiw` commands, run CI and security review, then verify an end-to-end local CLI login, project link, and dashboard file refresh before deployment.

**Do later:** No CLI commands, auth endpoints, database changes, Coder template updates, or production deployment are made by this TODO alone.
