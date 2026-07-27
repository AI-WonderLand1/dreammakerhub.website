'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useBuilderStore } from '../store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Add a hero section with heading and CTA button',
  'Create a 3-column feature grid',
  'Add a testimonial carousel',
  'Build a pricing table with 3 tiers',
  'Insert a contact form',
  'Make the layout responsive',
  'Improve color contrast',
  'Add an image gallery',
];

const BUILDER_SYSTEM_PROMPT = `You are a helpful web builder assistant integrated into a drag-and-drop website builder. 
Your job is to help users build pages by suggesting blocks to add, explaining how to use features, and answering questions.

Available block categories: forms, typography, media, navigation, marketing, blog, commerce, products, utility, layout, social, analytics, widgets, notification, payment, seo, files, auth.

When the user asks to add something specific, you can respond with a JSON command at the end of your message in this format:
---BLOCK
{"name":"Button","type":"button","icon":"🔘","category":"forms","props":{"label":"Click Here","url":"#","variant":"primary","size":"md"},"styles":{"backgroundColor":"#7c3aed","color":"#ffffff","padding":"0.625rem 1.25rem","borderRadius":"0.5rem","fontWeight":"600","fontSize":"0.875rem","display":"inline-block","border":"none","textDecoration":"none"}}
---END

Only include the JSON block command when the user explicitly asks to add a block. For general questions, just provide helpful text advice.

Keep responses concise, friendly, and focused on the builder context.`;

const FALLBACK_RESPONSES: Record<string, string> = {
  hero: '✅ Added a hero section with heading, subtitle, and CTA button. You can edit the text in the inspector panel.',
  feature: '✅ Added a 3-column feature grid. Customize the icons, titles, and descriptions in the inspector.',
  testimonial: '✅ Added a testimonial carousel. Add more testimonials or change the autoplay settings in the inspector.',
  pricing: '✅ Added a pricing card. Toggle the "highlighted" option to make it stand out.',
  contact: '✅ Added a contact form with name, email, and message fields. Change the submit button text in the inspector.',
  gallery: '✅ Added an image gallery grid. Switch to carousel mode in the inspector panel.',
  responsive: '💡 To make your page responsive:\n1. Use the breakpoint switcher at the top of the inspector panel\n2. Set different styles per device\n3. Use flexbox/grid layouts with relative units\n4. Toggle "Hide on this device" for mobile-specific visibility',
  color: '🎨 Use the color pickers in the Style section to set text and background colors. The contrast checker tells you if colors pass WCAG AA/AAA.',
  layout: '✅ Added a 2-column layout. Drag blocks into each column. Adjust the column count in the inspector.',
  button: '✅ Added a primary button. Change the label, URL, variant, and size in the inspector.',
  nav: '✅ Added a navigation bar. Customize the logo and links in the inspector panel.',
  footer: '✅ Added a footer section. Drop navigation links, social icons, or copyright text inside it.',
  video: '✅ Added a YouTube video embed. Use the Video section in the inspector to change the source and playback settings.',
  map: '✅ Added an OpenStreetMap embed. Enter an address or custom map URL in the inspector.',
  counter: '✅ Added an animated counter. Set the target number, suffix, and label in the inspector.',
};

