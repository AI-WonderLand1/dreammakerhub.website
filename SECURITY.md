# Security Policy

## DreamMakerHub.website

**DreamMakerHub.website** is developed by **AI WONDERLAND INNOVATION**.

Security is treated as a core requirement of the platform because DreamMakerHub.website includes systems involving authentication, user projects, AI providers, API keys, secrets, cloud development environments, file access, deployment infrastructure, 3D/spatial tools, external APIs, and user-generated content.

We appreciate responsible security research and reports that help improve the platform.

---

# Supported Versions

DreamMakerHub.website is under active development.

Security fixes are generally applied to the latest supported version of the main branch.

| Version                        | Supported  |
| ------------------------------ | ---------- |
| Latest `main` branch           | ✅ Yes      |
| Current production release     | ✅ Yes      |
| Older development branches     | ⚠️ Limited |
| Abandoned or archived branches | ❌ No       |

If a vulnerability affects an older version but also exists in the current codebase, please report it.

---

# Reporting a Vulnerability

Please **do not publicly disclose serious security vulnerabilities** through:

* Public GitHub Issues
* Public Discussions
* Pull Request comments
* Social media
* Public Discord or community channels
* Screenshots containing credentials
* Public proof-of-concept repositories

Instead, use GitHub's private security reporting system when available:

```text
Repository
→ Security
→ Advisories
→ Report a vulnerability
```

If private vulnerability reporting is enabled, this is the preferred reporting method.

---

# What to Include in a Security Report

Please provide enough information for the vulnerability to be reproduced and investigated.

A useful report should include:

```markdown
## Vulnerability Summary

Briefly describe the vulnerability.

## Affected Component

Examples:

- Authentication
- API route
- Builder
- AI provider
- BYOK system
- File upload
- Database
- Deployment system
- Cloud environment
- Webhook
- 3D/spatial service

## Impact

Explain what an attacker may be able to do.

## Steps to Reproduce

1.
2.
3.

## Expected Behavior

Explain what should happen.

## Actual Behavior

Explain what currently happens.

## Proof of Concept

Provide a minimal safe proof of concept if necessary.

## Suggested Fix

Optional.

## Environment

Branch:
Commit:
Browser:
Operating System:
Node Version:
```

Please remove or redact real credentials before submitting the report.

---

# Sensitive Information

Never include real production secrets in a security report.

This includes:

```text
API keys
database passwords
Supabase service-role keys
cloud credentials
SSH private keys
JWT signing secrets
OAuth client secrets
webhook secrets
session tokens
access tokens
refresh tokens
encryption keys
private certificates
user passwords
```

Use placeholders such as:

```text
REDACTED_API_KEY
```

or:

```text
sk-example-xxxxxxxx
```

---

# Security Scope

Security reports are especially important when they involve the following areas.

---

# Authentication

Authentication vulnerabilities may include:

* Authentication bypass
* Session fixation
* Session hijacking
* Weak session invalidation
* Improper token validation
* Password reset weaknesses
* OAuth implementation flaws
* Incorrect login-state handling
* Protected routes accessible without authentication

Frontend route protection alone is not considered sufficient.

Protected backend operations should independently verify authentication.

---

# Authorization

Authorization issues are considered high priority.

Examples include:

* Accessing another user's project
* Editing another user's project
* Viewing another user's files
* Accessing another user's API keys
* Accessing another user's cloud environment
* Accessing administrator functionality
* Modifying resources without ownership validation
* Insecure Direct Object References / IDOR

Every privileged resource should verify both:

1. Who the user is.
2. Whether the user is authorized to access the requested resource.

---

# API Security

DreamMakerHub.website contains multiple API routes and integrations.

Security issues may include:

* Missing authentication
* Missing authorization
* Missing input validation
* Excessive data exposure
* Rate-limit bypass
* Injection attacks
* Credential leakage
* Unsafe redirects
* Unsafe external requests
* Incorrect HTTP method handling
* Sensitive stack traces
* Server errors exposing implementation details

External request input should be treated as untrusted.

---

# Rate Limiting

Endpoints should use appropriate rate limiting when abuse may cause:

* Authentication attacks
* Brute-force attempts
* AI API cost abuse
* Resource exhaustion
* Database abuse
* Webhook abuse
* Email abuse
* Deployment abuse
* File-processing abuse

