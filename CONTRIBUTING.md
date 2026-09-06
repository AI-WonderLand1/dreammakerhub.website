# Contributing to DreamMakerHub.website

Thank you for your interest in contributing to **DreamMakerHub.website**, a project developed by **AI WONDERLAND INNOVATION**.

DreamMakerHub.website is a publicly viewable, source-available software project focused on AI-assisted website and application development, visual editing, AI agents, cloud development environments, 3D/spatial tooling, developer infrastructure, and related technologies.

Contributions from individual developers, designers, testers, researchers, prompt engineers, technical writers, and other independent contributors are welcome.

---

# Important License Notice

This repository is **not offered as unrestricted open-source software**.

The source code is publicly available for viewing, learning, evaluation, personal experimentation, and approved contribution subject to the terms of the repository's license.

## No Company or Commercial Use

Unless separate written permission or a commercial agreement is provided by **AI WONDERLAND INNOVATION**, the software and source code in this repository may not be used by a company, corporation, business, commercial organization, competitor, commercial product, commercial platform, or revenue-generating service.

This includes, unless otherwise permitted by the repository license:

* Using the software inside a commercial product
* Using the software to operate a commercial service
* Reselling the software
* Repackaging the software for commercial distribution
* Offering the software as a hosted commercial service
* Using substantial portions of the code in a competing product
* Using the project as the foundation of another commercial platform
* Incorporating the code into proprietary company software
* Using the project internally for company commercial operations where prohibited by the license
* Removing or bypassing license restrictions
* Rebranding the project as another company's product

Public access to the repository does **not** grant unrestricted commercial rights.

Companies interested in using DreamMakerHub.website or its source code must obtain separate authorization from **AI WONDERLAND INNOVATION**.

The repository's `LICENSE` file is the controlling legal document.

If there is any conflict between this document and the license, the license controls.

---

# Individual Contributors Are Welcome

Independent contributors are welcome to:

* Review the source code
* Report bugs
* Suggest features
* Improve documentation
* Submit Pull Requests
* Improve UI/UX
* Write tests
* Review security
* Improve accessibility
* Improve performance
* Improve AI integrations
* Improve developer tooling
* Help identify unfinished features
* Improve templates
* Improve 3D/spatial functionality
* Improve cloud and infrastructure tooling

Contributing code does not grant additional rights to use the project outside the terms of the repository license.

---

# Contributions From Companies

Employees, contractors, consultants, representatives, or agents of a company may contribute only when their contribution does not conflict with the repository license or their employer's intellectual-property policies.

Submitting a contribution does **not** grant the contributor's employer or company a license to commercially use DreamMakerHub.website.

A company that wants to:

* deploy the software commercially,
* include the software in another product,
* use the code in a commercial service,
* build a competing service,
* redistribute the software commercially,
* or obtain broader rights,

must obtain separate permission or licensing from **AI WONDERLAND INNOVATION**.

---

# Project Overview

DreamMakerHub.website includes or may include systems involving:

* AI-assisted website generation
* AI-assisted application generation
* Visual drag-and-drop website building
* Multi-page editing
* Template creation
* Template editing
* AI chat
* AI agents
* AI coding assistance
* Bring Your Own Key / BYOK functionality
* Project management
* Cloud development environments
* Browser-based development tools
* File management
* Deployment infrastructure
* Kubernetes
* Supabase
* API integrations
* WebGL
* PlayCanvas
* 3D/spatial development
* Authentication
* Secrets management
* Developer tooling

The platform is actively under development.

Some systems may be experimental, incomplete, or subject to architectural changes.

---

# Technology Stack

The project currently uses technologies including:

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

Additional technologies may be used in individual parts of the repository.

Contributors should inspect the existing implementation before introducing new frameworks or dependencies.

---

# Before You Start

Before making changes:

1. Review the existing code.
2. Search existing GitHub Issues.
3. Search existing Pull Requests.
4. Determine whether the requested functionality already exists.
5. Determine whether an existing component, API, state store, database structure, or service should be extended.
6. Avoid introducing duplicate architecture.
7. Review the repository license.

Major architectural changes should normally be discussed before implementation.

---

# Do Not Rebuild Existing Systems

DreamMakerHub.website contains interconnected systems.

Before creating a new:

* authentication system
* state store
* project store
* page system
* database table
* API
* AI provider layer
* secrets system
* builder
* editor
* template manager
* deployment system
* storage system
* file manager

