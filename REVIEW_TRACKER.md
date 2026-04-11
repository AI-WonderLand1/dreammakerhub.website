# Project Review Tracker

## Status: ✅ REVIEW COMPLETE — DEEP SCAN DONE

---

## Batch 1: Root Config Files (5 reviewed)
1. `.gitignore` ✅ - OK
2. `.env.example` ⚠️ - Has placeholders
3. `.env.local` ⚠️ - Fixed password
4. `coder.env` ⚠️ - Stripped secrets (done)
5. `config.yaml` ✅ - OK

---

## Batch 2: Docker/Build Files
6. `Dockerfile.editor` - ✅ OK
7. `docker-compose.yml` - ⚠️ References missing Dockerfile.workspace
8. `package.json` - ✅ OK (no secrets)
9. `Makefile` - ✅ OK (just created)
10. `vercel.json` - ✅ OK 

---

## Batch 3: Deploy Scripts
11. `deploy.sh` - ✅ FIXED (removed secret.yaml reference)
12. `deploy-ide.sh` - ✅ FIXED (removed secret.yaml reference)
13. `connect-oci.sh` - 
14. `workspace-entrypoint.sh` - 
15. `deploy/setup-coder.sh` - 

---

## Batch 4: K8s Manifests (part 1)
16. `deploy/k8s/namespace.yaml` - ✅ OK
17. `deploy/k8s/cert-manager.yaml` - ✅ OK (manual cert-manager)
18. `deploy/k8s/cluster-issuer.yaml` - ✅ OK
19. `deploy/k8s/configmap.yaml` - ✅ OK
20. `deploy/k8s/secret.yaml` - DELETED (Vault now)

---

## Batch 5: K8s Manifests (part 2)
21. `deploy/k8s/coder-deployment.yaml` - ✅ OK
22. `deploy/k8s/coder-db.yaml` - ✅ OK
23. `deploy/k8s/ingress.yaml` - ✅ OK
24. `deploy/k8s/workspace-deployment.yaml` - ✅ OK
25. `deploy/k8s/workspace-ingress.yaml` - ✅ OK 

---

## Batch 6: K8s Manifests (part 3)
26. `deploy/k8s/web-deployment.yaml` - ✅ OK
27. `deploy/k8s/web-service.yaml` - ✅ OK
28. `deploy/k8s/ide-deployment.yaml` - ✅ FIXED namespace
29. `deploy/k8s/ide-ingress.yaml` - ⚠️ HAS WRONG DOMAIN: orical.com → needs dreammakerhub.website
30. `deploy/k8s/README.md` - ✅ OK

---

## Batch 7: GitHub/CI
31. `.github/workflows/ci.yml` - ✅ OK
32. `.gitlab-ci.yml` - ✅ OK

---

## Batch 8: Apps/Web
33. `apps/web/package.json` - ✅ OK
34. `apps/web/next.config.js` - ✅ OK (CSP, WebGL config)
35. `apps/web/middleware.ts` - ✅ OK (rate limiting) 

---

## Batch 9: Scripts
36. `scripts/registry/sync-assets.mjs` - ✅ OK
37. `scripts/build-linux.sh` - ✅ OK (Unreal placeholder paths)
38. `scripts/devtool.sh` - ✅ OK

---

## Batch 10: K8s Devcontainer (10 files)
39. `kubernetes-devcontainer/main.tf` - ✅ OK (coder terraform)
40. `kubernetes-devcontainer/terraform.tfvars` - ⚠️ HAS PLACEHOLDER: coder_url = "https://coder.yourdomain.com"
41. `kubernetes-devcontainer/terraform.tfvars.example` - ✅ OK (example, has placeholders by design)
42. `kubernetes-devcontainer/variables.tf` - ⚠️ DEFAULT PLACEHOLDER: coder_url default = "https://coder.wonderland.com"
43. `kubernetes-devcontainer/.devcontainer/devcontainer.json` - ✅ OK
44. `kubernetes-devcontainer/.devcontainer/Dockerfile` - ✅ OK
45. `kubernetes-devcontainer/post-start.sh` - ✅ OK
46. `kubernetes-devcontainer/README.md` - ✅ OK
47. `deploy/setup-coder.sh` - ✅ OK
48. `.devcontainer/Dockerfile` - ✅ OK

---

