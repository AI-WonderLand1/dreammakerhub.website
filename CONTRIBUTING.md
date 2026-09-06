# Contributing to DreamMakerHub.website

Thank you for your interest in contributing to **DreamMakerHub.website**, a project by **AI WONDERLAND INNOVATION**.

DreamMakerHub.website is an AI-powered website and application creation platform focused on combining AI-assisted development, drag-and-drop editing, cloud development environments, 3D/spatial tools, and developer infrastructure into one platform.

Contributions are welcome from developers, designers, AI engineers, prompt engineers, testers, security researchers, technical writers, and contributors interested in building next-generation creative development tools.

---

## Project Overview

DreamMakerHub.website is built around several major systems, including:

* AI-assisted website and application generation
* Visual drag-and-drop website builder
* Multi-page website editing
* Template creation and editing
* AI chat and agent workflows
* AI provider integrations
* BYOK / Bring Your Own Key support
* User projects and workspaces
* Cloud development environments
* Browser-based development tools
* 3D and spatial development tools
* API integrations
* Authentication
* Secrets management
* Deployment infrastructure

The platform is actively under development.

Some areas may still contain experimental features, unfinished functionality, placeholders, or systems being migrated to newer architecture.

---

# Technology Stack

The main DreamMakerHub.website application currently uses technologies including:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Puck
* Supabase
* OpenRouter
* WebGL
* PlayCanvas
* REST APIs
* Kubernetes-related infrastructure
* Cloud development environments

Individual parts of the project may use additional technologies.

Before adding a new library or framework, check whether the repository already includes a system that provides the required functionality.

---

# Repository

Main repository:

```text
AI-WonderLand1/dreammakerhub.website
```

When contributing, make sure you are working on the correct repository and branch.

---

# Before You Start

Before making major changes:

1. Review the existing code.
2. Search existing GitHub Issues.
3. Search existing Pull Requests.
4. Determine whether the requested feature already exists.
5. Determine whether an existing API, store, component, or service should be extended.
6. Avoid creating duplicate systems.

This is especially important because DreamMakerHub.website contains multiple interconnected systems.

Do not create a second implementation of an existing feature simply because the existing implementation is difficult to locate.

---

# Important Architecture Rule

## Do Not Rebuild Existing Systems

Contributors should preserve the existing architecture whenever possible.

Before creating a new:

* state store
* authentication system
* database table
* API
* project system
* page system
* AI provider interface
* secrets system
* editor
* file manager
* template manager
* deployment system

first verify whether one already exists.

Extend existing systems instead of duplicating them.

Large architectural rewrites should be discussed before implementation.

---

# WonderBuild / Website Builder

The DreamMakerHub website builder is a major part of the platform.

When working on the builder:

* Preserve existing project persistence.
* Preserve existing page persistence.
* Preserve undo/redo behavior.
* Preserve element synchronization.
* Preserve saved project compatibility whenever possible.
* Avoid creating duplicate builder state.
* Avoid creating parallel page-management systems.
* Avoid replacing working editor infrastructure without a clear reason.

Existing state-management systems should be used instead of creating independent alternatives.

Changes to the builder should be tested carefully because they may affect saved user projects.

---

# Multi-Page Editing

DreamMakerHub supports multi-page website projects.

When modifying page functionality:

* Use the existing page state.
* Do not create duplicate page APIs.
* Do not create duplicate page database tables without a migration plan.
* Preserve the active page.
* Preserve saved page elements.
* Ensure switching pages does not overwrite another page.
* Ensure history remains isolated where required.

Test creating, renaming, switching, saving, and reloading pages before submitting changes.

---

# AI Features

DreamMakerHub integrates AI throughout the platform.

AI features may include:

* AI website generation
* AI editing
* AI chat
* AI assistants
* AI agents
* AI coding assistance
* AI prompt workflows
* AI provider routing
* AI-generated components
* AI-generated assets

When working on AI features:

* Never hardcode API keys.
* Handle provider failures gracefully.
* Validate API responses.
* Handle malformed AI output.
* Do not assume model output is always valid.
* Add fallback behavior when reasonable.
* Avoid exposing provider credentials to the browser.

