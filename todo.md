# TODO: Route Bug & Code Quality Fixes

## Issues Found

### 1. Routing/Navigation Bug (Homepage)
- **Symptom**: Homepage may not load or show blank page.
- **Root Cause**:
  - `apps/web/app/page.tsx` redirects to `/homepage` but component may be missing or misimported.
  - Dependency conflict blocks build.
  - `InteractiveSignpost.tsx` hero mode uses `window.location.href` instead of Next.js router.
  - Signpost href values need validation against actual route definitions.

### 2. Code Quality & Dependency Issues
- Multiple `package.json` files in `.opencode/node_modules/` (risk of version conflicts).
- Version mismatch: `@types/pg@8.20.0` vs `mem0ai@3.0.10` requiring `@types/pg@8.11.0`.
- Missing ESLint/Prettier configuration in some packages.
- Potential bloated dependencies in production assets.

### 3. Authentication State Handling
- Navbar shows login/register links when `user` is null, but may flash incorrectly during auth loading.
- Redirects after signout/in may not preserve intended destination.

## Solutions

### Routing Fixes
1. **Verify Homepage Component**  
   Ensure `/apps/web/app/homepage/Homepage.tsx` exists and exports a default component.
2. **Fix Root Page Redirect**  
   Confirm `apps/web/app/page.tsx` correctly redirects to `/homepage`:
   ```tsx
   import { redirect } from 'next/navigation';
   export default function Page() {
     redirect('/homepage');
   }
   ```
3. **Update InteractiveSignpost**  
   Replace `window.location.href` with Next.js `Link` or `router.push`:
   ```tsx
   const router = useRouter();
   <Link href={sign.href} onClick={() => router.push(sign.href)} ... />
   ```
4. **Validate All Signpost hrefs**  
   Ensure paths in `InteractiveSignpost.tsx` match actual routes:
   - `/docs`, `/tutorials`, `/community`, `/features`, `/wonder-build/playcanvas`, `/wonderspace`, `/dashboard`

### Code Quality Fixes
1. **Fix Dependency Conflict**  
   Choose one option:
   - **Option A**: Downgrade `@types/pg` to `8.11.0`:
     ```bash
     npm install "@types/pg@8.11.0"
     ```
   - **Option B**: Remove `mem0ai` if unused:
     ```bash
     npm uninstall mem0ai
     ```
2. **Clean Up `.opencode/node_modules/`**  
   - Add `.opencode/` to `.gitignore` if not present.
   - Run `rm -rf .opencode/node_modules` and reinstall dependencies.
3. **Add ESLint/Prettier config** to packages missing it.
4. **Run dependency audit**:
   ```bash
   npm audit
   npm outdated
   ```

### Authentication & UX Improvements
1. **Add loading state UI** in Navbar.
2. **Persist intended redirect** after login.
3. **Use Next.js `useRouter()`** for programmatic navigation.

## Testing Checklist
- [ ] Homepage loads at `/` and `/homepage`.
- [ ] Navigation from homepage signposts to each destination works.
- [ ] Navbar links function for both logged-in and logged-out states.
- [ ] Login/logout flow preserves intended destination.
- [ ] Run `npm install` and `npm run build` with no errors.
- [ ] Run `npm run lint` and fix all errors.

## Estimated Effort
- Dependency fixes: 30 minutes
- Routing fixes: 1 hour
- Testing: 1 hour