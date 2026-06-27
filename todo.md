# TODO: Route Bug & Code Quality Fixes (Extended)

## Issues Found (Expanded)

### 1. Routing/Navigation Bug (Homepage)
- **Symptom**: Homepage may not load or show blank page; redirects fail silently.
- **Root Cause**:
  - `apps/web/app/page.tsx` uses `redirect('/homepage')` but the target route may be misconfigured or missing.
  - `InteractiveSignpost.tsx` hero mode uses `window.location.href` causing full page reloads instead of Next.js client-side navigation.
  - Signpost `href` values need verification against actual route files (e.g., `/wonder-build/playcanvas` must exist as a page).
  - Authentication state handling in `Navbar.tsx` may cause flicker when toggling between authenticated/unauthenticated UI.

### 2. Code Quality & Dependency Issues
- **Dependency Conflict**: 
  - `@types/pg@8.20.0` is required by some packages but `mem0ai@3.0.10` expects `@types/pg@8.11.0`.
  - Multiple `package.json` files in `.opencode/node_modules/` cause version mismatches.
- **Missing Linting/Formatting**: 
  - Some packages lack `.eslintrc` or `prettier.config.js`, leading to inconsistent code style.
- **Bloat in Production Assets**: 
  - Unoptimized images and large dependency trees increase bundle size.

### 3. Authentication State Handling
- Navbar shows login/register links when `user` is null, but rapid state changes cause UI flicker.
- Redirects after signout/in may not preserve intended destination, causing login loops.

---

## Solutions (Expanded)

### Routing Fixes
1. **Verify Homepage Component**  
   - Ensure `/apps/web/app/homepage/Homepage.tsx` exists and exports a default component:  
     ```tsx
     // apps/web/app/homepage/Homepage.tsx
     export default function Homepage() {
       return <div>Homepage Content</div>;
     }
     ```
2. **Fix Root Page Redirect**  
   - Confirm `apps/web/app/page.tsx` correctly redirects to `/homepage`:  
     ```tsx
     import { redirect } from 'next/navigation';
     export default function Page() {
       redirect('/homepage');
     }
     ```
   - Verify `/apps/web/app/homepage/page.tsx` renders the Homepage component.
3. **Update InteractiveSignpost**  
   - Replace `window.location.href` with Next.js routing for hero-mode navigation:  
     ```tsx
     const router = useRouter();
     <Link href={sign.href} onClick={() => router.push(sign.href)} ...>
       {sign.destination}
     </Link>
     ```
4. **Validate All Signpost hrefs**  
   - Confirm each signpost target exists as a route file:  
     ```bash
     # Verify these files exist:
     apps/web/app/(builder)/wonder-build/playcanvas/page.tsx
     apps/web/app/(builder)/wonder-build/spatial/page.tsx
     apps/web/app/(builder)/wonder-build/agent/page.tsx
     apps/web/app/(builder)/wonder-build/ai-builder/page.tsx
     apps/web/app/(public)/about/page.tsx
     apps/web/app/(public)/contact/page.tsx
     ```
5. **Improve Navbar Authentication State**  
   - Eliminate flicker by deriving `showPublicNav` purely from authentication state:  
     ```tsx
     const showPublicNav = !user;          // hide nav when logged in
     const showDashboardNav = !!user;      // show dashboard when logged in
     ```
   - Add a loading state to prevent UI transitions during auth checks.

### Code Quality Fixes
1. **Resolve Dependency Conflict**  
   - **Option A (Preferred)**: Downgrade `@types/pg` to `8.11.0`  
     ```bash
     npm install "@types/pg@8.11.0"
     ```
   - **Option B**: Remove `mem0ai` if not required by the current project.  
     ```bash
     npm uninstall mem0ai
     ```
   - After fixing, run `npm install` and verify `npm run build` succeeds.
2. **Clean Up `.opencode/node_modules/`**  
   - Add `.opencode/` to `.gitignore` to prevent committing node_modules.  
   - Remove stale modules and reinstall:  
     ```bash
     rm -rf .opencode/node_modules
     npm install
     ```
3. **Add Linting/Prettier Configuration**  
   - Create `.eslintrc.json` in root:  
     ```json
     {
       "extends": "next/core-web-vitals",
       "rule": {
         "react/react-in-jsx-scope": "off"
       }
     }
     ```
   - Add `prettier.config.js` with your preferred settings.  
   - Install dev dependencies:  
     ```bash
     npm install -D eslint prettier eslint-config-next eslint-plugin-next
     ```
4. **Audit & Reduce Bloat**  
   - Run `npm ls` to identify unnecessary dependencies.  
   - Remove unused packages:  
     ```bash
     npm uninstall <package-name>
     ```

### Authentication & UX Improvements
1. **Add Loading State UI**  
   - Show a spinner or placeholder while auth resolves:  
     ```tsx
     {isLoading ? <CircularProgress /> : <LoginButtons />}
     ```
2. **Persist Intended Redirect**  
   - Store the last visited URL in state/localStorage and restore after login:  
     ```tsx
     const redirectUrl = typeof window !== 'undefined' ? window.localStorage.getItem('redirectUrl') || '/dashboard' : '/dashboard';
     ```
3. **Use Next.js `useRouter()`**  
   - Replace any `window.location.href` calls with `router.push()` for client‑side navigation.

---

## Testing Checklist (Enhanced)

- [ ] **Home Page Loading**  
  - Verify `http://localhost:3000/` loads without redirect errors.  
  - Confirm `redirect('/homepage')` sends users to `/homepage` and renders the Homepage component.  

- [ ] **Signpost Navigation**  
  - Click each signpost on the homepage and ensure the destination route loads correctly.  
  - Test both desktop and mobile interactions (hover vs. tap).  

- [ ] **Navbar Behavior**  
  - Verify login/logout buttons appear/disappear correctly based on auth state.  
  - Simulate rapid auth state changes (e.g., mock `user` toggle) to check for flicker.  

- [ ] **Route Validation**  
  - Run a script to verify all signpost `href`s match existing route files:  
    ```bash
    grep -R "href=" apps/web/app/**/*.tsx | grep -E "/wonder-build|/wonderspace|/dashboard" | wc -l
    ```
  - Ensure no 404 responses in the Network tab.  

- [ ] **Linting & Build**  
  - `npm run lint` should return zero errors.  
  - `npm run build` should complete without dependency conflicts.  

- [ ] **Dependency Audit**  
  - `npm audit` should report no high‑severity vulnerabilities.  
  - `npm outdated` should list only packages you intend to upgrade.  

- [ ] **Accessibility**  
  - Verify all links have descriptive `aria-label`s.  
  - Test keyboard navigation for dropdown menus.  

---

## Estimated Effort (Re‑estimated)

- **Dependency Conflict Resolution**: 15–30 min  
- **Routing & Homepage Fixes**: 30–45 min  
- **Navigation State Improvements**: 15 min  
- **Linting/Prettier Setup**: 20 min  
- **Testing & Verification**: 30 min  

Total: **≈ 2 hours** (including buffer for unexpected issues).

---

### Next Steps

- Implement the **routing fixes** first (verify homepage component & redirect).  
- Apply the **dependency resolution** (downgrade `@types/pg` or remove `mem0ai`).  
- Add **linting/config files** and run the linter.  
- Run the **full testing checklist** to confirm everything works end‑to‑end.  

Let me know if you want me to start executing any of these steps (e.g., editing `page.tsx`, writing the missing Homepage component, or running the dependency fix). 🚀