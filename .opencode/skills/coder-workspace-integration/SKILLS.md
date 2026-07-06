---
name: coder-workspace-integration
description: Wires DreamMakerHub's "Create Workspace" button to the Coder API on the Civo Kubernetes cluster. Use when working on Coder workspace creation/deletion, Civo cluster config, CODER_URL/token env vars, or the node-ide/python-ide/wonderspace-ide templates.
---

# Coder Workspace Integration

## Environment

- Civo Kubernetes cluster: `young-snowflake-38422065`
- Coder instance URL: `https://212.2.240.19.nip.io`
- Templates already pushed: `node-ide`, `python-ide`, `wonderspace-ide`
- DreamMakerHub Next.js app lives in Railway project `lucid-integrity`
- Env vars on Railway must point at the Civo Coder URL (not any old/local value) before the UI button can call the API

## Goal

Wire the "Create Workspace" button in DreamMakerHub's UI to call the Coder REST API
programmatically, so a user click provisions a real workspace pod on Civo using one
of the existing templates.

## Coder API basics

- Coder exposes a REST API at `<CODER_URL>/api/v2`
- Auth via session token in header: `Coder-Session-Token: <token>`
- Creating a workspace: `POST /api/v2/users/{user}/workspaces` with `template_id` and `name`
- Listing templates: `GET /api/v2/organizations/{org}/templates`
- Always confirm exact request/response shape against the live Coder instance or its
  OpenAPI spec before hardcoding payloads — don't guess field names.

## Required env vars (Railway, `lucid-integrity`)

- `CODER_URL` → `https://212.2.240.19.nip.io`
- `CODER_API_TOKEN` → service/admin token (sealed in Railway Shared Variables)
- `CODER_DEFAULT_TEMPLATE` → e.g. `wonderspace-ide`

## Implementation notes

- Server-side only: never expose `CODER_API_TOKEN` to the browser. Route the button
  through a Next.js API route / server action that calls Coder and returns just the
  workspace URL/status to the client.
- Handle the async nature of workspace creation — Coder returns a build job, not an
  instantly-ready workspace. Poll build status or stream it before redirecting the user in.
- Surface Coder API errors (auth, quota, template not found) as readable UI states,
  not raw JSON.

## Constraints

- Additive-only: do not modify or remove existing working code/routes elsewhere in
  the app while wiring this in.
- Don't touch Supabase/Mem0/Turso pieces — this skill is scoped to Coder + Civo only.

## When unsure

If the Coder API shape for an endpoint isn't confirmed above, check the live instance's
`/api/v2/swagger` (or current Coder docs) rather than guessing — Coder's API has changed
across versions and a wrong payload shape just 400s.
