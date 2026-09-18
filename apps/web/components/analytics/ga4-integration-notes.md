# GA4 verification

- Measurement ID: `G-Z704LCGF3P` (public identifier, not a secret).
- The global analytics component loads `gtag.js` once alongside the existing Amplitude SDK.
- Next.js CSP explicitly allows Google's tag script and GA4 collection requests.
- After deployment, open DreamMakerHub in a normal browser and use GA4 **Reports → Realtime** to check that a visit appears. Browsers with tracking blockers may not send data.
- Do not add the same GA4 tag separately through Google Tag Manager or another app; duplicate installation can double-count page views.
- Ensure the site's privacy notice and consent handling match the analytics you actually deploy. The existing Amplitude session-replay configuration remains unchanged by this PR.
