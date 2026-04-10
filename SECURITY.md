# Security Policy

## Supported Versions

We currently support the latest release. Security updates are applied to the main branch and deployed to production regularly.

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes     |
| Older   | ❌ No      |

## Reporting a Vulnerability

We take security seriously. If you find a vulnerability, please report it responsibly.

### How to Report

1. **Email**: security@freedomian.com
2. **GitHub Issues**: Use our [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) with "SECURITY" in the title

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 24 hours
- **Initial Response**: Within 3 business days
- **Status Update**: Every 7 days until resolved
- **Public Disclosure**: After patch is released

## Security Measures

### What We Protect

- User authentication and session data
- Project and workspace data
- AI interaction data
- Cloud development environment isolation

### How We Protect It

- All connections use HTTPS/TLS
- Supabase Auth for secure authentication
- Environment variables for secrets (never committed to git)
- Container isolation for user cloud IDEs
- Input validation on all API endpoints
- Rate limiting on auth and API endpoints

## Scope

This policy applies to:
- freedomian.com
- All subdomains (*.freedomian.com)
- The AI Wonderland platform and services

## Out of Scope

- User-generated content in projects (unless it exposes a platform vulnerability)
- Social engineering attacks
- Physical security
- Denial of service (unless it's a platform vulnerability)

## Thanks

Thank you for helping keep AI Wonderland secure!
