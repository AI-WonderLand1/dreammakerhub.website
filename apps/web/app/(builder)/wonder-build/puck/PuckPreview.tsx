"use client";

import { useMemo } from "react";

type PuckData = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root?: { type: string; props: Record<string, unknown> };
};

interface PuckPreviewProps {
  data: PuckData;
}

const FRAMER_STYLES = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #0a0a0f 0%, #13111c 50%, #0f0f14 100%);
    min-height: 100vh;
    color: white;
    -webkit-font-smoothing: antialiased;
  }
  
  .framer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
  }
  
  .glass-subtle {
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .violet-glow {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  }
  
  .btn-outline {
    background: transparent;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    border: 1px solid rgba(255,255,255,0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-outline:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.3);
  }
  
  .section-padding { padding: 32px 24px; }
  .section-padding-lg { padding: 64px 24px; }
  
  h1 { font-size: 3.5rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  h2 { font-size: 2.5rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; }
  h3 { font-size: 1.5rem; font-weight: 600; }
  h4 { font-size: 1.125rem; font-weight: 600; }
  
  p { line-height: 1.6; color: rgba(255,255,255,0.7); }
  
  .text-center { text-align: center; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .gap-6 { gap: 24px; }
  .gap-8 { gap: 32px; }
  
  .grid { display: grid; }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
  
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mb-8 { margin-bottom: 32px; }
  
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mt-8 { margin-top: 32px; }
  
  .py-2 { padding-top: 8px; padding-bottom: 8px; }
  .py-3 { padding-top: 12px; padding-bottom: 12px; }
  .py-4 { padding-top: 16px; padding-bottom: 16px; }
  .py-6 { padding-top: 24px; padding-bottom: 24px; }
  .py-8 { padding-top: 32px; padding-bottom: 32px; }
  .py-12 { padding-top: 48px; padding-bottom: 48px; }
  
  .px-4 { padding-left: 16px; padding-right: 16px; }
  .px-6 { padding-left: 24px; padding-right: 24px; }
  .px-8 { padding-left: 32px; padding-right: 32px; }
  
  .rounded-lg { border-radius: 8px; }
  .rounded-xl { border-radius: 12px; }
  .rounded-2xl { border-radius: 16px; }
  .rounded-full { border-radius: 9999px; }
  
  .bg-white\\/5 { background: rgba(255,255,255,0.05); }
  .bg-white\\/10 { background: rgba(255,255,255,0.1); }
  .bg-violet-600\\/20 { background: rgba(139, 92, 246, 0.2); }
  .bg-violet-500\\/20 { background: rgba(139, 92, 246, 0.15); }
  .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
  
  .border { border-width: 1px; border-style: solid; }
  .border-white\\/10 { border-color: rgba(255,255,255,0.1); }
  .border-white\\/20 { border-color: rgba(255,255,255,0.2); }
  .border-violet-500\\/30 { border-color: rgba(139, 92, 246, 0.3); }
  
  .text-white\\/60 { color: rgba(255,255,255,0.6); }
  .text-white\\/80 { color: rgba(255,255,255,0.8); }
  .text-violet-400 { color: #a78bfa; }
  
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .min-h-screen { min-height: 100vh; }
  
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  
  @media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    h1 { font-size: 2.5rem; }
    h2 { font-size: 1.75rem; }
    .section-padding-lg { padding: 48px 16px; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
  .animate-pulse { animation: pulse 2s ease-in-out infinite; }
  .animate-slideUp { animation: slideUp 0.6s ease forwards; }
  
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
</style>
`;

export function FramerPreview({ data }: PuckPreviewProps) {
  const html = useMemo(() => {
    if (!data.content || data.content.length === 0) {
      return `
        <div class="framer-container min-h-screen flex items-center justify-center">
          <div class="glass section-padding text-center" style="max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 16px;">🎨</div>
            <h3 style="margin-bottom: 12px;">Start Building</h3>
            <p>Use the AI Builder or drag components from the sidebar to create your page.</p>
          </div>
        </div>
      `;
    }

    const components = data.content.map((block, index) => {
      const props = block.props || {};
      const delay = index * 0.1;

      switch (block.type) {
        case "centerHero":
          return `
            <section class="section-padding-lg text-center" style="animation: slideUp 0.6s ease forwards; animation-delay: ${delay}s; opacity: 0;">
              <div class="glass" style="padding: 80px 40px; border-radius: 24px;">
                <h1 class="gradient-text mb-4">${props.title || 'Welcome to Your Site'}</h1>
                <p style="font-size: 1.25rem; max-width: 600px; margin: 0 auto 32px;">${props.subtitle || 'Build something amazing with our visual editor'}</p>
                <div class="flex justify-center gap-4">
                  <button class="btn-primary">Get Started</button>
                  <button class="btn-outline">Learn More</button>
                </div>
              </div>
            </section>
          `;

        case "splitHero":
          return `
            <section class="section-padding-lg">
              <div class="grid grid-2" style="gap: 48px; align-items: center;">
                <div style="animation: slideUp 0.6s ease forwards; animation-delay: ${delay}s; opacity: 0;">
                  <h1 class="gradient-text mb-4">${props.title || 'Build Amazing Things'}</h1>
                  <p style="font-size: 1.125rem; margin-bottom: 32px;">${props.subtitle || 'The modern way to create beautiful websites'}</p>
                  <button class="btn-primary">${props.ctaText || 'Get Started'}</button>
                </div>
                <div class="glass" style="padding: 32px; animation: fadeIn 0.8s ease forwards; animation-delay: ${delay + 0.2}s; opacity: 0;">
                  <div style="aspect-ratio: 16/10; border-radius: 12px; background: linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.2) 100%);"></div>
                </div>
              </div>
            </section>
          `;

        case "stickyHeader":
          return `
            <header class="glass" style="position: sticky; top: 0; z-index: 100; padding: 16px 32px;">
              <div class="flex justify-between items-center">
                <span style="font-weight: 700; font-size: 1.25rem;">${props.title || 'Brand'}</span>
                <nav class="flex gap-6">
                  <a href="#" class="text-white/60 hover:text-white transition-colors">Product</a>
                  <a href="#" class="text-white/60 hover:text-white transition-colors">Pricing</a>
                  <a href="#" class="text-white/60 hover:text-white transition-colors">About</a>
                </nav>
                <button class="btn-primary py-2 px-4 text-sm">Sign In</button>
              </div>
            </header>
          `;

        case "featureGrid":
          const features = (props.features || "Fast,Secure,Scalable").split(",");
          return `
            <section class="section-padding-lg">
              <div class="text-center mb-8" style="animation: slideUp 0.6s ease forwards;">
                <h2 class="mb-3">Features</h2>
                <p style="max-width: 500px; margin: 0 auto;">Everything you need to build modern websites</p>
              </div>
              <div class="grid grid-3">
                ${features.map((f: string, i: number) => `
                  <div class="glass glass-subtle section-padding" style="animation: slideUp 0.6s ease forwards; animation-delay: ${delay + i * 0.1}s; opacity: 0;">
                    <div class="w-full" style="width: 48px; height: 48px; background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2)); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 1.5rem;">✨</span>
                    </div>
                    <h4 class="mb-2">${f.trim()}</h4>
                    <p class="text-sm">Powerful features to help you build faster and better.</p>
                  </div>
                `).join('')}
              </div>
            </section>
          `;

        case "pricingTable":
          const plans = (props.plans || "Starter,Pro,Enterprise").split(",");
          const price = props.price || "$9/mo";
          return `
            <section class="section-padding-lg">
              <div class="text-center mb-8">
                <h2 class="mb-3">Pricing</h2>
                <p>Choose the plan that works for you</p>
              </div>
              <div class="grid grid-3" style="gap: 24px; max-width: 900px; margin: 0 auto;">
                ${plans.map((plan: string, i: number) => `
                  <div class="${i === 1 ? 'glass violet-glow' : 'glass glass-subtle'} section-padding" style="border-radius: 16px; ${i === 1 ? 'transform: scale(1.05);' : ''}">
                    <h4 class="mb-2">${plan.trim()}</h4>
                    <div class="flex items-center gap-2 mb-4">
                      <span style="font-size: 2.5rem; font-weight: 700;">${price}</span>
                      <span class="text-white/60">/month</span>
                    </div>
                    <ul class="flex flex-col gap-2 mb-6">
                      <li class="flex items-center gap-2 text-sm">
                        <span style="color: #a78bfa;">✓</span> Feature 1
                      </li>
                      <li class="flex items-center gap-2 text-sm">
                        <span style="color: #a78bfa;">✓</span> Feature 2
                      </li>
                      <li class="flex items-center gap-2 text-sm">
                        <span style="color: #a78bfa;">✓</span> Feature 3
                      </li>
                    </ul>
                    <button class="${i === 1 ? 'btn-primary' : 'btn-outline'} w-full">Choose ${plan.trim()}</button>
                  </div>
                `).join('')}
              </div>
            </section>
          `;

        case "statsSection":
          const stats = (props.stats || "Users:10K,Projects:500,Countries:50").split(";");
          return `
            <section class="section-padding-lg">
              <div class="glass section-padding" style="border-radius: 24px;">
                <div class="grid grid-3" style="gap: 32px;">
                  ${stats.map((s: string) => {
                    const [label, value] = s.split(":");
                    return `
                      <div class="text-center">
                        <div style="font-size: 3rem; font-weight: 700; background: linear-gradient(135deg, #fff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                          ${value?.trim() || '0'}
                        </div>
                        <p class="text-white/60">${label?.trim() || 'Label'}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </section>
          `;

        case "ctaBox":
          return `
            <section class="section-padding-lg">
              <div class="glass violet-glow section-padding-lg text-center" style="border-radius: 24px; max-width: 700px; margin: 0 auto;">
                <h2 class="mb-4">${props.title || 'Ready to get started?'}</h2>
                <p class="mb-6" style="max-width: 400px; margin: 0 auto 24px;">Join thousands of users building amazing websites.</p>
                <button class="btn-primary" style="font-size: 1.125rem; padding: 16px 32px;">${props.buttonText || 'Start Building Free'}</button>
              </div>
            </section>
          `;

        case "testimonialCard":
          return `
            <section class="section-padding">
              <div class="glass section-padding" style="max-width: 600px; margin: 0 auto;">
                <p style="font-size: 1.25rem; font-style: italic; margin-bottom: 24px; color: rgba(255,255,255,0.9);">"${props.quote || 'This platform has transformed how I build websites. Absolutely incredible!'}"</p>
                <div class="flex items-center gap-3">
                  <div style="width: 48px; height: 48px; background: linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5)); border-radius: 50%;"></div>
                  <div>
                    <p class="font-semibold">${props.author || 'Jane Doe'}</p>
                    <p class="text-sm text-white/60">CEO, TechCorp</p>
                  </div>
                </div>
              </div>
            </section>
          `;

        case "logoCloud":
          const companies = (props.companies || "Google,Meta,Microsoft,Amazon,Apple,Nvidia").split(",");
          return `
            <section class="section-padding">
              <p class="text-center text-white/60 text-sm mb-6">Trusted by industry leaders</p>
              <div class="flex justify-center items-center gap-8" style="flex-wrap: wrap;">
                ${companies.map((c: string) => `
                  <span style="font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.3);">${c.trim()}</span>
                `).join('')}
              </div>
            </section>
          `;

        case "multiColumnFooter":
          const columns = (props.columns || "Product,Company,Support,Legal").split(",");
          return `
            <footer class="section-padding-lg" style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 64px;">
              <div class="grid grid-4" style="gap: 32px;">
                <div>
                  <h4 class="mb-4">${props.title || 'Brand'}</h4>
                  <p class="text-sm text-white/60">Build amazing websites with our visual editor.</p>
                </div>
                ${columns.slice(1).map((col: string) => `
                  <div>
                    <h4 class="mb-3">${col.trim()}</h4>
                    <ul class="flex flex-col gap-2">
                      <li><a href="#" class="text-sm text-white/60 hover:text-white transition-colors">Link 1</a></li>
                      <li><a href="#" class="text-sm text-white/60 hover:text-white transition-colors">Link 2</a></li>
                    </ul>
                  </div>
                `).join('')}
              </div>
              <div class="text-center mt-8 pt-8" style="border-top: 1px solid rgba(255,255,255,0.1);">
                <p class="text-sm text-white/40">© 2026 Brand. All rights reserved.</p>
              </div>
            </footer>
          `;

        case "button":
          return `
            <section class="section-padding text-center">
              <button style="${props.variant || 'background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 500;'}">
                ${props.content || 'Click me'}
              </button>
            </section>
          `;

        case "input":
          return `
            <section class="section-padding">
              <div class="glass section-padding" style="max-width: 400px; margin: 0 auto;">
                ${props.label ? `<label class="block text-sm font-medium mb-2">${props.label}</label>` : ''}
                <input 
                  placeholder="${props.content || 'Enter your email...'}"
                  style="width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none;"
                />
              </div>
            </section>
          `;

        case "glassAccordion":
          return `
            <section class="section-padding">
              <div class="glass" style="border-radius: 16px; overflow: hidden;">
                <details class="group">
                  <summary class="section-padding flex justify-between items-center cursor-pointer" style="list-style: none;">
                    <span class="font-medium">${props.title || 'Click to expand'}</span>
                    <span class="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div class="section-padding pt-0 text-white/70">
                    ${props.content || 'This is the expanded content. You can add any information here.'}
                  </div>
                </details>
              </div>
            </section>
          `;

        case "tabsSystem":
          const tabs = (props.tabs || "Features,Pricing,About").split(",");
          return `
            <section class="section-padding">
              <div class="glass" style="border-radius: 16px; overflow: hidden;">
                <div class="flex" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  ${tabs.map((t: string, i: number) => `
                    <button class="flex-1 py-4 text-sm font-medium transition-colors" style="border-bottom: 2px solid ${i === 0 ? '#8b5cf6' : 'transparent'}; color: ${i === 0 ? 'white' : 'rgba(255,255,255,0.6)'};">
                      ${t.trim()}
                    </button>
                  `).join('')}
                </div>
                <div class="section-padding">
                  <p>Content for ${tabs[0]?.trim() || 'first tab'}</p>
                </div>
              </div>
            </section>
          `;

        case "teamGrid":
          const members = parseInt(props.count as string) || 4;
          return `
            <section class="section-padding-lg">
              <div class="text-center mb-8">
                <h2 class="mb-3">Our Team</h2>
                <p>Meet the people behind the product</p>
              </div>
              <div class="grid grid-4">
                ${Array.from({ length: members }).map((_, i) => `
                  <div class="glass glass-subtle section-padding text-center">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2)); border-radius: 50%; margin: 0 auto 16px;"></div>
                    <h4>Team Member ${i + 1}</h4>
                    <p class="text-sm text-white/60">Role</p>
                  </div>
                `).join('')}
              </div>
            </section>
          `;

        case "blogPreviewGrid":
          const posts = parseInt(props.count as string) || 3;
          return `
            <section class="section-padding-lg">
              <div class="text-center mb-8">
                <h2 class="mb-3">Latest Updates</h2>
                <p>What's new and exciting</p>
              </div>
              <div class="grid grid-3">
                ${Array.from({ length: posts }).map((_, i) => `
                  <div class="glass glass-subtle" style="border-radius: 16px; overflow: hidden;">
                    <div style="height: 160px; background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1));"></div>
                    <div class="section-padding">
                      <h4 class="mb-2">Blog Post ${i + 1}</h4>
                      <p class="text-sm text-white/60">Read more about this exciting update...</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          `;

        case "newsletterStrip":
          return `
            <section class="section-padding">
              <div class="glass violet-glow section-padding flex justify-between items-center" style="border-radius: 16px; flex-wrap: wrap; gap: 16px;">
                <div>
                  <h4 class="mb-1">${props.title || 'Subscribe to our newsletter'}</h4>
                  <p class="text-sm text-white/60">Get the latest updates straight to your inbox</p>
                </div>
                <div class="flex gap-2">
                  <input placeholder="Enter email" style="padding: 10px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;" />
                  <button class="btn-primary py-2 px-4">Subscribe</button>
                </div>
              </div>
            </section>
          `;

        case "contactSplit":
          return `
            <section class="section-padding-lg">
              <div class="grid grid-2" style="gap: 48px; align-items: start;">
                <div>
                  <h2 class="mb-4">${props.title || 'Get in Touch'}</h2>
                  <p class="mb-6">We'd love to hear from you. Send us a message!</p>
                  <div class="flex flex-col gap-4">
                    <input placeholder="Name" style="padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;" />
                    <input placeholder="Email" style="padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;" />
                    <textarea placeholder="Message" rows="4" style="padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; resize: none;"></textarea>
                    <button class="btn-primary">Send Message</button>
                  </div>
                </div>
                <div class="glass section-padding" style="border-radius: 16px; min-height: 300px;">
                  <p class="text-white/40 text-center">Contact info would go here</p>
                </div>
              </div>
            </section>
          `;

        case "heading":
          return `
            <section class="section-padding">
              <h2 class="${props.level || 'text-3xl font-semibold'}">${props.content || 'Heading'}</h2>
            </section>
          `;

        case "typography":
          return `
            <section class="section-padding">
              <p>${props.content || 'Your text content goes here.'}</p>
            </section>
          `;

        case "cardHover":
          return `
            <section class="section-padding">
              <div class="glass section-padding" style="transition: all 0.3s ease; cursor: pointer;">
                <h4 class="mb-2">${props.title || 'Card Title'}</h4>
                <p class="text-sm">${props.description || 'Description goes here'}</p>
              </div>
            </section>
          `;

        case "videoPlayer":
          return `
            <section class="section-padding">
              <div class="glass" style="aspect-ratio: 16/9; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <div class="text-center">
                  <div style="font-size: 3rem; margin-bottom: 8px;">▶</div>
                  <p class="text-white/60">${props.src ? props.src : 'Add your video URL'}</p>
                </div>
              </div>
            </section>
          `;

        case "glitchText":
          return `
            <section class="section-padding text-center">
              <div style="position: relative; display: inline-block;">
                <span style="font-size: 4rem; font-weight: 700;">${props.text || 'GLITCH'}</span>
              </div>
            </section>
          `;

        case "typewriterHero":
          return `
            <section class="section-padding-lg text-center">
              <h1 style="font-size: 3rem;">${props.text || 'Typewriter Effect'}<span class="animate-pulse">|</span></h1>
            </section>
          `;

        case "glassmorphicHero":
          return `
            <section class="section-padding-lg">
              <div class="glass" style="padding: 80px 40px; border-radius: 24px; position: relative; overflow: hidden;">
                <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);"></div>
                <div style="position: relative;">
                  <h1 class="text-center mb-4">${props.title || 'Glassmorphic'}</h1>
                  <p class="text-center" style="max-width: 500px; margin: 0 auto;">${props.subtitle || 'Beautiful glass effect'}</p>
                </div>
              </div>
            </section>
          `;

        default:
          return `
            <section class="section-padding">
              <div class="glass section-padding text-center">
                <p class="text-white/50">Component: ${block.type}</p>
              </div>
            </section>
          `;
      }
    });

    return FRAMER_STYLES + `<div class="framer-container">${components.join('\n')}</div>`;
  }, [data]);

  return (
    <iframe
      srcDoc={html}
      className="w-full h-full border-0"
      sandbox="allow-same-origin"
      style={{ background: "#0a0a0f" }}
    />
  );
}

export function PuckPreview({ data }: PuckPreviewProps) {
  return <FramerPreview data={data} />;
}

export function PuckRawPreview({ data }: PuckPreviewProps) {
  return (
    <div className="w-full h-full overflow-auto p-4">
      <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}