## Batch 11: Apps/Web Core (10 files)
49. `apps/web/env.d.ts` - ✅ OK (type definitions)
50. `apps/web/app/layout.tsx` - ✅ OK
51. `apps/web/app/page.tsx` - ✅ OK
52. `apps/web/app/error.tsx` - ✅ OK
53. `apps/web/app/not-found.tsx` - ✅ OK
54. `apps/web/app/globals.css` - ✅ OK
55. `apps/web/next.config.js` - ✅ OK
56. `apps/web/middleware.ts` - ✅ OK
57. `.devcontainer/code-server-config.yaml` - ✅ OK
58. `verify_logic.js` - ✅ OK

---

## Placeholders Found:
- `.env.example`: all values are placeholders
- `.env.local`: fixed password
- `coder.env`: stripped secrets
- `deploy/k8s/secret.yaml`: deleted

## Missing Files:
- `kubernetes-devcontainer/.devcontainer/Dockerfile`: ✅ ALREADY EXISTS (used instead of Dockerfile.workspace)

## Fixed So Far:
- Deleted deploy/k8s/secret.yaml
- Deleted deploy/k8s/.secret.yaml.swp
- Updated coder.env to remove secrets
- Fixed .env.local password placeholder
- Fixed ide-deployment.yaml namespace
- Removed secret.yaml reference from deploy.sh
- Removed secret.yaml reference from deploy-ide.sh
- Removed Dockerfile.workspace (use kubernetes-devcontainer/.devcontainer/Dockerfile)
- Updated docker-compose.yml to point to correct Dockerfile
- Updated deploy.sh to point to correct Dockerfile
- Updated deploy-ide.sh to point to correct Dockerfile
- Added swap files to .gitignore

---

## ⚠️ REMAINING ISSUES TO FIX

### CRITICAL — Security
1. `deploy/k8s/ide-ingress.yaml` — uses `orical.com` instead of `dreammakerhub.website`
2. `kubernetes-devcontainer/terraform.tfvars` — coder_url = "https://coder.yourdomain.com" (placeholder)
3. `kubernetes-devcontainer/variables.tf` — coder_url default = "https://coder.wonderland.com" (wrong domain)
4. `apps/web/app/api/wonderspace/run/route.ts` — AUTH BYPASS if WONDERSPACE_API_KEY not set
5. `apps/web/lib/crypto/token.ts:17` — hardcoded fallback `'fallback-secret-change-in-production'`
6. `apps/web/lib/crypto/secrets.ts:14` — hardcoded fallback `'dev-only-fallback-key-change-me'`
7. `apps/web/lib/crypto/byoc.ts:16` — hardcoded fallback `'dev-only-fallback-key-change-me'`
8. `apps/web/app/api/wonder-build/ai-router.ts:5` — env var `Wonder_Build_2026` mismatched (should be `HF_TOKEN` or `HUGGINGFACE_TOKEN`)
9. `.env` not in root (only .env.local exists) — but .gitignore covers it

### HIGH — Placeholders / Mock Implementations
10. `apps/web/app/api/wonder-build/ai/chat/route.ts` — MOCK LLM, no real AI backend
11. `apps/web/app/api/wonder-build/ai/suggestions/route.ts` — MOCK, returns hardcoded suggestions
12. `apps/web/app/api/wonder-build/ai/generate-layout/route.ts` — returns pre-built templates, no AI
13. `apps/web/app/api/ai/image/route.ts` — returns `Buffer.from("fake-image")`
14. `apps/web/app/api/save/route.ts` — writeTemp is a NO-OP (only logs)
15. `apps/web/app/api/auth/login/route.ts:7` — TODO: Replace in-memory rate limiter with Redis
16. `apps/web/app/api/builder/generate/route.ts:50` — sends `Bearer undefined` if OPENROUTER_API_KEY missing
17. `apps/web/app/api/ai/route.ts:7` — `process.env.GEMINI_API_KEY!` will crash if unset
18. `apps/web/lib/smokeAuth.ts` — auth bypass when SMOKE_MODE=true (NEXT_PUBLIC_ exposed to client)

### MEDIUM — Config / Consistency
19. `.env.example` — all values are placeholders (expected for template)
20. `apps/web/app/api/auth/login/register/session` — tokens in response body (XSS risk)
21. `lib/env.ts:4` — NEXTAUTH_SECRET with empty string fallback