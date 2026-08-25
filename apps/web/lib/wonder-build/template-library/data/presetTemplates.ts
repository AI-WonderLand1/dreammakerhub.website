import { WonderBuildTemplate } from '../types';

export const INITIAL_PRESET_TEMPLATES: WonderBuildTemplate[] = [
  // BATCH 1: SaaS (6)
  {
    id: 'template_saas_minimal_landing_01',
    name: 'PulseFlow Minimal SaaS',
    description: 'Clean, focused SaaS landing page with high-contrast typography, product preview, and fast lead conversion.',
    category: 'SaaS',
    variant: 'minimal landing',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        },
        children: [
          {
            type: 'heading',
            content: 'PulseFlow AI',
            styles: { fontSize: '20px', fontWeight: '700', color: '#0f172a' },
          },
          {
            type: 'div',
            styles: { display: 'flex', gap: '20px', alignItems: 'center' },
            children: [
              { type: 'text', content: 'Features', styles: { color: '#475569', fontSize: '14px', cursor: 'pointer' } },
              { type: 'text', content: 'Pricing', styles: { color: '#475569', fontSize: '14px', cursor: 'pointer' } },
              {
                type: 'button',
                content: 'Start Free Trial',
                styles: {
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: {
          padding: '80px 20px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        },
        children: [
          {
            type: 'heading',
            content: 'Automate your revenue operations in real-time',
            styles: { fontSize: '42px', fontWeight: '800', color: '#0f172a', maxWidth: '800px', lineHeight: '1.2' },
          },
          {
            type: 'text',
            content: 'PulseFlow syncs customer data, subscription billing, and churn alerts directly into your team workflows.',
            styles: { fontSize: '18px', color: '#64748b', marginTop: '16px', maxWidth: '600px' },
          },
          {
            type: 'div',
            styles: { display: 'flex', gap: '16px', marginTop: '32px' },
            children: [
              {
                type: 'button',
                content: 'Get Started Now',
                styles: { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontWeight: '600' },
              },
              {
                type: 'button',
                content: 'Schedule Demo',
                styles: { backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px 28px', borderRadius: '8px', fontWeight: '600' },
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 20px', backgroundColor: '#ffffff' },
        children: [
          {
            type: 'heading',
            content: 'Powerful features engineered for scale',
            styles: { fontSize: '28px', fontWeight: '700', textAlign: 'center', color: '#0f172a' },
          },
          {
            type: 'grid',
            styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0' },
            children: [
              {
                type: 'card',
                styles: { padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
                children: [
                  { type: 'heading', content: 'Real-time Metrics', styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a' } },
                  { type: 'text', content: 'Instant MRR, ARR, and net retention updates pushed straight to Slack.', styles: { color: '#64748b', marginTop: '8px', fontSize: '14px' } },
                ],
              },
              {
                type: 'card',
                styles: { padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
                children: [
                  { type: 'heading', content: 'Automated Billing', styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a' } },
                  { type: 'text', content: 'Dunning emails and retry logic that recovers 15% more failed card payments.', styles: { color: '#64748b', marginTop: '8px', fontSize: '14px' } },
                ],
              },
              {
                type: 'card',
                styles: { padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
                children: [
                  { type: 'heading', content: 'AI Churn Predictor', styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a' } },
                  { type: 'text', content: 'Flag churn risks 30 days before cancellation with behavior tracking.', styles: { color: '#64748b', marginTop: '8px', fontSize: '14px' } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#f8fafc', padding: '60px 20px', textAlign: 'center' },
        children: [
          { type: 'heading', content: 'Trusted by 4,500+ hyper-growth companies', styles: { fontSize: '24px', fontWeight: '700', color: '#0f172a' } },
          { type: 'text', content: '"PulseFlow cut our revenue reconciliation time from 3 days to 5 minutes flat."', styles: { fontSize: '16px', color: '#475569', fontStyle: 'italic', marginTop: '16px' } },
          { type: 'text', content: '— Sarah Jenkins, VP Finance at CloudTech', styles: { fontWeight: '600', color: '#0f172a', marginTop: '8px' } },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#0f172a', color: '#ffffff', padding: '60px 20px', textAlign: 'center' },
        children: [
          { type: 'heading', content: 'Ready to double your billing efficiency?', styles: { fontSize: '32px', fontWeight: '800' } },
          { type: 'text', content: 'Start your 14-day free trial. No credit card required.', styles: { color: '#94a3b8', marginTop: '12px' } },
          {
            type: 'button',
            content: 'Get Started Free',
            styles: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '600', marginTop: '24px' },
          },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#020617', color: '#64748b', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
        children: [
          { type: 'text', content: '© 2026 PulseFlow AI Inc. All rights reserved.' },
          { type: 'text', content: 'Privacy Policy | Terms of Service' },
        ],
      },
    ],
  },
  {
    id: 'template_saas_bold_landing_02',
    name: 'NexusCore Dark SaaS',
    description: 'High-impact dark theme SaaS landing page featuring vibrant gradients and enterprise value propositions.',
    category: 'SaaS',
    variant: 'bold landing',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', backgroundColor: '#090d16', color: '#ffffff' },
        children: [
          { type: 'heading', content: 'NEXUS.CORE', styles: { fontSize: '22px', fontWeight: '900', letterSpacing: '1px', color: '#6366f1' } },
          {
            type: 'button',
            content: 'Launch Console',
            styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontWeight: '700' },
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#090d16', color: '#ffffff', padding: '100px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        children: [
          { type: 'heading', content: 'THE NEXT-GEN DISTRIBUTED DATABASE ENGINE', styles: { fontSize: '48px', fontWeight: '900', maxWidth: '900px', lineHeight: '1.1' } },
          { type: 'text', content: 'Sub-millisecond global queries with multi-region auto-failover and zero cold starts.', styles: { color: '#94a3b8', fontSize: '20px', marginTop: '20px', maxWidth: '650px' } },
          {
            type: 'button',
            content: 'Deploy Cluster in 60s',
            styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '16px 36px', borderRadius: '8px', fontSize: '18px', fontWeight: '700', marginTop: '36px' },
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#0f172a', padding: '80px 20px', color: '#ffffff' },
        children: [
          { type: 'heading', content: 'Built for High-Throughput Engineering', styles: { textAlign: 'center', fontSize: '32px', fontWeight: '800' } },
          {
            type: 'grid',
            styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '40px auto 0' },
            children: [
              {
                type: 'card',
                styles: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px' },
                children: [
                  { type: 'heading', content: '1M+ IOPS', styles: { fontSize: '36px', fontWeight: '900', color: '#818cf8' } },
                  { type: 'text', content: 'Ultra-low latency memory storage cache.', styles: { color: '#cbd5e1', marginTop: '8px' } },
                ],
              },
              {
                type: 'card',
                styles: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px' },
                children: [
                  { type: 'heading', content: '99.999% Uptime', styles: { fontSize: '36px', fontWeight: '900', color: '#34d399' } },
                  { type: 'text', content: 'SLA backed by multi-cloud active replication.', styles: { color: '#cbd5e1', marginTop: '8px' } },
                ],
              },
              {
                type: 'card',
                styles: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px' },
                children: [
                  { type: 'heading', content: 'ACID Compliant', styles: { fontSize: '36px', fontWeight: '900', color: '#f43f5e' } },
                  { type: 'text', content: 'Strict serializable distributed transactions.', styles: { color: '#cbd5e1', marginTop: '8px' } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#090d16', padding: '60px 20px', textAlign: 'center', color: '#ffffff' },
        children: [
          { type: 'heading', content: 'Powering mission-critical platforms', styles: { fontSize: '20px', color: '#64748b', textTransform: 'uppercase' } },
          { type: 'text', content: 'FinTech • HealthCare • High-Frequency Trading • Global Logistics', styles: { fontSize: '18px', color: '#94a3b8', marginTop: '16px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#020617', padding: '40px', textAlign: 'center', color: '#64748b' },
        children: [{ type: 'text', content: '© 2026 NexusCore Inc. Distributed High Performance Systems.' }],
      },
    ],
  },

  // BATCH 2: Agency / Portfolio (6)
  {
    id: 'template_agency_portfolio_creative_studio_01',
    name: 'Vanguard Creative Studio',
    description: 'Minimalist editorial agency template with bold typography, portfolio showreel grid, and contact form.',
    category: 'Agency/Portfolio',
    variant: 'creative studio',
    thumbnail: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { display: 'flex', justifyContent: 'space-between', padding: '30px 60px', backgroundColor: '#fafafa' },
        children: [
          { type: 'heading', content: 'VANGUARD STUDIO', styles: { fontSize: '18px', fontWeight: '800', letterSpacing: '2px' } },
          { type: 'text', content: 'Work • About • Contact', styles: { fontWeight: '600', fontSize: '14px', letterSpacing: '1px' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '120px 60px', backgroundColor: '#fafafa' },
        children: [
          { type: 'heading', content: 'We craft iconic digital brands and high-conversion web experiences.', styles: { fontSize: '56px', fontWeight: '300', maxWidth: '950px', lineHeight: '1.1', color: '#171717' } },
          { type: 'text', content: 'Based in London & New York — Working with global industry disruptors.', styles: { marginTop: '24px', fontSize: '18px', color: '#737373' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 60px', backgroundColor: '#ffffff' },
        children: [
          { type: 'heading', content: 'Selected Works (2025–2026)', styles: { fontSize: '24px', fontWeight: '700', marginBottom: '30px' } },
          {
            type: 'grid',
            styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' },
            children: [
              {
                type: 'card',
                styles: { backgroundColor: '#f5f5f5', padding: '40px', borderRadius: '16px' },
                children: [
                  { type: 'image', src: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80', alt: 'Aether OS' },
                  { type: 'heading', content: 'Aether OS — Spatial Computing Interface', styles: { fontSize: '20px', fontWeight: '700', marginTop: '20px' } },
                  { type: 'text', content: 'Brand Strategy, UX Design, WebGL Development', styles: { color: '#737373', fontSize: '14px', marginTop: '6px' } },
                ],
              },
              {
                type: 'card',
                styles: { backgroundColor: '#f5f5f5', padding: '40px', borderRadius: '16px' },
                children: [
                  { type: 'image', src: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80', alt: 'Monolith Watch' },
                  { type: 'heading', content: 'Monolith — Luxury Swiss Watchmaking', styles: { fontSize: '20px', fontWeight: '700', marginTop: '20px' } },
                  { type: 'text', content: 'E-commerce, 3D Renderings, Motion System', styles: { color: '#737373', fontSize: '14px', marginTop: '6px' } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#171717', color: '#ffffff', padding: '100px 60px', textAlign: 'center' },
        children: [
          { type: 'heading', content: 'Have a project in mind?', styles: { fontSize: '42px', fontWeight: '700' } },
          { type: 'text', content: 'hello@vanguardstudio.com', styles: { fontSize: '24px', color: '#a3a3a3', marginTop: '16px', textDecoration: 'underline' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0a0a0a', color: '#525252', padding: '30px 60px', fontSize: '14px' },
        children: [{ type: 'text', content: '© 2026 Vanguard Studio Ltd. All rights reserved.' }],
      },
    ],
  },

  // BATCH 3: Ecommerce (8)
  {
    id: 'template_ecommerce_product_detail_01',
    name: 'Aura Artisanal Headphones',
    description: 'Premium e-commerce product detail layout with high-res gallery, specs, customer reviews, and buy bar.',
    category: 'Ecommerce',
    variant: 'product detail',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #f1f5f9' },
        children: [
          { type: 'heading', content: 'AURA SOUND', styles: { fontSize: '20px', fontWeight: '800' } },
          { type: 'text', content: 'Cart (1)', styles: { fontWeight: '600' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 40px', display: 'flex', gap: '60px', maxWidth: '1200px', margin: '0 auto' },
        children: [
          {
            type: 'div',
            styles: { flex: '1' },
            children: [{ type: 'image', src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', alt: 'Aura Wireless Studio Headphones' }],
          },
          {
            type: 'div',
            styles: { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
            children: [
              { type: 'heading', content: 'Aura Studio Wireless ANC', styles: { fontSize: '36px', fontWeight: '800', color: '#0f172a' } },
              { type: 'text', content: '$349.00 USD', styles: { fontSize: '24px', fontWeight: '700', color: '#2563eb', marginTop: '12px' } },
              { type: 'text', content: 'Precision planar magnetic drivers wrapped in hand-stitched Nappa leather with 40-hour battery life.', styles: { color: '#64748b', marginTop: '16px', lineHeight: '1.6' } },
              {
                type: 'button',
                content: 'Add to Cart — $349',
                styles: { backgroundColor: '#0f172a', color: '#ffffff', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', marginTop: '28px', border: 'none' },
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#f8fafc', padding: '60px 40px', textAlign: 'center' },
        children: [
          { type: 'heading', content: 'What audiophiles are saying', styles: { fontSize: '28px', fontWeight: '700' } },
          { type: 'text', content: '★★★★★ "The soundstage is ridiculously wide. Best ANC on the market hands down."', styles: { fontSize: '18px', color: '#334155', marginTop: '16px', fontStyle: 'italic' } },
          { type: 'text', content: '— Sound & Vision Magazine', styles: { fontWeight: '600', marginTop: '8px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0f172a', color: '#94a3b8', padding: '40px', textAlign: 'center', fontSize: '14px' },
        children: [{ type: 'text', content: '© 2026 Aura Sound Technologies. Free worldwide shipping & 30-day trial.' }],
      },
    ],
  },

  // BATCH 4: Blog / Content (6)
  {
    id: 'template_blog_content_standard_article_01',
    name: 'The Modern Minimalist Publication',
    description: 'Clean reading layout for longform tech essays, author info header, inline quotes, and newsletter callout.',
    category: 'Blog/Content',
    variant: 'standard article',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '24px 40px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'SYNTAX JOURNAL', styles: { fontSize: '18px', fontWeight: '900', letterSpacing: '1px' } },
          { type: 'text', content: 'Subscribe', styles: { fontWeight: '600', color: '#2563eb' } },
        ],
      },
      {
        type: 'section',
        styles: { maxWidth: '750px', margin: '60px auto', padding: '0 20px' },
        children: [
          { type: 'heading', content: 'The Architecture of Autonomous Software Agents in 2026', styles: { fontSize: '40px', fontWeight: '800', lineHeight: '1.2' } },
          { type: 'text', content: 'By Dr. Elena Vance • March 14, 2026 • 8 min read', styles: { color: '#6b7280', marginTop: '16px', fontSize: '14px' } },
          { type: 'image', src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', alt: 'AI Architecture' },
          { type: 'text', content: 'As intelligent systems transition from reactive text completion to proactive background orchestration, software design patterns are fundamentally shifting toward event-driven agent loops...', styles: { fontSize: '18px', lineHeight: '1.8', color: '#374151', marginTop: '24px' } },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#f3f4f6', padding: '40px', borderRadius: '12px', maxWidth: '750px', margin: '40px auto 60px' },
        children: [
          { type: 'heading', content: 'Stay ahead of AI engineering trends', styles: { fontSize: '20px', fontWeight: '700' } },
          { type: 'text', content: 'Join 35,000+ senior developers reading Syntax Journal every Tuesday morning.', styles: { color: '#4b5563', marginTop: '8px' } },
          {
            type: 'button',
            content: 'Subscribe for Free',
            styles: { backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', marginTop: '16px', border: 'none' },
          },
        ],
      },
      {
        type: 'footer',
        styles: { borderTop: '1px solid #e5e7eb', padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
        children: [{ type: 'text', content: '© 2026 Syntax Journal Inc. Thoughtful Tech Journalism.' }],
      },
    ],
  },

  // BATCH 5: Marketing / Lead Gen (6)
  {
    id: 'template_marketing_leadgen_webinar_01',
    name: 'Masterclass Live Webinar Landing',
    description: 'High-conversion webinar registration page with countdown timer, speaker profile, and lead capture form.',
    category: 'Marketing/LeadGen',
    variant: 'webinar',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'SCALE MASTERCLASS 2026', styles: { fontSize: '18px', fontWeight: '800' } },
          { type: 'text', content: 'LIVE WEBINAR', styles: { color: '#38bdf8', fontWeight: '700' } },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#0f172a', color: '#ffffff', padding: '80px 20px', textAlign: 'center' },
        children: [
          { type: 'heading', content: 'How to Scale B2B ARR from $1M to $10M in 18 Months', styles: { fontSize: '42px', fontWeight: '900', maxWidth: '850px', margin: '0 auto' } },
          { type: 'text', content: 'Live Interactive Session with Former Chief Revenue Officer at Stripe', styles: { fontSize: '18px', color: '#94a3b8', marginTop: '16px' } },
          { type: 'text', content: '📅 Thursday, August 22 at 11:00 AM PST', styles: { fontSize: '20px', color: '#38bdf8', fontWeight: '700', marginTop: '24px' } },
        ],
      },
      {
        type: 'section',
        styles: { backgroundColor: '#ffffff', padding: '60px 20px', maxWidth: '600px', margin: '0 auto', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
        children: [
          { type: 'heading', content: 'Reserve Your Free Seat Now', styles: { fontSize: '24px', fontWeight: '800', textAlign: 'center' } },
          { type: 'text', content: 'Limited to 500 live attendees due to Q&A bandwidth.', styles: { textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '6px' } },
          {
            type: 'button',
            content: 'Register for Live Stream →',
            styles: { backgroundColor: '#0284c7', color: '#ffffff', padding: '16px', width: '100%', borderRadius: '8px', fontSize: '16px', fontWeight: '700', marginTop: '24px', border: 'none' },
          },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#020617', color: '#64748b', padding: '30px', textAlign: 'center', fontSize: '14px' },
        children: [{ type: 'text', content: '© 2026 Scale Masterclass Series. All rights reserved.' }],
      },
    ],
  },

  // BATCH 6: Corporate / Business (5)
  {
    id: 'template_corporate_business_about_us_01',
    name: 'Apex Global Logistics About',
    description: 'Corporate about page showing executive board, global infrastructure stats, and sustainability mission.',
    category: 'Corporate/Business',
    variant: 'about us',
    thumbnail: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '24px 60px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'APEX LOGISTICS', styles: { fontSize: '22px', fontWeight: '800', color: '#1e3a8a' } },
          { type: 'text', content: 'Company • Network • Careers', styles: { color: '#475569', fontWeight: '600' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '80px 60px', backgroundColor: '#eff6ff' },
        children: [
          { type: 'heading', content: 'Connecting Global Supply Chains with Zero Carbon Footprint', styles: { fontSize: '44px', fontWeight: '800', color: '#1e3a8a', maxWidth: '800px' } },
          { type: 'text', content: 'Founded in 1998, Apex operates in over 120 maritime ports across 6 continents.', styles: { fontSize: '18px', color: '#3b82f6', marginTop: '16px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0f172a', color: '#94a3b8', padding: '40px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 Apex Global Logistics S.A.' }],
      },
    ],
  },

  // BATCH 7: Real Estate (3)
  {
    id: 'template_realestate_property_listing_01',
    name: 'Luminary Coastal Real Estate',
    description: 'Luxury architectural listings showcase with price filters, neighborhood highlights, and virtual tour triggers.',
    category: 'RealEstate',
    variant: 'property listing',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#111827', color: '#ffffff', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'LUMINARY ESTATES', styles: { fontSize: '20px', fontWeight: '800', color: '#f59e0b' } },
          { type: 'text', content: 'Contact Agent', styles: { color: '#ffffff', fontWeight: '600' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 40px', backgroundColor: '#f9fafb' },
        children: [
          { type: 'heading', content: 'Exclusive Architectural Properties', styles: { fontSize: '36px', fontWeight: '800' } },
          { type: 'image', src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', alt: 'The Malibu Cliffside Villa' },
          { type: 'heading', content: 'The Malibu Cliffside Villa — $14,500,000', styles: { fontSize: '24px', fontWeight: '700', marginTop: '20px' } },
          { type: 'text', content: '5 Bedrooms • 7 Bathrooms • 8,400 sq ft • Private Oceanfront Access', styles: { color: '#4b5563', marginTop: '8px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#111827', color: '#6b7280', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 Luminary Estates Premier Brokerage.' }],
      },
    ],
  },

  // BATCH 8: Education / Courses (3)
  {
    id: 'template_education_courses_course_catalog_01',
    name: 'HyperDrive Tech Academy',
    description: 'Online learning course catalog with skill filters, student enrollment counters, and syllabus outlines.',
    category: 'Education/Courses',
    variant: 'course catalog',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'HYPERDRIVE ACADEMY', styles: { fontSize: '20px', fontWeight: '900', color: '#7c3aed' } },
          { type: 'button', content: 'My Dashboard', styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: '8px 16px', borderRadius: '6px' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 40px', textAlign: 'center', backgroundColor: '#f5f3ff' },
        children: [
          { type: 'heading', content: 'Master Full-Stack AI Engineering in 12 Weeks', styles: { fontSize: '38px', fontWeight: '800', color: '#4c1d95' } },
          { type: 'text', content: 'Hands-on project cohort led by former OpenAI and Google engineers.', styles: { color: '#6d28d9', marginTop: '12px', fontSize: '18px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#1e1b4b', color: '#a78bfa', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 HyperDrive Academy Inc.' }],
      },
    ],
  },

  // BATCH 9: Health / Wellness (3)
  {
    id: 'template_health_wellness_clinic_landing_01',
    name: 'Serene Vitality Holistic Center',
    description: 'Warm healthcare and wellness portal with online booking, doctor bios, and patient testimonials.',
    category: 'Health/Wellness',
    variant: 'clinic landing',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#ecfdf5', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'SERENE VITALITY', styles: { fontSize: '20px', fontWeight: '800', color: '#047857' } },
          { type: 'button', content: 'Book Appointment', styles: { backgroundColor: '#059669', color: '#ffffff', padding: '10px 20px', borderRadius: '8px' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '80px 40px', textAlign: 'center', backgroundColor: '#f0fdf4' },
        children: [
          { type: 'heading', content: 'Integrative Medicine for Mind, Body & Longevity', styles: { fontSize: '40px', fontWeight: '800', color: '#065f46' } },
          { type: 'text', content: 'Personalized preventive therapies, hormone optimization, and metabolic health.', styles: { color: '#047857', marginTop: '16px', fontSize: '18px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#064e3b', color: '#a7f3d0', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 Serene Vitality Medical Group.' }],
      },
    ],
  },

  // BATCH 10: Travel / Hospitality (3)
  {
    id: 'template_travel_hospitality_hotel_landing_01',
    name: 'Aetheria Luxury Resort Amalfi',
    description: 'Immersive hotel reservation template with room suites preview, infinity pool gallery, and booking bar.',
    category: 'Travel/Hospitality',
    variant: 'hotel landing',
    thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '24px 60px', backgroundColor: '#1c1917', color: '#ffffff', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'AETHERIA AMALFI', styles: { fontSize: '22px', fontWeight: '300', letterSpacing: '3px' } },
          { type: 'text', content: 'Suites • Spa • Dining', styles: { letterSpacing: '1px', fontSize: '14px' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '100px 40px', textAlign: 'center', backgroundColor: '#292524', color: '#ffffff' },
        children: [
          { type: 'heading', content: 'Cliffside Tranquility on the Italian Coast', styles: { fontSize: '46px', fontWeight: '300', letterSpacing: '1px' } },
          { type: 'text', content: 'Private Mediterranean villas overlooking the Tyrrhenian Sea.', styles: { color: '#d6d3d1', marginTop: '16px', fontSize: '20px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0c0a09', color: '#78716c', padding: '40px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 Aetheria Resorts Group.' }],
      },
    ],
  },

  // BATCH 11: Non-profit / Charity (3)
  {
    id: 'template_nonprofit_charity_donation_page_01',
    name: 'CleanOceans Global Initiative',
    description: 'Impactful charity fundraising page with live donation goal tracker, ocean cleanup metrics, and donor form.',
    category: 'Nonprofit/Charity',
    variant: 'donation page',
    thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'CLEAN OCEANS ORG', styles: { fontSize: '20px', fontWeight: '900' } },
          { type: 'button', content: 'Donate $25 Now', styles: { backgroundColor: '#ffffff', color: '#0284c7', padding: '8px 18px', borderRadius: '6px', fontWeight: '700' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '80px 40px', textAlign: 'center', backgroundColor: '#f0f9ff' },
        children: [
          { type: 'heading', content: 'Remove 10,000,000 lbs of Plastic from Coastal Waters', styles: { fontSize: '40px', fontWeight: '800', color: '#0369a1' } },
          { type: 'text', content: '100% of public donations fund autonomous barrier traps and local cleanup crews.', styles: { fontSize: '18px', color: '#0284c7', marginTop: '16px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0c4a6e', color: '#7dd3fc', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 CleanOceans Foundation (501c3 Non-Profit).' }],
      },
    ],
  },

  // BATCH 12: Entertainment / Events (3)
  {
    id: 'template_entertainment_events_concert_landing_01',
    name: 'Neon Pulse World Tour 2026',
    description: 'High-energy electronic music festival landing page with stadium tour dates, VIP ticket passes, and video teasers.',
    category: 'Entertainment/Events',
    variant: 'concert landing',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#000000', color: '#f43f5e', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'NEON PULSE TOUR', styles: { fontSize: '22px', fontWeight: '900', letterSpacing: '2px' } },
          { type: 'button', content: 'Get Tickets', styles: { backgroundColor: '#f43f5e', color: '#ffffff', padding: '10px 20px', borderRadius: '4px', fontWeight: '800' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '100px 20px', textAlign: 'center', backgroundColor: '#000000', color: '#ffffff' },
        children: [
          { type: 'heading', content: '24 CITIES. 1 UNFORGETTABLE VISUAL EXPERIENCE.', styles: { fontSize: '48px', fontWeight: '900', color: '#fb7185' } },
          { type: 'text', content: 'Featuring 360-degree holographic stage architecture & spatial audio.', styles: { color: '#cbd5e1', fontSize: '20px', marginTop: '16px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#09090b', color: '#52525b', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 Neon Pulse Live Entertainment Group.' }],
      },
    ],
  },

  // BATCH 13: Finance / Fintech (3)
  {
    id: 'template_finance_fintech_banking_dashboard_01',
    name: 'AeroBank Corporate Fintech',
    description: 'Modern neo-banking account portal with multi-currency balances, virtual corporate card issuance, and instant transfers.',
    category: 'Finance/Fintech',
    variant: 'banking dashboard',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 40px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between' },
        children: [
          { type: 'heading', content: 'AEROBANK', styles: { fontSize: '20px', fontWeight: '900', color: '#10b981' } },
          { type: 'button', content: 'Open Business Account', styles: { backgroundColor: '#10b981', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', fontWeight: '700' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '80px 40px', textAlign: 'center', backgroundColor: '#020617', color: '#ffffff' },
        children: [
          { type: 'heading', content: 'Global Corporate Banking Without Transaction Fees', styles: { fontSize: '42px', fontWeight: '800' } },
          { type: 'text', content: 'Hold 40+ currencies, issue virtual VISA cards instantly, and earn 5.2% APY on idle cash.', styles: { color: '#94a3b8', fontSize: '18px', marginTop: '16px' } },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0f172a', color: '#64748b', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 AeroBank Financial Inc. Member FDIC.' }],
      },
    ],
  },

  // BATCH 14: Tech / Developer (2)
  {
    id: 'template_tech_developer_api_documentation_01',
    name: 'Quantum API Reference Docs',
    description: 'Developer portal documentation with sidebar navigation, code snippet blocks, authentication guide, and endpoint tester.',
    category: 'Tech/Developer',
    variant: 'API documentation',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '16px 30px', backgroundColor: '#18181b', color: '#ffffff', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #27272a' },
        children: [
          { type: 'heading', content: 'QUANTUM API v2.4', styles: { fontSize: '18px', fontWeight: '700', color: '#a855f7' } },
          { type: 'text', content: 'API Reference • SDKs • Status 🟢', styles: { fontSize: '14px', color: '#a1a1aa' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '40px 30px', backgroundColor: '#09090b', color: '#ffffff', display: 'flex', gap: '40px' },
        children: [
          {
            type: 'div',
            styles: { flex: '1' },
            children: [
              { type: 'heading', content: 'POST /v2/deployments/create', styles: { fontSize: '28px', fontWeight: '800', color: '#c084fc' } },
              { type: 'text', content: 'Triggers a zero-downtime container deployment from a specified Git commit hash or container URI.', styles: { color: '#a1a1aa', marginTop: '12px', lineHeight: '1.6' } },
            ],
          },
          {
            type: 'card',
            styles: { flex: '1', backgroundColor: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a' },
            children: [
              { type: 'text', content: 'cURL Example Request:', styles: { color: '#a1a1aa', fontSize: '12px', fontWeight: '600' } },
              { type: 'text', content: 'curl -X POST https://api.quantum.dev/v2/deployments \\\n  -H "Authorization: Bearer q_live_key" \\\n  -d \'{"region": "us-west-1"}\'', styles: { fontFamily: 'monospace', color: '#4ade80', marginTop: '12px', fontSize: '13px' } },
            ],
          },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#09090b', color: '#52525b', padding: '24px', textAlign: 'center', borderTop: '1px solid #27272a' },
        children: [{ type: 'text', content: '© 2026 Quantum Developer Cloud Platform.' }],
      },
    ],
  },

  // BATCH 15: 3D Website Templates (3D Interactive Hero, 3D Product Showcase, 3D Metaverse)
  {
    id: 'template_3d_website_templates_3d_interactive_hero_01',
    name: 'Spatial Canvas 3D Interactive Studio',
    description: 'Interactive WebGL 3D canvas hero experience with glowing glassmorphism cards, floating mesh objects, and real-time lighting controls.',
    category: '3D Website Templates',
    variant: '3D Interactive Hero',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 48px', backgroundColor: '#030712', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' },
        children: [
          { type: 'heading', content: 'NEXUS 3D', styles: { fontSize: '22px', fontWeight: '900', letterSpacing: '0.1em', color: '#38bdf8' } },
          { type: 'text', content: '3D Engine • Spline Canvas • Shaders • Studio', styles: { fontSize: '13px', color: '#94a3b8', fontWeight: '600' } },
          { type: 'button', content: 'Launch 3D World', styles: { backgroundColor: '#0284c7', color: '#ffffff', padding: '10px 24px', borderRadius: '9999px', fontWeight: '700', fontSize: '13px' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '100px 48px', backgroundColor: '#020617', color: '#ffffff', textAlign: 'center', position: 'relative' },
        children: [
          { type: 'heading', content: 'NEXT-GEN 3D WEB EXPERIENCES', styles: { fontSize: '54px', fontWeight: '900', letterSpacing: '-0.02em', color: '#f8fafc' } },
          { type: 'text', content: 'Real-time WebGL rendering, volumetric spatial lighting, and responsive 3D model physics running seamlessly in browser.', styles: { fontSize: '20px', color: '#38bdf8', maxWidth: '720px', margin: '20px auto', lineHeight: '1.6' } },
          {
            type: 'div',
            styles: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' },
            children: [
              { type: 'button', content: 'Explore 3D Canvas', styles: { backgroundColor: '#38bdf8', color: '#020617', padding: '14px 32px', borderRadius: '12px', fontWeight: '800', fontSize: '14px' } },
              { type: 'button', content: 'View Spline Scene', styles: { backgroundColor: '#1e293b', color: '#f8fafc', padding: '14px 32px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: '1px solid #334155' } },
            ],
          },
        ],
      },
      {
        type: 'section',
        styles: { padding: '60px 48px', backgroundColor: '#0b0f19', color: '#ffffff', display: 'flex', gap: '24px' },
        children: [
          {
            type: 'card',
            styles: { flex: '1', backgroundColor: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b' },
            children: [
              { type: 'heading', content: '🔮 60 FPS WebGL Engine', styles: { fontSize: '20px', fontWeight: '800', color: '#38bdf8' } },
              { type: 'text', content: 'Zero latency 3D mesh rendering with Three.js & React Three Fiber pipelines.', styles: { color: '#94a3b8', fontSize: '14px', marginTop: '12px' } },
            ],
          },
          {
            type: 'card',
            styles: { flex: '1', backgroundColor: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b' },
            children: [
              { type: 'heading', content: '✨ Interactive Raycasting', styles: { fontSize: '20px', fontWeight: '800', color: '#c084fc' } },
              { type: 'text', content: 'Hover, drag, rotate, and interact with 3D elements in real-time.', styles: { color: '#94a3b8', fontSize: '14px', marginTop: '12px' } },
            ],
          },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#030712', color: '#64748b', padding: '32px', textAlign: 'center', borderTop: '1px solid #1e293b' },
        children: [{ type: 'text', content: '© 2026 Nexus 3D Spatial Web Engine.' }],
      },
    ],
  },
  {
    id: 'template_3d_website_templates_3d_product_showcase_01',
    name: 'AeroVision 3D Spatial Headphones',
    description: '360-degree interactive 3D product view with color swatch swapper, exploded component view, and spatial audio specs.',
    category: '3D Website Templates',
    variant: '3D Product Showcase',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    elements: [
      {
        type: 'nav',
        styles: { padding: '20px 48px', backgroundColor: '#0a0a0a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #262626' },
        children: [
          { type: 'heading', content: 'AERO // 3D', styles: { fontSize: '20px', fontWeight: '900', color: '#f43f5e' } },
          { type: 'text', content: 'Specs • 3D View • Sound Stage', styles: { fontSize: '13px', color: '#a3a3a3' } },
        ],
      },
      {
        type: 'section',
        styles: { padding: '80px 48px', backgroundColor: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '48px' },
        children: [
          {
            type: 'div',
            styles: { flex: '1' },
            children: [
              { type: 'heading', content: 'AeroVision Pro 3D', styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff' } },
              { type: 'text', content: 'Rotate & inspect every millimeter of our carbon-fiber spatial audio drivers in immersive 3D.', styles: { fontSize: '18px', color: '#f43f5e', marginTop: '16px' } },
              { type: 'button', content: 'Order Now — $499', styles: { backgroundColor: '#f43f5e', color: '#ffffff', padding: '14px 36px', borderRadius: '8px', fontWeight: '800', marginTop: '28px' } },
            ],
          },
          {
            type: 'card',
            styles: { flex: '1', backgroundColor: '#171717', padding: '40px', borderRadius: '24px', border: '1px solid #262626', textAlign: 'center' },
            children: [
              { type: 'heading', content: '🎧 360° 3D Interactive Model', styles: { fontSize: '22px', fontWeight: '800', color: '#f43f5e' } },
              { type: 'text', content: '[Drag to rotate 3D mesh - Exploded Component Mode Enabled]', styles: { color: '#a3a3a3', fontSize: '13px', marginTop: '16px', fontFamily: 'monospace' } },
            ],
          },
        ],
      },
      {
        type: 'footer',
        styles: { backgroundColor: '#0a0a0a', color: '#525252', padding: '30px', textAlign: 'center' },
        children: [{ type: 'text', content: '© 2026 AeroVision 3D Spatial Audio Labs.' }],
      },
    ],
  },
];
