# Fixes Applied 2026-04-26

## Summary
Build was failing due to missing dependencies and config issues. Fixed:

### 1. Removed Nextra (docs framework not used)
- Removed `nextra` and `nextra-theme-docs` from dependencies
- Updated `next.config.js` to remove nextra import

### 2. Fixed TypeScript Config
- Changed `ignoreDeprecations` from array to string: `"6.0"` (was `["6.0"]`)
- Files: `tsconfig.base.json`, `apps/web/tsconfig.json`

### 3. Updated Next.js Config
- Added `turbopack: {}` to prevent build error
- Added webpack config for code splitting

### 4. Removed Platform-Specific Dependencies
- Added `"@next/swc-linux-x64-gnu": false` override for ARM machines

## For GitHub Codespace
Run these commands:
```bash
npm install
cd apps/web && npm run build
```

Or with turbopack (faster):
```bash
cd apps/web && npm run build -- --turbopack
```

## For Local/Oracle Build
If disk space is low (5GB volume), clean first:
```bash
rm -rf node_modules
npm install
npm run build
```

## Issues Still Present
- Need more disk space for build (~8-10GB needed)
- Oracle volume /home may need expansion