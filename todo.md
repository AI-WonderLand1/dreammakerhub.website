# TODO: Route Bug & Code Quality Fixes

## Issues Found

### 1. Routing/Navigation Bug (Homepage)
- **Symptom**: Routes like `/wonderspace` or `/wonder-build` may 404 or misbehave.
- **Root Cause**:
  - `apps/web/app/page.tsx` does a hard redirect to `/homepage` (commented out but may still cause issues).
  - `Navbar.tsx` condition `showPublicNav = !isAppPath && !user` incorrectly hides public nav on app paths even when unauthenticated.
  - `InteractiveSignpost.tsx` hero mode uses `onClick` + `window.location.href` which may bypass Next.js routing.
  - Signpost href values need verification against actual route definitions.

### 2. Code Quality & Dependency Issues
- Multiple `package.json` files in `.opencode/node_modules/` (risk of version conflicts).
- Zod version mismatches (v3/v4) observed in node_modules.
- Missing ESLint/Prettier configuration in some packages.
- Potential bloated dependencies in production assets.

### 3. Authentication State Handling
- Navbar shows login/register links when `user` is null, but may flash incorrectly during auth loading.
- Redirects after signout/in may not preserve intended destination.

## Solutions

### Routing Fixes
1. **Replace redirect in `app/page.tsx`** with a proper redirect or remove if `/homepage` is the intended landing page.
   - Ensure `/homepage/page.tsx` exists and renders the `Homepage` component.
2. **Simplify Navbar public nav condition**:
   ```tsx
   const showPublicNav = !user; // Show when not logged in
   const showDashboardNav = !!user; // Show when logged in
   ```
3. **Update InteractiveSignpost hero mode** to use Next.js `Link` and `router.push` for client-side navigation.
4. **Validate all signpost hrefs** against actual routes in `apps/web/app/`:
   - `/docs`, `/tutorials`, `/community`, `/features`, `/wonder-build/playcanvas`, `/wonderspace`, `/dashboard`
   - Ensure corresponding `page.tsx` files exist.
5. **Add fallback handling** for missing routes (custom 404 page).

### Code Quality Fixes
1. **Clean up `.opencode/node_modules/`** – this folder should not be committed; likely caused by running `npm install` in wrong directory.
   - Add `.opencode/` to `.gitignore` if not present.
   - Run `rm -rf .opencode/node_modules` and reinstall opencode dependencies in correct location.
2. **Align Zod versions** – upgrade all packages to use Zod v4 (or lock to v3 if required).
   - Check each `package.json` for `"zod"` dependency and unify version.
3. **Add ESLint/Prettier config** to packages missing it (especially `apps/web`, `packages/*`).
   - Use existing config from root as base.
4. **Run dependency audit**:
   ```bash
   npm audit
   npm outdated
   ```
   - Fix high/severe vulnerabilities.
5. **Implement linting script** in root `package.json`:
   ```json
   "scripts": {
     "lint": "eslint . --ext .ts,.tsx",
     "format": "prettier --write ."
   }
   ```

### Authentication & UX Improvements
1. **Add loading state UI** in Navbar to prevent flashing auth links.
2. **Persist intended redirect** after login (e.g., store `router.asPath` in state/localStorage).
3. **Use Next.js `useRouter()`** for programmatic navigation instead of `window.location.href`.

## Testing Checklist
- [ ] Verify homepage loads at `/` and `/homepage`.
- [ ] Test navigation from homepage signposts to each destination.
- [ ] Test navbar links for both logged-in and logged-out states.
- [ ] Test login/logout flow preserves intended destination.
- [ ] Run `npm run lint` and fix all errors.
- [ ] Run `npm test` (if applicable) and ensure passing.
- [ ] Build production bundle: `npm run build` and check for errors.

## Estimated Effort
- Routing fixes: 1-2 hours
- Dependency cleanup: 1 hour
- Linting/setup: 30 minutes
- Testing: 1 hour