verify whether one already exists.

Contributors should extend working architecture rather than creating parallel implementations.

---

# WonderBuild / Visual Builder

The visual builder is a major part of DreamMakerHub.website.

Changes to the builder should preserve:

* Project persistence
* Page persistence
* Undo/redo behavior
* Saved element state
* Active page state
* Existing project compatibility
* Preview functionality

Do not create duplicate page stores or builder-state systems.

Builder changes should be tested carefully before submission.

---

# Multi-Page Editing

When working with multi-page functionality:

* Use the existing page-management system.
* Preserve the active page.
* Preserve page-specific element state.
* Ensure page switching does not overwrite another page.
* Test persistence after reload.
* Avoid duplicate Pages APIs.
* Avoid duplicate database systems.

---

# AI Features

AI-generated output must be treated as untrusted.

AI-related contributions should account for:

* Prompt injection
* Invalid model output
* Hallucinated APIs
* Malformed JSON
* Unauthorized tool execution
* Unsafe URLs
* Unsafe generated code
* Provider failures
* Rate limits
* Timeout handling

AI output should not automatically bypass application security controls.

---

# AI-Generated Contributions

AI-assisted development is permitted.

Contributors may use:

* ChatGPT
* GitHub Copilot
* Claude
* Gemini
* Codex
* Cursor
* AI coding agents
* Local language models
* Other AI development tools

However, the person submitting the contribution remains responsible for the code.

AI-generated code must be reviewed for:

* Security vulnerabilities
* Hallucinated libraries
* Broken imports
* Incorrect APIs
* Duplicate architecture
* Dead code
* Unsafe commands
* Credential exposure
* Authorization problems
* Incorrect database access
* Unnecessary dependencies
* Licensing problems

Do not submit generated code that you have not reviewed.

---

# BYOK — Bring Your Own Key

DreamMakerHub.website may allow users to connect their own AI or service-provider API keys.

User API keys are sensitive credentials.

They must not be:

* Hardcoded
* Committed to Git
* Logged
* Exposed in error messages
* Included in analytics
* Returned unnecessarily to clients
* Sent to unrelated providers

Secret credentials should remain server-side whenever possible.

---

# Secrets

Never commit real secrets.

Examples include:

```text
API keys
database passwords
Supabase service-role keys
OAuth secrets
cloud provider credentials
SSH private keys
JWT secrets
webhook secrets
access tokens
refresh tokens
private certificates
encryption keys
```

Files such as these should normally remain ignored:

```text
.env
.env.local
.env.production
.env.development.local
*.key
*.pem
credentials.json
```

Safe example files may be included:

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

Never put real values into `.env.example`.

---

# Supabase

When working with Supabase:

* Preserve Row Level Security where required.
* Keep service-role keys server-side.
* Verify resource ownership.
* Avoid unrestricted queries.
* Review RLS policies when adding new tables.
* Protect user-owned data.
* Apply appropriate storage policies.

Client-accessible Supabase configuration is not equivalent to privileged server credentials.

---

# API Security

All API routes should validate input.

Where applicable, APIs should also enforce:

* Authentication
* Authorization
* Ownership checks
* Rate limiting
* Safe error handling
* Input sanitization
* Appropriate HTTP methods
* Appropriate HTTP status codes

Do not trust the frontend to enforce backend security.

---

# Security-Sensitive Areas

Extra review is required for changes involving:

* Authentication
* Authorization
* Secrets
* API keys
* File uploads
* AI agents
* Shell commands
* SSH
* Databases
* GitHub integrations
* Webhooks
* Kubernetes
* Cloud infrastructure
* Deployment systems
* User-created executable content

Ask:

```text
Who is making this request?

Does this user own the resource?

Could another user's data be accessed?

Could this input execute code?

Could this expose credentials?

Could this reach internal infrastructure?

Could this operation be abused repeatedly?
```

---

# Branch Naming

Use descriptive branch names.

Examples:

```text
feature/byok-settings
feature/template-preview
feature/builder-pages-panel
feature/ai-provider-selector

fix/project-routing
fix/mobile-layout
fix/builder-save
fix/auth-redirect

security/api-rate-limiting
security/input-validation

docs/update-contributing

refactor/project-store
refactor/ai-provider-layer
```

Avoid names such as:

```text
test
new
stuff
changes
fix
branch1
```

---

# Commit Messages

Use clear commit messages.

Examples:

```text
feat: add BYOK provider settings

fix: preserve builder page state

fix: handle failed OpenRouter request

security: validate API input

security: add rate limiting

docs: update contributor guidelines

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

Pull Requests should be focused and easy to review.

Include:

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

Include screenshots for visible UI changes.

## Breaking Changes

List any breaking changes.

## Environment Variables

List any new environment variables.

## Security Impact

Describe any authentication, authorization, data, API, secrets, or infrastructure impact.
```

Avoid combining unrelated work into a single Pull Request.

---

# UI and UX

DreamMakerHub.website is intended to provide a polished development and creative experience.

UI contributions should:

* Match the project's existing visual direction.
* Work on desktop.
* Remain usable on smaller screens.
* Provide loading states.
* Provide error states.
* Provide empty states.
* Include keyboard and focus behavior where appropriate.
* Avoid nonfunctional buttons.
* Avoid unnecessary placeholder content.
* Avoid generic unfinished layouts.

Screenshots are strongly encouraged for major visual changes.

---

# Template Library

Templates should:

* Be visually distinct.
* Provide complete layouts.
* Avoid placeholder-only content.
* Have accurate previews.
* Open correctly in the editor.
* Remain editable.
* Demonstrate the quality of the platform.

Avoid publishing many templates that are only minor variations of the same design.

---

# Routing

Before adding a route:

1. Search existing routes.
2. Verify the feature does not already have a destination.
3. Test navigation.
4. Test browser refresh.
5. Test authentication behavior.
6. Test redirects.

Avoid duplicate routes for the same feature.

---

# Cloud Development Environments

Cloud development features must maintain strong user isolation.

One user must not be able to access:

* Another user's terminal
* Another user's environment variables
* Another user's files
* Another user's container
* Another user's credentials
* Another user's development session

Workspace IDs alone should never be treated as proof of authorization.

---

# Kubernetes

Kubernetes contributions should consider:

* Namespace isolation
* Service-account permissions
* Resource limits
* Pod security
* Network policies
* Secrets handling
* Storage isolation
* Container privileges

Avoid privileged containers unless there is a documented technical requirement.

---

# 3D and Spatial Features

3D/spatial features should consider:

* Asset size
* Browser performance
* WebGL resource cleanup
* External asset validation
* Parser security
* Texture size
* Loading failures
* Memory usage

Do not replace existing spatial infrastructure without understanding its integration with the rest of the platform.

---

# Dependencies

Before adding a dependency:

* Check whether equivalent functionality already exists.
* Verify the package is maintained.
* Review known vulnerabilities.
* Check its license.
* Consider bundle size.
* Review install scripts where relevant.

Avoid dependencies for trivial functionality.

---

# Testing

Run the checks supported by the repository before submitting a Pull Request.

Typical commands may include:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

The exact commands may change with the project.

At minimum, do not intentionally submit changes that break the production build.

---

# Builder Testing Checklist

Changes affecting WonderBuild should verify:

* [ ] Builder loads
* [ ] Existing projects load
* [ ] Components render
* [ ] Drag and drop works
* [ ] Editing works
* [ ] Saving works
* [ ] Reload preserves changes
* [ ] Undo works
* [ ] Redo works
* [ ] Page switching works
* [ ] Pages keep independent content
* [ ] Preview works
* [ ] No critical console errors appear

---

# Authentication Testing

Authentication changes should test:

* [ ] Logged-out users
* [ ] Logged-in users
* [ ] Invalid sessions
* [ ] Expired sessions
* [ ] Protected pages
* [ ] Unauthorized API requests
* [ ] Redirect behavior

Backend authorization must not rely entirely on frontend route protection.

---

# Code Quality

Prefer:

* Readable code
* Focused components
* Strong TypeScript types
* Reusable services
* Explicit error handling
* Existing architecture
* Clear client/server separation

Avoid:

* Large unexplained rewrites
* Hardcoded credentials
* Hardcoded production URLs
* Duplicate utilities
* Dead code
* Debugging output
* Excessive use of `any`
* Fake integrations
* Unused dependencies

---

# Documentation

Documentation should be updated when contributions change:

* Installation
* Environment variables
* APIs
* Authentication
* Builder functionality
* Deployment
* Database structure
* AI providers
* BYOK configuration
* Cloud environments
* CLI functionality
* Security behavior

Documentation should accurately reflect the actual implementation.

---

# Bug Reports

A useful bug report includes:

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

Paste relevant logs.

