# `(marketing)` Route-Group Migration Checklist

This checklist documents the explicit, file-by-file migration from `apps/web/app/(marketing)/`.

## Source file inventory

- [x] `apps/web/app/(marketing)/page.tsx` → `apps/web/app/page.tsx`
- [x] `apps/web/app/(marketing)/homepage-links.ts` → `apps/web/app/homepage-links.ts`
- [x] `apps/web/app/(marketing)/homepage-sign-map.json` → `apps/web/app/homepage-sign-map.json`
- [x] `apps/web/app/(marketing)/homepage-links.test.ts` → `apps/web/app/homepage-links.test.ts`
- [x] `apps/web/app/(marketing)/layout.tsx` → merged deliberately into `apps/web/app/layout.tsx` (no silent overwrite)

## Migration order executed

1. Moved homepage-specific files first (`page.tsx`, `homepage-links.ts`, `homepage-sign-map.json`).
2. Updated test imports and route assertions (`homepage-links.test.ts`).
3. Resolved layout behavior manually in root layout (`app/layout.tsx`).
4. Deleted `apps/web/app/(marketing)/` only after routes and tests were verified.

## Verification

- `vitest run apps/web/app/homepage-links.test.ts` passes with route-existence coverage.