High-cost AI and infrastructure endpoints should receive additional scrutiny.

---

# AI Security

DreamMakerHub integrates AI providers and AI-powered workflows.

AI output must be treated as untrusted input.

Potential security problems include:

* Prompt injection
* Tool-call injection
* Malicious AI-generated code
* Unsafe shell command generation
* Unauthorized data access
* Model output being executed without validation
* Secrets included in model context
* AI-generated URLs causing SSRF
* AI-generated SQL being executed without controls
* AI agents escaping assigned permissions

AI-generated instructions must not automatically override application authorization or security controls.

---

# AI Agent Security

AI agents that can interact with tools, APIs, infrastructure, files, terminals, or deployment systems require strict boundaries.

Agents should operate using least privilege.

Agents should not automatically receive:

* Production database credentials
* Root access
* Infrastructure administrator credentials
* unrestricted shell access
* cross-user data access
* unrestricted cloud API permissions

Actions capable of causing destructive or irreversible changes should require appropriate safeguards.

---

# BYOK Security

DreamMakerHub may support **Bring Your Own Key (BYOK)** functionality.

User-provided API keys should be treated as highly sensitive secrets.

BYOK credentials must not be:

* Hardcoded
* Committed to Git
* Logged
* Exposed through error responses
* Included in analytics
* Accidentally rendered in HTML
* Sent to unrelated services
* Returned unnecessarily through APIs

Where technically possible, provider credentials should remain server-side.

Only the minimum necessary service should receive the key.

---

# Secret Management

Secrets should never be committed directly to the repository.

Sensitive configuration includes:

```text
.env
.env.local
.env.production
.env.development.local
```

Sensitive values should be stored through an approved secrets-management mechanism.

Examples may include:

* Infrastructure secret managers
* Server environment variables
* Kubernetes Secrets
* Encrypted deployment configuration
* Managed secrets platforms

Example files such as:

```text
.env.example
```

must contain placeholders only.

---

# Supabase Security

Where Supabase is used:

* Row Level Security should remain enabled where applicable.
* Service-role credentials must never be exposed to browser code.
* User data must be protected with appropriate RLS policies.
* API routes using elevated credentials must perform authorization checks.
* New tables should be reviewed for ownership and access rules.
* Storage buckets should use appropriate access policies.

A public Supabase URL or anonymous key is not equivalent to a service-role secret.

The service-role key must remain server-side.

---

# Database Security

Database-related vulnerabilities may include:

* SQL injection
* Missing ownership checks
* Missing Row Level Security
* Excessive database permissions
* Leaking database credentials
* Unrestricted administrative queries
* Improper database backups
* Sensitive data stored unnecessarily
* Cross-user data exposure

Parameterized queries or trusted query builders should be used instead of directly concatenating user input into database queries.

---

# Environment Variable Security

Environment variables intended for server use must not accidentally be exposed to browser bundles.

Special care should be taken with variables using public prefixes such as:

```text
NEXT_PUBLIC_
```

Only values intentionally safe for public exposure should use public environment-variable prefixes.

Private server credentials must remain private.

---

# File Upload Security

File uploads should be treated as untrusted.

Potential issues include:

* Path traversal
* Executable file uploads
* Malicious SVG files
* Oversized files
* MIME type spoofing
* Archive bombs
* Filename injection
* Stored XSS
* Malware
* Uploading scripts into executable directories

Applications should validate both file type and file content when appropriate.

Generated filenames should be preferred over directly trusting user-supplied filenames.

---

# Path Traversal

File paths influenced by user input must be validated.

Examples of dangerous input include:

```text
../../etc/passwd
```

or encoded variations.

User-controlled paths must not allow access outside the intended workspace or storage location.

---

# Remote Code Execution

Features involving:

* Terminals
* Shell commands
* Build systems
* AI coding agents
* Cloud IDE environments
* Container execution
* Deployment automation

must be reviewed carefully for remote-code-execution risks.

User-controlled values should not be interpolated directly into shell commands.

Prefer structured process execution over shell command construction whenever practical.

---

# Command Injection

Avoid patterns equivalent to:

```javascript
exec(`command ${userInput}`)
```

when `userInput` is not strictly validated.

Input used in operating-system commands should be considered hostile.

Use allowlists and structured command arguments where possible.

---