## Screenshots

Add screenshots where helpful.
```

Remove credentials before sharing logs.

---

# Feature Requests

Feature requests should explain the actual user problem.

Recommended format:

```markdown
## Problem

What problem should be solved?

## Proposed Feature

How should the feature work?

## User Flow

How would someone interact with it?

## Alternatives

What other approaches were considered?

## Additional Information

Mockups, screenshots, examples, or technical notes.
```

---

# Security Vulnerabilities

Do not publicly disclose serious vulnerabilities.

Where available, use GitHub Private Vulnerability Reporting:

```text
Repository
→ Security
→ Advisories
→ Report a vulnerability
```

Do not publish real credentials or access unrelated user information when demonstrating a security issue.

---

# Ownership of Contributions

By submitting a Pull Request or other contribution, you represent that:

* You have the right to submit the contribution.
* The contribution does not knowingly violate third-party intellectual-property rights.
* You understand that the contribution may become part of DreamMakerHub.website.
* Distribution and use of the resulting project remains governed by the repository license.

Submitting a contribution does **not** give the contributor ownership of the DreamMakerHub.website project, brand, platform, or existing source code.

---

# Company Rights Are Not Granted by Contribution

A contribution made by an employee, contractor, founder, consultant, or representative of another organization does not automatically grant that organization commercial rights to DreamMakerHub.website.

Commercial rights require separate permission where required by the repository license.

---

# Trademark and Branding

The names:

```text
DreamMakerHub
DreamMakerHub.website
AI WONDERLAND INNOVATION
WonderBuild
```

and associated logos, branding, visual identity, and product names are not automatically licensed merely because the repository source is publicly visible.

Do not represent an unofficial fork, modified version, or derivative project as an official DreamMakerHub or AI WONDERLAND INNOVATION product.

---

# Forks

Forking the repository through GitHub does not override the license.

Forks remain subject to all applicable repository-license restrictions.

Public visibility does not authorize commercial exploitation.

---

# What Not to Submit

Do not submit:

* Hardcoded secrets
* Unauthorized proprietary code
* Leaked source code
* Code copied under incompatible licenses
* Large unexplained rewrites
* Duplicate architecture
* Fake API integrations
* Nonfunctional placeholder systems presented as complete
* Malware
* Backdoors
* Telemetry added without disclosure
* Code intended to bypass the project's license restrictions
* Code intended to remove ownership or attribution notices

---

# Contributor Checklist

Before opening a Pull Request:

* [ ] I reviewed the existing implementation.
* [ ] I reviewed the repository license.
* [ ] I understand that public source does not mean unrestricted commercial use.
* [ ] I kept the change focused.
* [ ] I reviewed my own code.
* [ ] I tested the affected functionality.
* [ ] The application still builds.
* [ ] I did not commit secrets.
* [ ] I did not expose server-side credentials.
* [ ] I verified authorization where applicable.
* [ ] I avoided unnecessary dependencies.
* [ ] I removed debugging code.
* [ ] I updated documentation where necessary.
* [ ] I reviewed AI-generated code before submitting it.
* [ ] I included screenshots for major UI changes.
* [ ] I disclosed any breaking changes.

---

# License

DreamMakerHub.website is distributed under the license contained in this repository.

The software is **source-available**, but public visibility does not grant unrestricted rights.

In particular, company, corporate, competitive, revenue-generating, or commercial use may be restricted or prohibited unless separately authorized by **AI WONDERLAND INNOVATION**.

Always read the complete `LICENSE` file before using, copying, modifying, redistributing, deploying, or incorporating any part of this project into another product or service.

The `LICENSE` file is the controlling document.

---

# Commercial Licensing

Organizations that want rights beyond those provided by the repository license may seek separate permission from **AI WONDERLAND INNOVATION**.

This may include permission for:

* Commercial deployment
* Internal company use
* Product integration
* SaaS usage
* Redistribution
* Enterprise deployment
* Commercial derivatives
* White-label arrangements
* OEM integrations
* Other commercial use

Permission is not implied merely because the repository is public.

---

# Thank You

Thank you for contributing to **DreamMakerHub.website**.

The goal is to build a powerful AI development and creation platform while protecting the work, architecture, intellectual property, branding, and commercial rights of **AI WONDERLAND INNOVATION**.

Individual contributors who want to improve the project are welcome.

Companies or commercial organizations seeking broader rights should obtain separate authorization before using the project commercially.
