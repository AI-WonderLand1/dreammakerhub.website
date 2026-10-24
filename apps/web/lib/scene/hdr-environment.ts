/** Validates an HDR equirectangular texture URL before passing it to PlayCanvas. */
export function normalizeHdrEnvironmentUrl(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 2048) return null;
  try {
    // Relative paths are for HDR assets served from this application. Refuse
    // protocol-relative paths so they cannot bypass the HTTPS requirement.
    if (value.startsWith("/") && !value.startsWith("//")) {
      const url = new URL(value, "https://wonderplay.invalid");
      return /^\/[^/]/.test(url.pathname) && /\.hdr$/i.test(url.pathname) && !url.search && !url.hash
        ? url.pathname
        : null;
    }
    const url = new URL(value);
    // Never persist signed/CDN authorization query parameters in saved levels.
    // The site's existing Content Security Policy allows Supabase Storage,
    // not arbitrary HTTPS hosts. Keep HDR sources inside that trust boundary.
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") &&
      !url.username && !url.password && !url.search && !url.hash && /\.hdr$/i.test(url.pathname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
