export interface GeneratedContent {
  message: string;
  html: string;
  css: string;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], hash: number, offset: number): T {
  return items[(hash + offset) % items.length];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const HERO_TITLES = [
  'Launch your product with confidence',
  'Build something extraordinary today',
  'Turn your vision into reality',
  'Ship faster, scale smarter',
];

const HERO_SUBTITLES = [
  'A polished, responsive experience designed for your audience.',
  'Structured sections, strong typography, and clear calls to action.',
  'AI-generated layouts with reliable visual hierarchy.',
];

const FEATURE_SETS = [
  ['Responsive Design', 'Lightning Fast', 'SEO Optimized'],
  ['Modern Stack', 'Clean Code', 'Production Ready'],
  ['Mobile First', 'Accessible', 'Scalable Architecture'],
];

const CTA_LABELS = ['Get Started', 'Learn More', 'See Demo', 'Start Free'];

export class WonderBuildEngine {
  async generateLayout(prompt: string): Promise<GeneratedContent> {
    const safe = prompt.trim().replace(/\n/g, ' ');
    const lower = safe.toLowerCase();
    const hash = stableHash(lower || 'wonder-build');

    const heroTitle = `${pick(HERO_TITLES, hash, 1)} — ${safe.slice(0, 40) || 'Your Project'}`;
    const heroSub = pick(HERO_SUBTITLES, hash, 3);
    const features = pick(FEATURE_SETS, hash, 5);
    const ctaLabel = pick(CTA_LABELS, hash, 7);
    const accent = pick(['#22d3ee', '#a855f7', '#fb7185', '#34d399'], hash, 11);

    const sections: string[] = [];

    sections.push(`
      <section class="wb-hero">
        <div class="wb-container">
          <h1 class="wb-hero-title">${escapeHtml(heroTitle)}</h1>
          <p class="wb-hero-sub">${escapeHtml(heroSub)}</p>
          <div class="wb-hero-actions">
            <a href="/wonder-build/ai-builder" class="wb-btn wb-btn-primary">${escapeHtml(ctaLabel)}</a>
            <a href="/docs" class="wb-btn wb-btn-secondary">Documentation</a>
          </div>
        </div>
      </section>`);

    sections.push(`
      <section class="wb-features">
        <div class="wb-container">
          <h2 class="wb-section-heading">Core Capabilities</h2>
          <div class="wb-feature-grid">
            ${features.map((f) => `
            <div class="wb-feature-card">
              <h3>${escapeHtml(f)}</h3>
              <p>Built with care to deliver results you can count on.</p>
            </div>`).join('')}
          </div>
        </div>
      </section>`);

    if (lower.includes('pricing') || lower.includes('plan')) {
      sections.push(`
      <section class="wb-pricing">
        <div class="wb-container">
          <h2 class="wb-section-heading">Simple Pricing</h2>
          <div class="wb-pricing-grid">
            <div class="wb-pricing-card">
              <h3>Free</h3>
              <div class="wb-price">$0<span>/mo</span></div>
              <ul><li>1 project</li><li>Community support</li></ul>
              <a href="/wonder-build/ai-builder" class="wb-btn wb-btn-outline">Start Free</a>
            </div>
            <div class="wb-pricing-card wb-pricing-featured">
              <h3>Pro</h3>
              <div class="wb-price">$29<span>/mo</span></div>
              <ul><li>Unlimited projects</li><li>Priority support</li><li>Custom domains</li></ul>
              <a href="/wonder-build/ai-builder" class="wb-btn wb-btn-primary">Go Pro</a>
            </div>
          </div>
        </div>
      </section>`);
    }

    if (lower.includes('contact') || lower.includes('form')) {
      sections.push(`
      <section class="wb-contact">
        <div class="wb-container">
          <h2 class="wb-section-heading">Get in Touch</h2>
          <form class="wb-contact-form">
            <input type="text" placeholder="Your name" required />
            <input type="email" placeholder="Email address" required />
            <textarea placeholder="Tell us about your project" rows="4"></textarea>
            <button type="submit" class="wb-btn wb-btn-primary">Send Message</button>
          </form>
        </div>
      </section>`);
    }

    sections.push(`
      <footer class="wb-footer">
        <div class="wb-container">
          <p>&copy; ${new Date().getFullYear()} Your Project. All rights reserved.</p>
          <div class="wb-footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>`);

    const html = `<div class="wb-page">${sections.join('\n')}</div>`;

    const css = `
.wb-page { font-family: Inter, system-ui, -apple-system, sans-serif; color: #f8fafc; background: #0b0b10; line-height: 1.6; }
.wb-container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
.wb-hero { padding: 5rem 0 4rem; text-align: center; }
.wb-hero-title { font-size: 3rem; font-weight: 800; line-height: 1.15; margin-bottom: 1rem; letter-spacing: -0.02em; }
.wb-hero-sub { font-size: 1.2rem; color: #94a3b8; max-width: 600px; margin: 0 auto 2rem; }
.wb-hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.wb-btn { display: inline-block; padding: 0.75rem 1.75rem; border-radius: 8px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.wb-btn-primary { background: ${accent}; color: #0b0b10; }
.wb-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.wb-btn-secondary { border: 1px solid rgba(255,255,255,0.2); color: #f8fafc; }
.wb-btn-secondary:hover { border-color: ${accent}; color: ${accent}; }
.wb-btn-outline { border: 1px solid rgba(255,255,255,0.2); color: #f8fafc; background: transparent; }
.wb-section-heading { font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 2.5rem; }
.wb-features { padding: 4rem 0; }
.wb-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.wb-feature-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; }
.wb-feature-card h3 { font-size: 1.15rem; margin-bottom: 0.5rem; }
.wb-feature-card p { color: #94a3b8; font-size: 0.95rem; }
.wb-pricing { padding: 4rem 0; }
.wb-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 700px; margin: 0 auto; }
.wb-pricing-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; text-align: center; }
.wb-pricing-featured { border-color: ${accent}; }
.wb-price { font-size: 2.5rem; font-weight: 800; margin: 1rem 0; }
.wb-price span { font-size: 1rem; font-weight: 400; color: #94a3b8; }
.wb-pricing-card ul { list-style: none; padding: 0; margin: 1.5rem 0; text-align: left; }
.wb-pricing-card li { padding: 0.4rem 0; color: #cbd5e1; }
.wb-pricing-card li::before { content: "��✓ "; color: ${accent}; }
.wb-contact { padding: 4rem 0; }
.wb-contact-form { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
.wb-contact-form input, .wb-contact-form textarea { background: #111118; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.75rem 1rem; color: #f8fafc; font-size: 1rem; font-family: inherit; }
.wb-contact-form input:focus, .wb-contact-form textarea:focus { outline: none; border-color: ${accent}; }
.wb-footer { padding: 2rem 0; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; color: #64748b; font-size: 0.9rem; }
.wb-footer-links { margin-top: 0.5rem; display: flex; gap: 1.5rem; justify-content: center; }
.wb-footer-links a { color: #94a3b8; text-decoration: none; }
.wb-footer-links a:hover { color: ${accent}; }
@media (max-width: 768px) { .wb-hero-title { font-size: 2rem; } .wb-hero { padding: 3rem 0 2rem; } }`;

    return { message: 'Generated layout', html, css };
  }
}