AI responses must be treated as untrusted external input.

---

# BYOK — Bring Your Own Key

DreamMakerHub may allow users to provide their own API credentials.

BYOK integrations must be designed carefully.

User-provided keys must:

* Never be committed to Git.
* Never appear in application logs.
* Never be returned unnecessarily from APIs.
* Never be exposed in client-side JavaScript unless explicitly required by the provider.
* Never be stored in plaintext without an approved security design.

Where possible, API requests requiring secret keys should be handled server-side.

Examples of supported or future providers may include:

* OpenRouter
* OpenAI-compatible providers
* Gemini
* Hugging Face
* Other AI providers

Provider integrations should remain modular whenever possible.

---

# Secrets and Environment Variables

Never commit real credentials.

Do not commit:

```text
.env
.env.local
.env.production
.env.development.local
```

Never commit:

```text
API keys
database passwords
Supabase service-role keys
cloud provider credentials
access tokens
refresh tokens
SSH private keys
JWT secrets
OAuth secrets
webhook secrets
encryption keys
private certificates
```

Safe environment-variable templates may be added using:

```text
.env.example
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENROUTER_API_KEY=
```

Never place real secret values in example files.

---

# Supabase

DreamMakerHub uses Supabase for parts of the platform.

When making Supabase changes:

* Preserve Row Level Security where applicable.
* Never expose the service-role key to the browser.
* Review RLS policies when adding tables.
* Validate authenticated users before performing privileged operations.
* Avoid unrestricted database queries.
* Add database migrations for schema changes when appropriate.

Any new table containing user-owned data should have proper authorization rules.

---

# API Routes

DreamMakerHub contains many API routes.

When creating or modifying an API endpoint:

* Validate all external input.
* Authenticate users when required.
* Verify authorization.
* Return appropriate HTTP status codes.
* Handle unexpected errors.
* Avoid exposing stack traces in production.
* Avoid leaking credentials.
* Apply rate limiting where appropriate.
* Sanitize user-controlled content.
* Validate external URLs before server-side requests.

APIs should never trust data simply because it came from the frontend.

---

# Security

Security-sensitive code requires extra review.

Examples include:

* Authentication
* Authorization
* API keys
* Secrets
* File uploads
* Database access
* Remote command execution
* SSH
* Cloud infrastructure
* AI agents with tools
* Webhooks
* GitHub integrations
* Deployment systems

Always consider:

```text
Who is making this request?
What are they allowed to access?
Can they access another user's resources?
Can this input execute code?
Can this expose a secret?
Can this request access internal infrastructure?
```

---

# Security Vulnerabilities

Do not publicly disclose serious vulnerabilities before they can be addressed.

Examples include:

* Authentication bypass
* Authorization bypass
* Exposed API keys
* Remote code execution
* Command injection
* SQL injection
* Cross-site scripting
* Server-side request forgery
* Privilege escalation
* Secrets leakage
* Broken access control
* Unsafe file uploads

When available, use GitHub's private vulnerability reporting system:

```text
Repository
→ Security
→ Advisories
→ Report a vulnerability
```

Do not include real production credentials in proof-of-concept reports.

---

# AI-Generated Code

AI-assisted coding is allowed.

Contributors may use tools such as:

* ChatGPT
* GitHub Copilot
* Claude
* Gemini
* Cursor
* Codex
* AI coding agents
* Local language models

However, contributors are responsible for everything they submit.

Before submitting AI-generated code, verify that it does not contain:

* Hallucinated APIs
* Fake libraries
* Incorrect package names
* Broken imports
* Duplicate architecture
* Security vulnerabilities
* Exposed credentials
* Incorrect database access
* Unsafe shell commands
* Fake environment variables
* Dead code
* Unnecessary dependencies

Do not merge code simply because an AI generated it.

Read it, understand it, and test it.

---

# Branch Naming

Use descriptive branch names.

Recommended examples:

```text
feature/builder-pages-panel
feature/byok-settings
feature/template-preview
feature/ai-provider-selector

fix/builder-save
fix/project-routing
fix/mobile-layout
fix/auth-redirect

security/api-rate-limit
security/input-validation

docs/update-contributing
docs/builder-documentation

refactor/project-store
refactor/ai-provider-layer
```

