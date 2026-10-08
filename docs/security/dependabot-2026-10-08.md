# Dependabot remediation: October 8, 2026

This change addresses **three** of the ten reported alerts in `AI-WonderLand1/dreammakerhub.website`. Do not dismiss any other alert based on this PR.

## Fixed in this branch

| Alert | Lockfile | Action |
| --- | --- | --- |
| #336 | `package-lock.json` | Force `@modelcontextprotocol/sdk@1.31.0`, including the nested `@amplitude/ai` copy. |
| #333 | `my-agent/package-lock.json` | Force `@modelcontextprotocol/sdk@1.31.0`, including the nested `@amplitude/ai` copy. |
| #231 | `package-lock.json` | Force `decode-uri-component@0.5.0`. |

Check recorded versions with `npm run security:check`.

## Still unresolved — do not mark fixed

| Alerts | Package | Blocker / next action |
| --- | --- | --- |
| #316, #314 | `braces@3.0.3` | No official patched version for CVE-2026-93687 as of October 8. Review all exposure to untrusted glob inputs and evaluate replacing/upgrading `micromatch` once a fix is published. |
| #313 | `node-forge@1.4.0` | No official patched version for CVE-2026-85393. The package is pulled by Expo tooling; monitor upstream fix and prevent untrusted RSA PKCS#1 v1.5 signature verification until mitigated. |
| #320 | `sprintf-js@1.1.3` | No official patched version for CVE-2026-97058. Pulled through `tedious` in `my-agent`; do not pass untrusted formatting strings to it. Follow upstream updates or remove the dependency chain when safe. |
| #253, #331, #330 | `stream-json@1.9.1` | `minio@8.0.7` requires `^1.8.0`; patched `stream-json>=3.6.0` has ESM/API changes. A forced override may break MinIO event/notification parsing. Requires an integration-tested MinIO migration or a compatible maintained patch/fork. |

### Verification required before merge

1. Run `npm ci --ignore-scripts` from repository root and `my-agent` to validate lockfile consistency, then run normal installation in the trusted CI environment where install scripts are reviewed.
2. Run `npm run security:check`, `npm test`, and appropriate project builds.
3. Exercise MCP OAuth credential storage and trusted authorization issuer behavior; upgrading alone may not protect persisted tokens lacking issuer binding. Rotate affected secrets/tokens if a client was exposed to untrusted MCP servers.
4. Recheck GitHub Dependabot alerts after merging.
5. Do **not** claim all ten alerts are resolved: four unpatched-package alerts and three MinIO/stream-json alerts remain.

**Security note:** New install versions are pinned in npm overrides. Existing package tarball integrity hashes were sourced from recorded npm package lockfile entries; npm installation was not executable from this GitHub connector session.
