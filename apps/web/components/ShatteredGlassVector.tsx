/**
 * Scalable, transparent SVG crack network for the shared site footer.
 *
 * Pure decoration: no raster image, scripts, pointer capture, or animation.
 * All fills are low-opacity so the page's background remains visible.
 */
export default function ShatteredGlassVector() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 340"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="glass-footer-facet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f8ff" stopOpacity="0.2" />
          <stop offset="0.48" stopColor="#7dd3fc" stopOpacity="0.045" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.11" />
        </linearGradient>
        <linearGradient id="glass-footer-crack" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bae6fd" stopOpacity="0.06" />
          <stop offset="0.35" stopColor="#f0f9ff" stopOpacity="0.38" />
          <stop offset="0.78" stopColor="#c4b5fd" stopOpacity="0.3" />
          <stop offset="1" stopColor="#e0f2fe" stopOpacity="0.07" />
        </linearGradient>
        <radialGradient id="glass-footer-impact">
          <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.12" />
          <stop offset="0.55" stopColor="#a5f3fc" stopOpacity="0.035" />
          <stop offset="1" stopColor="#a5f3fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Transparent prisms: background is still visible through every shard. */}
      <g fill="url(#glass-footer-facet)" stroke="none">
        <path d="M0 0H340L258 102L0 168Z" opacity="0.24" />
        <path d="M0 168L258 102L330 230L128 340H0Z" opacity="0.35" />
        <path d="M258 102L485 0L620 88L330 230Z" opacity="0.28" />
        <path d="M330 230L620 88L714 340H128Z" opacity="0.13" />
        <path d="M620 88L790 0L938 112L714 340Z" opacity="0.19" />
        <path d="M790 0H1112L1020 56L938 112Z" opacity="0.27" />
        <path d="M938 112L1020 56L1142 18L1242 96L1080 218Z" opacity="0.39" />
        <path d="M938 112L1080 218L1016 340H714Z" opacity="0.24" />
        <path d="M1080 218L1242 96L1440 0V190L1270 340H1016Z" opacity="0.21" />
        <path d="M1242 96L1440 0V190L1360 162Z" opacity="0.33" />
        <path d="M1270 340L1360 162L1440 190V340Z" opacity="0.15" />
      </g>

      {/* A pair of impact points and branching vector fracture lines. */}
      <circle cx="952" cy="124" r="230" fill="url(#glass-footer-impact)" />
      <circle cx="274" cy="234" r="150" fill="url(#glass-footer-impact)" />
      <g fill="none" stroke="url(#glass-footer-crack)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        <path d="M952 124L910 82L838 68L790 0" />
        <path d="M910 82L890 15L852 -18" />
        <path d="M952 124L980 64L1020 56L1050 0" />
        <path d="M980 64L986 16L973 -20" />
        <path d="M952 124L1034 103L1142 18L1180 -20" />
        <path d="M1034 103L1113 122L1242 96L1440 0" />
        <path d="M1113 122L1186 172L1360 162L1440 190" />
        <path d="M952 124L1014 183L1080 218L1270 340" />
        <path d="M1014 183L988 272L1016 340" />
        <path d="M952 124L909 205L847 255L830 340" />
        <path d="M909 205L943 276L928 340" />
        <path d="M952 124L850 134L749 108L620 88L485 0" />
        <path d="M850 134L803 197L714 340" />
        <path d="M749 108L729 36L695 0" />
        <path d="M952 124L903 155L938 112" />

        <path d="M274 234L258 102L340 0" />
        <path d="M258 102L195 78L92 0" />
        <path d="M274 234L155 191L0 168" />
        <path d="M155 191L88 249L0 277" />
        <path d="M274 234L330 230L485 0" />
        <path d="M330 230L412 288L495 340" />
        <path d="M274 234L220 300L128 340" />
        <path d="M274 234L295 315L307 340" />
        <path d="M274 234L337 179L375 137" />
      </g>

      {/* Sharper highlights catch the 'glass edge' without hiding text. */}
      <g fill="none" stroke="#f0f9ff" strokeOpacity="0.33" strokeWidth="0.65" strokeLinecap="round">
        <path d="M952 124L1034 103L1142 18" />
        <path d="M952 124L909 205L847 255" />
        <path d="M274 234L258 102L340 0" />
        <path d="M274 234L330 230L412 288" />
      </g>
      <g fill="#effaff" fillOpacity="0.48">
        <circle cx="952" cy="124" r="2.5" />
        <circle cx="274" cy="234" r="1.8" />
        <circle cx="910" cy="82" r="1.3" />
        <circle cx="1113" cy="122" r="1.4" />
      </g>
    </svg>
  );
}
