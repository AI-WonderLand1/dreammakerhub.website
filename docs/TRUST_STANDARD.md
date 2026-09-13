# AI WONDERLAND Repository Trust Standard

This document defines the minimum public-repository baseline for AI WONDERLAND INNOVATION projects.

The goal is not to claim that a repository is risk-free. The goal is to make ownership, support, security expectations, licensing, contribution rules, and automated verification clear enough that users and contributors can evaluate the project without guessing.

## Required repository baseline

Every public production or product repository should include:

1. **README.md** with product scope, architecture, setup, current limitations, deployment model, related repositories, and license summary.
2. **LICENSE** with the correct repository/source URL and the actual terms governing use.
3. **SECURITY.md** with supported versions, private vulnerability-reporting instructions, and `security@dreammakerhub.website` as a private fallback.
4. **SUPPORT.md** with official support and business contact addresses.
5. **CONTRIBUTING.md** describing contribution rules, local verification, secrets handling, and license expectations.
6. **CODE_OF_CONDUCT.md** with a private conduct-reporting route.
7. **Pull request template** requiring verification and a security/secrets checklist.
8. **Issue templates** for bugs and feature requests, with security issues redirected to a private channel.
9. **Automated pull-request verification** that builds or otherwise validates the application before merge.
10. **Dependency monitoring** such as Dependabot for package and GitHub Actions updates.
11. **Static security analysis** such as CodeQL for supported languages.
12. **`.env.example` only for placeholders**. Real secrets must never be committed.

## Public identity standard

Public project contact addresses should use the product domain consistently:

- General: `hello@dreammakerhub.website`
- Support/account/billing: `support@dreammakerhub.website`
- Business/legal/privacy/careers: `contact@dreammakerhub.website`
- Security: `security@dreammakerhub.website`

Personal mailboxes should not be published as general support contacts.

## Security claims

Documentation should distinguish between what is implemented, what is planned, and what is still being hardened. Do not describe a control as production-ready unless the deployed path actually enforces it.

Security findings from CodeQL, dependency scanning, audits, or user reports should be triaged rather than hidden merely to make a repository look clean.

## CI and release trust

A change intended for production should pass the repository's required build/verification checks before deployment. Production workflows should keep deployment secrets outside the repository and should fail closed when required configuration is missing.

Where practical, deployments should use identifiable commits or immutable build artifacts so a deployed version can be traced back to source.

## User-data and privacy trust

Repositories that handle authentication, user files, API keys, personal data, payments, or AI-provider credentials must document the relevant boundaries and keep privileged secrets server-side. Public-facing products should link to current privacy, terms, refund, support, and security information where applicable.

## Review cadence

Review this baseline when a repository becomes public, before a production launch, after major authentication/storage/payment changes, and whenever contact or security-reporting details change.