# Server-Side Request Forgery

Any feature that allows users or AI systems to provide URLs may create an SSRF risk.

Applications should consider blocking requests to:

```text
127.0.0.1
localhost
169.254.169.254
private network ranges
internal service domains
cloud metadata services
```

unless internal access is intentionally required.

Redirects should also be validated.

---

# Cross-Site Scripting

User-generated content must be sanitized before being rendered as executable HTML.

Potential XSS sources include:

* AI-generated HTML
* User-created page content
* Template content
* Markdown
* SVG
* URL parameters
* Rich-text input
* Imported website content

Avoid rendering untrusted HTML directly.

If raw HTML rendering is necessary, use an appropriate sanitization layer.

---

# Cross-Site Request Forgery

State-changing actions should be protected against unauthorized cross-site requests where relevant.

Sensitive operations include:

* Account changes
* API-key changes
* Project deletion
* Deployment
* Cloud environment creation
* Billing actions
* Security settings

Authentication cookies should use appropriate security attributes.

---

# Cookies and Sessions

Authentication cookies should use suitable settings where applicable:

```text
HttpOnly
Secure
SameSite
```

Session tokens should not be exposed through frontend logs or URLs.

Sessions should expire appropriately and should be invalidated when security-sensitive account changes occur.

---

# GitHub Integration Security

GitHub integrations should validate:

* OAuth state
* Token permissions
* Repository ownership
* Webhook signatures
* Installation permissions
* User authorization

GitHub tokens should receive only the minimum permissions necessary.

---

# Webhook Security

Incoming webhooks must not be trusted based only on their URL.

Where supported, verify:

* Signatures
* Shared secrets
* Timestamp freshness
* Event type
* Expected sender

Webhook payloads must still be validated after signature verification.

---

# Cloud Infrastructure Security

DreamMakerHub may integrate external cloud platforms and deployment infrastructure.

Cloud credentials should follow least-privilege principles.

Avoid credentials with unrestricted:

```text
Administrator
Owner
Root
FullAccess
```

permissions when narrower permissions are sufficient.

User-provided cloud credentials should only be used for the requested user-owned resources.

---

# Kubernetes Security

Kubernetes-related systems should consider:

* Namespace isolation
* Pod security
* Resource limits
* Network policies
* Secrets handling
* Service account permissions
* Container privileges
* Persistent storage isolation

Avoid privileged containers unless there is a documented and reviewed requirement.

Avoid mounting sensitive host directories.

---

# Container Security

Containerized environments should:

* Avoid unnecessary root execution.
* Minimize installed software.
* Avoid embedding credentials in images.
* Keep dependencies updated.
* Apply resource limits.
* Separate users when possible.
* Prevent unauthorized access to the host.

Container boundaries must not be treated as automatically sufficient without appropriate configuration.

---

# Cloud Development Environments

Browser-based development environments require strong tenant isolation.

One user must not be able to:

* Access another user's files
* Read another user's environment variables
* Access another user's terminal
* Reuse another user's authentication session
* Connect to another user's container
* Read shared infrastructure secrets

Workspace identifiers must not be treated as authorization by themselves.

---

# Builder Security

DreamMakerHub's visual builder handles user-generated website content.

Builder content must be considered untrusted.

Potential risks include:

* Script injection
* Malicious HTML
* Unsafe iframe embeds
* Dangerous external URLs
* Template injection
* Prototype pollution
* Imported malicious components

Preview environments should be isolated where possible.

---

# Template Security

Templates should not contain:

* Hidden scripts
* Hardcoded credentials
* Malicious external requests
* Unauthorized tracking
* Unsafe iframes
* Untrusted executable code

Imported templates should be validated before being trusted.

---

# 3D and Spatial Security

3D and spatial systems may process externally supplied files.

Potential attack vectors include:

* Malformed model files
* Oversized assets
* Parser vulnerabilities
* Memory exhaustion
* Malicious texture files
* Unsafe remote asset URLs

Model and asset processing should enforce reasonable size limits.

External parsers and graphics libraries should be kept current.

---

# Dependency Security

Dependencies should be monitored for known security vulnerabilities.

Before adding a dependency:

* Verify that it is maintained.
* Review known vulnerabilities.
* Check its license.
* Review its install scripts.
* Avoid unnecessary dependencies.

