# Homepage visual direction

Source of truth for the current homepage pass:

- The top of the homepage uses the existing `/images/hero-victorized-bg.webp` landscape as a fixed scene.
- The hero is treated as night with dark violet/cyan overlays.
- Lower homepage sections use translucent sky/white/warm overlays so the same fixed landscape reads progressively more like daylight instead of switching to a flat white background.
- The About mega-menu in `apps/web/components/Navbar.tsx` remains part of the homepage navigation.
- Pricing uses the existing configured plan data and comparison table.

This note exists to prevent later homepage cleanup from accidentally replacing the continuous scene with unrelated section backgrounds.