Avoid vague branch names such as:

```text
fix
new
test
stuff
changes
branch
```

---

# Commit Messages

Use clear commit messages.

Recommended format:

```text
feat: add BYOK settings panel

fix: preserve builder page state

fix: handle failed OpenRouter request

security: validate API input

security: add rate limiting

docs: update builder documentation

refactor: simplify project state

test: add builder persistence tests
```

Recommended prefixes:

```text
feat:
fix:
docs:
security:
refactor:
test:
chore:
build:
ci:
perf:
style:
```

---

# Pull Requests

Keep Pull Requests focused.

Avoid combining unrelated features into a single PR.

A Pull Request should explain:

```markdown
## Summary

What changed?

## Reason

Why was this change needed?

## Changes

- Change 1
- Change 2
- Change 3

## Testing

Explain how the change was tested.

## Screenshots

Include screenshots for UI changes.

## Breaking Changes

List any breaking changes.

## Environment Variables

List any new environment variables.

## Security Impact

Explain any authentication, authorization, secrets, API, database, or infrastructure implications.
```

---

# UI and UX Contributions

DreamMakerHub is intended to feel like a modern professional creation platform.

Avoid adding generic placeholder-style UI when a polished interface is appropriate.

UI contributions should:

* Match the existing DreamMakerHub design language.
* Feel intentional and professional.
* Work on desktop.
* Remain usable on smaller screens.
* Provide loading states.
* Provide empty states.
* Provide useful error states.
* Include hover and focus states where appropriate.
* Avoid buttons that do nothing.
* Avoid unfinished placeholder cards.
* Avoid excessive visual clutter.

Visible UI changes should include screenshots whenever possible.

---

# Template Library

When working on templates:

* Templates should be visually distinct.
* Templates should provide useful real layouts.
* Avoid multiple templates that are only minor color variations.
* Avoid blank placeholder sections.
* Ensure template previews accurately represent the actual template.
* Ensure templates can be opened in the editor.
* Ensure generated content remains editable.

Templates should demonstrate the quality of the platform.

---

# Routing

Before creating new pages or routes:

1. Search existing routes.
2. Determine whether the destination already exists.
3. Verify navigation links.
4. Test authentication requirements.
5. Verify redirects.
6. Verify browser refresh behavior.

Do not add duplicate routes for the same product feature unless required.

---

# Cloud Development Features

DreamMakerHub may integrate browser development environments and cloud infrastructure.

Changes to these systems require careful review.

Never:

* expose cloud credentials
* expose SSH private keys
* allow arbitrary cross-user workspace access
* trust user-provided shell commands without considering isolation
* allow one user's environment to access another user's environment

User environments should remain isolated.

---

# Kubernetes and Container Features

When modifying container or Kubernetes-related functionality:

* Preserve tenant isolation.
* Avoid privileged containers unless absolutely necessary.
* Apply resource limits where appropriate.
* Avoid mounting sensitive host paths.
* Validate environment variables.
* Avoid embedding cloud credentials into images.
* Use secrets management for production credentials.

Infrastructure changes should be documented clearly.

---

# 3D and Spatial Features

DreamMakerHub includes 3D and spatial tooling.

When modifying 3D systems:

* Avoid blocking the main UI thread unnecessarily.
* Optimize large assets.
* Handle loading failures.
* Clean up WebGL resources.
* Avoid unnecessary scene reinitialization.
* Test asset loading.
* Test browser compatibility.
* Provide fallback behavior when appropriate.

Do not replace existing spatial systems without reviewing how they integrate with the rest of the platform.

---

# Dependencies

Before adding a new npm dependency:

1. Check whether the project already includes equivalent functionality.
2. Verify the package is actively maintained.
3. Check its license.
4. Review known security issues.
5. Consider bundle-size impact.

Avoid adding a dependency for trivial functionality.

Do not run automatic breaking upgrades without reviewing the resulting changes.

---

# Testing

Before opening a Pull Request, run the applicable checks.

Common commands may include:

```bash
npm install
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

The exact commands may differ depending on the current repository configuration.

At minimum, verify that your change does not break the production build.

---

# Builder Testing Checklist

Changes affecting the visual builder should test:

* [ ] Builder opens
* [ ] Existing project loads
* [ ] Elements render
* [ ] Elements can be edited
* [ ] Drag and drop works
* [ ] Save works
* [ ] Reload preserves changes
* [ ] Undo works
* [ ] Redo works
* [ ] Page switching works
* [ ] Page content remains isolated
* [ ] Preview works
* [ ] No console-breaking errors appear

---

# Authentication Testing

Changes affecting authentication should test:

* [ ] Logged-out users
* [ ] Logged-in users
* [ ] Expired sessions
* [ ] Invalid sessions
* [ ] Protected routes
* [ ] Redirect behavior
* [ ] Unauthorized API calls

Never assume frontend route protection is sufficient.

Protected backend resources must verify authorization independently.

---

# Code Quality

Contributions should favor:

* Readable code
* Small focused components
* Reusable services
* Explicit error handling
* Strong TypeScript typing
* Clear server/client separation
* Existing architectural patterns

Avoid:

* Unexplained magic values
* Giant components
* Duplicate utilities
* Dead code
* Debugging output
* Hardcoded production URLs
* Hardcoded credentials
* Unnecessary `any`
* Unnecessary rewrites

---

# TypeScript

Where TypeScript is used:

* Add types for new interfaces.
* Avoid `any` unless necessary.
* Validate data received from external APIs.
* Do not treat external JSON as automatically type-safe.

Compile-time types do not replace runtime validation.

---

# Documentation

Update documentation when changing:

* Setup
* Installation
* APIs
* Environment variables
* Authentication
* Builder behavior
* Database schema
* Deployment
* AI providers
* BYOK configuration
* Cloud environments
* CLI functionality

Code and documentation should describe the same system.

---

# Bug Reports

A useful bug report should contain:

```markdown
## Description

What happened?

## Expected Behavior

What should have happened?

## Steps to Reproduce

1.
2.
3.

## Environment

Operating System:
Browser:
Node Version:
Package Manager:
Commit/Branch:

## Logs

Paste relevant logs here.

## Screenshots

Add screenshots if applicable.
```

Remove secrets before posting logs.

---

# Feature Requests

Feature requests should explain the problem first.

Recommended format:

```markdown
## Problem

What problem are you trying to solve?

## Proposed Feature

How should the feature work?

## User Flow

Describe how a user would interact with it.

## Alternatives

Are there other possible solutions?

## Additional Information

Mockups, screenshots, examples, or technical details.
```

---

# What Not to Submit

Please avoid submitting:

* Large unexplained rewrites
* Duplicate architecture
* Broken generated code
* Hardcoded secrets
* Unrelated formatting changes across the entire repository
* Placeholder UI presented as finished functionality
* Fake API integrations
* Dependencies that are not actually used
* Code copied from incompatible licenses
* Changes that intentionally disable security controls

---

# Contributor Checklist

Before submitting a Pull Request:

* [ ] I reviewed the existing implementation before creating a new system.
* [ ] I kept my change focused.
* [ ] I reviewed my own code.
* [ ] I tested the affected functionality.
* [ ] I verified the project still builds.
* [ ] I did not commit secrets.
* [ ] I did not expose server credentials to the browser.
* [ ] I checked authentication and authorization where applicable.
* [ ] I avoided unnecessary dependencies.
* [ ] I updated documentation where necessary.
* [ ] I removed debug code and placeholders.
* [ ] I reviewed AI-generated code before submitting it.
* [ ] I included screenshots for major UI changes.
* [ ] I explained any breaking changes.

---

# License

By contributing to this repository, you agree that your contribution may be distributed under the license associated with this repository.

Do not contribute code you do not have the right to distribute.

Do not submit proprietary, leaked, stolen, or otherwise unauthorized source code.

---

# Thank You

Thank you for contributing to **DreamMakerHub.website** and **AI WONDERLAND INNOVATION**.

The goal is to build a powerful, secure, flexible, and visually impressive AI creation platform while maintaining a codebase that can continue growing without unnecessary duplication or architectural fragmentation.