Dependency vulnerabilities should be prioritized based on actual exploitability and exposure.

---

# GitHub Dependabot

Dependabot alerts should be reviewed rather than ignored.

High-severity alerts should receive prompt attention, especially when they affect:

* Runtime dependencies
* File parsers
* Authentication
* Network libraries
* Server-side APIs
* Build pipelines exposed to untrusted input

Updating dependencies should still be tested for regressions.

---

# GitHub CodeQL

CodeQL findings should be investigated carefully.

Potential findings may include:

* Missing rate limiting
* Unsafe user input
* Injection paths
* Hardcoded credentials
* Path traversal
* Authorization problems
* Insecure randomness
* XSS risks

A finding should not automatically be dismissed merely because it is generated by static analysis.

Determine whether the affected code is actually reachable and exploitable.

---

# Logging Security

Logs should not contain sensitive information.

Never intentionally log:

```text
Passwords
API keys
Bearer tokens
Authorization headers
Session cookies
Database credentials
Private keys
Encryption keys
Full payment information
```

Error logging should provide enough information for debugging without exposing secrets.

---

# Error Handling

Production errors should not expose:

* Full stack traces
* Database connection strings
* Environment variables
* Server filesystem paths
* Secrets
* Internal tokens
* Detailed infrastructure topology

User-facing errors should remain useful but limited.

---

# Input Validation

All external input must be treated as untrusted.

This includes:

* Form data
* JSON
* URL parameters
* Headers
* Cookies
* AI output
* Webhooks
* Uploaded files
* Imported projects
* External APIs

Validation should occur on the server even when frontend validation already exists.

---

# Output Encoding

Data displayed in HTML, JavaScript, URLs, CSS, or other contexts should be encoded appropriately for that context.

Input validation alone does not replace safe output encoding.

---

# Principle of Least Privilege

Every service, account, user, process, agent, container, and integration should receive only the permissions necessary to perform its intended function.

This applies to:

* Supabase
* GitHub
* Cloud providers
* Kubernetes
* AI providers
* Databases
* Storage
* Deployment services
* SSH
* CI/CD

---

# Encryption in Transit

Production services handling sensitive information should use encrypted network connections.

Use HTTPS/TLS for public services.

Database and internal service connections should also use encrypted transport when supported.

---

# Encryption at Rest

Highly sensitive stored data should use appropriate encryption at rest.

This is particularly important for:

* API keys
* provider credentials
* cloud credentials
* private tokens
* sensitive user configuration

Encryption keys should be separated from the encrypted data whenever practical.

---

# Credential Rotation

Credentials should be rotated when:

* A secret is accidentally committed.
* A secret appears in logs.
* A secret is posted publicly.
* An employee or contractor no longer requires access.
* A credential may have been compromised.
* A repository history contains a secret.

Deleting a secret from the latest Git commit is not sufficient if it was previously committed.

The credential itself must be rotated.

---

# Accidentally Committed Secrets

If a secret is committed:

1. Revoke or rotate the secret immediately.
2. Remove it from the repository.
3. Investigate where it may have been exposed.
4. Review logs for unauthorized use.
5. Clean Git history when appropriate.
6. Update the relevant security configuration.

Do not assume that deleting a public GitHub commit makes the secret safe again.

---

# CI/CD Security

CI/CD pipelines should follow least privilege.

Workflow security should include:

* Minimal GitHub token permissions
* Protected production secrets
* Reviewed third-party actions
* Pinned action versions where practical
* Restricted deployment credentials
* Controlled production environments

Pull Requests from untrusted forks should never automatically receive sensitive deployment secrets.

---

# Third-Party Integrations

External integrations should be treated as separate trust boundaries.

Before sending information to a third party, verify that the service actually needs that information.

Avoid sending:

* Private project source code
* secrets
* credentials
* unrelated user data

unless explicitly required and authorized.

---

# Privacy and Data Exposure

Security reports involving unintended user-data exposure are in scope.

Examples include:

* Cross-user project access
* Private file exposure
* Private prompts exposed publicly
* User API keys being visible
* Personal account details leaking
* User project URLs becoming public unexpectedly

Only access the minimum data required to demonstrate the vulnerability.

Do not download or retain unnecessary user information.

---

# Responsible Testing

Security research should avoid causing harm.

Do not:

* Destroy user data
* Modify other users' projects
* Access private data unnecessarily
* Launch denial-of-service attacks
* Send mass spam
* Consume excessive AI API credits
* Mine cryptocurrency
* Install persistence mechanisms
* Attempt lateral movement into unrelated systems
* Exfiltrate secrets beyond what is necessary to prove the issue

If a vulnerability can be demonstrated safely, stop after demonstrating the minimum required impact.

---

# Denial of Service

Do not intentionally perform large-scale denial-of-service testing against production infrastructure.

If you discover a possible resource-exhaustion vulnerability, provide a controlled proof of concept that demonstrates the issue without causing service disruption.

---

# Social Engineering

The following are outside the scope of authorized security testing:

* Phishing users
* Impersonating employees
* Calling service providers
* Attempting credential theft from humans
* Physical security testing

---

# Physical Security

Physical attacks against infrastructure, offices, employees, contractors, or hosting facilities are out of scope.

---

# Safe Harbor

We support good-faith security research intended to improve DreamMakerHub.website.

Researchers acting in good faith should:

* Make a reasonable effort to avoid privacy violations.
* Avoid destroying data.
* Avoid service disruption.
* Report vulnerabilities privately.
* Allow reasonable time for remediation before public disclosure.
* Avoid exploiting vulnerabilities beyond what is required for verification.

This policy does not authorize illegal activity.

---

# Disclosure Process

After receiving a valid security report, the project may:

1. Confirm receipt.
2. Reproduce the issue.
3. Determine severity.
4. Develop a fix.
5. Test the fix.
6. Deploy or merge the fix.
7. Coordinate disclosure when appropriate.

Complex issues involving upstream dependencies or external providers may require additional coordination.

---

# Severity

Vulnerability severity may be evaluated using factors including:

* Attack complexity
* Required privileges
* User interaction
* Confidentiality impact
* Integrity impact
* Availability impact
* Number of affected users
* Exposure of credentials
* Cross-tenant impact
* Remote exploitation potential

Examples of potentially critical findings include:

* Remote code execution
* Authentication bypass
* Cross-user administrative access
* Production cloud credential exposure
* Database administrator credential exposure
* Arbitrary command execution
* Large-scale secret disclosure

---

# Security Is a Shared Responsibility

Contributors should treat security as part of normal engineering rather than an afterthought.

Before submitting code, consider:

```text
Is this input trusted?

Does this endpoint require authentication?

Does this user actually own this resource?

Could this expose another user's data?

Could this expose a secret?

Could this execute arbitrary code?

Could this make internal network requests?

Could this be abused repeatedly?

Could an AI-generated value become executable?

Could a browser receive a server-only credential?
```

---

# Security Checklist for Contributors

Before submitting security-sensitive changes:

* [ ] Authentication is enforced where necessary.
* [ ] Authorization verifies resource ownership.
* [ ] User input is validated.
* [ ] AI output is treated as untrusted.
* [ ] Secrets remain server-side.
* [ ] Sensitive values are not logged.
* [ ] Server errors do not expose secrets.
* [ ] Database queries are safely constructed.
* [ ] File paths are validated.
* [ ] File uploads are restricted appropriately.
* [ ] External URLs are reviewed for SSRF risk.
* [ ] State-changing operations are protected.
* [ ] Rate limiting is applied where appropriate.
* [ ] Dependencies have been reviewed.
* [ ] Production credentials are not committed.
* [ ] Browser bundles do not contain private credentials.
* [ ] Cross-user access has been tested.
* [ ] New infrastructure follows least privilege.

---

# Security Contact

The preferred method for reporting security vulnerabilities is through the repository's **GitHub Security Advisory / Private Vulnerability Reporting** feature.

Do not open a public issue for vulnerabilities that could place users, credentials, infrastructure, or data at risk.

---

# Final Note

DreamMakerHub.website is an actively evolving platform combining AI, visual development, cloud infrastructure, developer tooling, and 3D/spatial systems.

Because these systems cross multiple security boundaries, security changes should favor:

* Least privilege
* Strong authentication
* Explicit authorization
* Input validation
* Secure secret handling
* User isolation
* Defense in depth
* Safe failure behavior
* Minimal exposure of sensitive information

Thank you for helping improve the security of **DreamMakerHub.website** and **AI WONDERLAND INNOVATION**.