function addFallbackBlock(keyword: string) {
  const store = useBuilderStore.getState();
  const id = `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 4)}`;
  const blocks: Record<string, any> = {
    hero: {
      type: 'hero', name: 'Hero Section', icon: '⚡',
      props: { title: 'Build Something Amazing', subtitle: 'Create with AI-powered tools.', cta: 'Get Started' },
      styles: { padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#1e1b4b', borderRadius: '0.75rem', marginBottom: '1rem' },
    },
    feature: {
      type: 'feature-grid', name: 'Feature Grid', icon: '🔲',
      props: { features: [{ icon: '⚡', title: 'Fast', desc: 'Lightning quick performance.' }, { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security.' }, { icon: '📱', title: 'Responsive', desc: 'Works on all devices.' }], columns: 3 },
      styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '2rem 0', textAlign: 'center' },
    },
    testimonial: {
      type: 'carousel-testimonials', name: 'Testimonial Carousel', icon: '🎠',
      props: { items: [{ quote: 'Amazing product!', author: 'Alice', role: 'CEO' }, { quote: 'Transformed our workflow.', author: 'Bob', role: 'Developer' }, { quote: 'Highly recommended.', author: 'Carol', role: 'Designer' }], autoplay: true, interval: 4 },
      styles: { padding: '2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' },
    },
    pricing: {
      type: 'pricing', name: 'Pricing Table', icon: '💰',
      props: { plan: 'Pro', price: '$19', interval: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], cta: 'Choose Plan', highlighted: false },
      styles: { padding: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '350px' },
    },
    contact: {
      type: 'contact-form', name: 'Contact Form', icon: '📧',
      props: { fields: ['name', 'email', 'message'], submitText: 'Send Message', showSubject: true },
      styles: { maxWidth: '600px', margin: '0 auto', padding: '1.5rem' },
    },
    gallery: {
      type: 'gallery', name: 'Gallery', icon: '🖼️',
      props: { images: ['https://picsum.photos/400/300?1', 'https://picsum.photos/400/300?2', 'https://picsum.photos/400/300?3'], columns: 3, mode: 'grid' },
      styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' },
    },
    layout: {
      type: 'columns', name: 'Columns', icon: '🔲',
      props: { columns: 2 },
      styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1rem' },
    },
    button: {
      type: 'button', name: 'Button', icon: '🔘',
      props: { label: 'Click Here', url: '#', variant: 'primary', size: 'md' },
      styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.875rem', display: 'inline-block', border: 'none', textDecoration: 'none' },
    },
    nav: {
      type: 'navbar', name: 'Navbar', icon: '🧭',
      props: { logo: 'Logo', links: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' }], sticky: false },
      styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    },
    footer: {
      type: 'section', name: 'Footer Section', icon: '📐',
      props: { width: 'full', paddingY: '3rem' },
      styles: { padding: '3rem 2rem', backgroundColor: 'rgba(15,23,42,0.9)', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' },
    },
    video: {
      type: 'video', name: 'Video', icon: '🎬',
      props: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', caption: '', autoplay: false, platform: 'youtube' },
      styles: { aspectRatio: '16/9', width: '100%', borderRadius: '0.5rem', marginBottom: '1rem' },
    },
    map: {
      type: 'map', name: 'Map', icon: '🗺️',
      props: { src: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.004%2C51.476%2C0.005%2C51.480&layer=mapnik', address: '', zoom: 12 },
      styles: { width: '100%', height: '350px', border: 'none', borderRadius: '0.5rem', marginBottom: '1rem' },
    },
    counter: {
      type: 'count-up', name: 'Count Up', icon: '📊',
      props: { number: 1000, suffix: '+', label: 'Users', duration: 2 },
      styles: { textAlign: 'center', padding: '1.5rem', fontSize: '2.5rem', fontWeight: '700', color: '#7c3aed' },
    },
  };
  for (const [key, def] of Object.entries(blocks)) {
    if (keyword.includes(key)) {
      store.addElement({ id, ...def } as any);
      return;
    }
  }
}

export default function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI builder assistant. Ask me to add blocks, change styles, or help with your page layout.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const tryAddBlockFromResponse = useCallback((text: string) => {
    const match = text.match(/---BLOCK\n([\s\S]*?)\n---END/);
    if (match) {
      try {
        const block = JSON.parse(match[1]);
        useBuilderStore.getState().addElement({
          id: `el-${Date.now()}-ai-${Math.random().toString(36).slice(2, 4)}`,
          type: block.type,
          name: block.name,
          icon: block.icon,
          props: block.props || {},
          styles: block.styles || {},
        });
        return true;
      } catch {}
    }
    return false;
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const promptText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${BUILDER_SYSTEM_PROMPT}\n\nUser: ${promptText}\n\nRespond helpfully. If the user wants to add a block, include the ---BLOCK JSON command at the end.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.text || 'Got it! Let me know if you need anything else.';
        tryAddBlockFromResponse(reply);
        const cleanReply = reply.replace(/---BLOCK\n[\s\S]*?\n---END/, '').trim() || reply;
        setMessages((prev) => [...prev, { role: 'assistant', content: cleanReply }]);
        setLoading(false);
        return;
      }
    } catch {}

    const lower = promptText.toLowerCase();
    const keywords = Object.keys(FALLBACK_RESPONSES);
    let matched = false;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        addFallbackBlock(lower);
        setMessages((prev) => [...prev, { role: 'assistant', content: FALLBACK_RESPONSES[kw] }]);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const help = 'Try asking me to add specific blocks like "Add a hero section" or "Create a pricing table". Type "help" or "suggest" for ideas.';
      setMessages((prev) => [...prev, { role: 'assistant', content: help }]);
    }
    setLoading(false);
  }, [input, loading, tryAddBlockFromResponse]);

  return (
    <div className="w-full bg-[#0c101d] text-white flex flex-col overflow-hidden h-full">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-semibold">AI Assistant</span>
        </div>
        <span className="text-[9px] text-purple-400/60 font-mono">v1.0</span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'bg-white/5 text-white/70 border border-white/5'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-xl px-3 py-2 text-[11px] text-white/50 border border-white/5">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 2 && (
        <div className="shrink-0 px-2 pb-2 space-y-1">
          <p className="text-[9px] text-white/20 px-1">Try asking:</p>
          <div className="flex flex-wrap gap-1">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-[9px] px-2 py-1 rounded-full bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors border border-white/5"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-white/10 p-2">
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask AI to build something..."
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/20"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
