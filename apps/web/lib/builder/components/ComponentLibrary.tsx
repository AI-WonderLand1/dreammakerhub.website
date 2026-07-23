'use client';

import React, { useCallback } from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement, BlockDefinition, BlockCategory } from '../types';

const BLOCKS: BlockDefinition[] = [
  // ── Text ──
  { name: 'Heading', type: 'heading', icon: '🔤', category: 'text', description: 'Section heading with configurable level', defaultProps: { level: 'h2', content: 'New Heading' }, defaultStyles: { fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', marginBottom: '0.5rem' }, editableProps: [{ key: 'content', label: 'Heading Text', type: 'text' }, { key: 'level', label: 'Level', type: 'select', options: [{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }] }] },
  { name: 'Paragraph', type: 'paragraph', icon: '📝', category: 'text', description: 'Body text paragraph', defaultProps: { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }, defaultStyles: { fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.75', marginBottom: '1rem' }, editableProps: [{ key: 'content', label: 'Text', type: 'textarea' }] },
  { name: 'Rich Text', type: 'rich-text', icon: '📄', category: 'text', description: 'Multi-line rich content area', defaultProps: { content: '<p>Rich content goes here.</p>' }, defaultStyles: { padding: '1rem', color: '#cbd5e1', lineHeight: '1.75' }, editableProps: [{ key: 'content', label: 'HTML Content', type: 'textarea' }] },
  { name: 'List', type: 'list', icon: '📋', category: 'text', description: 'Bulleted or numbered list', defaultProps: { items: ['Item one', 'Item two', 'Item three'], listType: 'unordered' }, defaultStyles: { paddingLeft: '1.5rem', color: '#cbd5e1', lineHeight: '1.75' }, editableProps: [{ key: 'listType', label: 'Type', type: 'select', options: [{ label: 'Bulleted', value: 'unordered' }, { label: 'Numbered', value: 'ordered' }] }] },
  { name: 'Quote', type: 'quote', icon: '💬', category: 'text', description: 'Blockquote with citation', defaultProps: { content: 'The future belongs to those who believe in the beauty of their dreams.', citation: 'Eleanor Roosevelt' }, defaultStyles: { borderLeft: '4px solid #7c3aed', padding: '1rem 1.5rem', fontStyle: 'italic', color: '#e2e8f0', backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: '0.5rem' }, editableProps: [{ key: 'content', label: 'Quote', type: 'textarea' }, { key: 'citation', label: 'Citation', type: 'text' }] },
  { name: 'Pullquote', type: 'pullquote', icon: '〰️', category: 'text', description: 'Featured pull quote', defaultProps: { content: 'Standout quote text here.' }, defaultStyles: { fontSize: '1.25rem', fontWeight: '600', color: '#a78bfa', textAlign: 'center', padding: '2rem', borderTop: '2px solid #7c3aed', borderBottom: '2px solid #7c3aed', margin: '1.5rem 0' }, editableProps: [{ key: 'content', label: 'Quote Text', type: 'textarea' }] },
  { name: 'Code', type: 'code', icon: '💻', category: 'text', description: 'Inline code block', defaultProps: { content: 'const greeting = "Hello World";' }, defaultStyles: { fontFamily: '"Fira Code", monospace', fontSize: '0.875rem', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.5rem', color: '#a5f3fc', overflow: 'auto' }, editableProps: [{ key: 'content', label: 'Code', type: 'textarea' }] },
  { name: 'Preformatted', type: 'preformatted', icon: '📐', category: 'text', description: 'Preformatted text block', defaultProps: { content: 'Preformatted text maintains whitespace.' }, defaultStyles: { fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.5rem', color: '#e2e8f0' }, editableProps: [{ key: 'content', label: 'Text', type: 'textarea' }] },

  // ── Media ──
  { name: 'Image', type: 'image', icon: '🖼️', category: 'media', description: 'Single image with alt text', defaultProps: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', alt: 'Abstract art', caption: '' }, defaultStyles: { maxWidth: '100%', borderRadius: '0.5rem', marginBottom: '1rem' }, editableProps: [{ key: 'src', label: 'Image URL', type: 'image' }, { key: 'alt', label: 'Alt Text', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
  { name: 'Gallery', type: 'gallery', icon: '🖼️', category: 'media', description: 'Image gallery grid', defaultProps: { images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'], columns: 3 }, defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }, editableProps: [{ key: 'columns', label: 'Columns', type: 'number' }] },
  { name: 'Video', type: 'video', icon: '🎬', category: 'media', description: 'Video embed (YouTube/Vimeo/self-hosted)', defaultProps: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', caption: '' }, defaultStyles: { aspectRatio: '16/9', width: '100%', borderRadius: '0.5rem', marginBottom: '1rem' }, editableProps: [{ key: 'src', label: 'Video URL', type: 'video' }, { key: 'caption', label: 'Caption', type: 'text' }] },
  { name: 'Cover', type: 'cover', icon: '🖼️', category: 'media', description: 'Full-width cover image with overlay', defaultProps: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200', overlay: 'rgba(0,0,0,0.4)', minHeight: '400px', content: 'Cover Content' }, defaultStyles: { backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', color: '#ffffff', padding: '2rem', position: 'relative' }, editableProps: [{ key: 'src', label: 'Background Image', type: 'image' }, { key: 'overlay', label: 'Overlay Color', type: 'color' }, { key: 'minHeight', label: 'Min Height', type: 'text' }, { key: 'content', label: 'Content', type: 'text' }] },
  { name: 'Media & Text', type: 'media-text', icon: '📰', category: 'media', description: 'Side-by-side media and text', defaultProps: { mediaSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', content: 'Text content beside media.', mediaPosition: 'left' }, defaultStyles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }, editableProps: [{ key: 'mediaSrc', label: 'Media URL', type: 'image' }, { key: 'content', label: 'Text', type: 'textarea' }, { key: 'mediaPosition', label: 'Media Position', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }] },
  { name: 'Audio', type: 'audio', icon: '🎵', category: 'media', description: 'Audio player embed', defaultProps: { src: '', caption: '' }, defaultStyles: { width: '100%', marginBottom: '1rem' }, editableProps: [{ key: 'src', label: 'Audio URL', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
  { name: 'File', type: 'file', icon: '📎', category: 'media', description: 'File download block', defaultProps: { href: '#', fileName: 'document.pdf', fileSize: '2.3 MB' }, defaultStyles: { padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }, editableProps: [{ key: 'fileName', label: 'File Name', type: 'text' }, { key: 'fileSize', label: 'File Size', type: 'text' }] },

  // ── Layout ──
  { name: 'Columns', type: 'columns', icon: '🔲', category: 'layout', description: 'Multi-column layout', defaultProps: { columns: 2, content: 'Column content' }, defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1rem' }, editableProps: [{ key: 'columns', label: 'Column Count', type: 'range', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }] }] },
  { name: 'Row', type: 'row', icon: '➡️', category: 'layout', description: 'Horizontal flex row', defaultProps: { content: 'Row content', gap: '1rem' }, defaultStyles: { display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }, editableProps: [{ key: 'gap', label: 'Gap', type: 'text' }] },
  { name: 'Group', type: 'group', icon: '📦', category: 'layout', description: 'Container group for nesting blocks', defaultProps: { content: '' }, defaultStyles: { padding: '1rem', marginBottom: '1rem' }, editableProps: [] },
  { name: 'Spacer', type: 'spacer', icon: '📏', category: 'layout', description: 'Vertical spacing', defaultProps: { height: '50px' }, defaultStyles: { height: '50px', margin: '0' }, editableProps: [{ key: 'height', label: 'Height', type: 'text' }] },
  { name: 'Separator', type: 'separator', icon: '➖', category: 'layout', description: 'Horizontal divider line', defaultProps: {}, defaultStyles: { height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1.5rem 0', border: 'none' }, editableProps: [] },
  { name: 'Buttons', type: 'buttons', icon: '🔘', category: 'layout', description: 'Button group', defaultProps: { buttons: [{ label: 'Get Started', url: '#', variant: 'primary' }, { label: 'Learn More', url: '#', variant: 'secondary' }] }, defaultStyles: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }, editableProps: [] },
  { name: 'Button', type: 'button', icon: '🔘', category: 'layout', description: 'Single call-to-action button', defaultProps: { label: 'Click Here', url: '#', variant: 'primary' }, defaultStyles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.875rem', display: 'inline-block', cursor: 'pointer', border: 'none', textDecoration: 'none' }, editableProps: [{ key: 'label', label: 'Button Text', type: 'text' }, { key: 'url', label: 'URL', type: 'text' }, { key: 'variant', label: 'Style', type: 'select', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }] }] },

  // ── WordPress ──
  { name: 'WP Post', type: 'wp-post', icon: '📝', category: 'wordpress', description: 'Latest WordPress posts loop', defaultProps: { title: 'Latest Posts', count: 3, postType: 'post' }, defaultStyles: { padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }, editableProps: [{ key: 'title', label: 'Section Title', type: 'text' }, { key: 'count', label: 'Post Count', type: 'number' }] },
  { name: 'WP Page', type: 'wp-page', icon: '📄', category: 'wordpress', description: 'Single WordPress page embed', defaultProps: { title: 'Page Title', wpSlug: 'about' }, defaultStyles: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }, editableProps: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'wpSlug', label: 'WP Slug', type: 'text' }] },
  { name: 'WP Comments', type: 'wp-comments', icon: '💭', category: 'wordpress', description: 'WordPress comments section', defaultProps: { title: 'Comments' }, defaultStyles: { padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }, editableProps: [{ key: 'title', label: 'Title', type: 'text' }] },
  { name: 'WP Search', type: 'wp-search', icon: '🔍', category: 'wordpress', description: 'WordPress search form', defaultProps: { placeholder: 'Search...' }, defaultStyles: { padding: '1rem' }, editableProps: [{ key: 'placeholder', label: 'Placeholder', type: 'text' }] },
  { name: 'WP Breadcrumbs', type: 'wp-breadcrumbs', icon: '🔗', category: 'wordpress', description: 'Breadcrumb navigation', defaultProps: { separator: ' / ' }, defaultStyles: { fontSize: '0.875rem', color: '#94a3b8', padding: '0.5rem 0', marginBottom: '1rem' }, editableProps: [{ key: 'separator', label: 'Separator', type: 'text' }] },
  { name: 'WP Sidebar', type: 'wp-sidebar', icon: '📑', category: 'wordpress', description: 'Dynamic WP sidebar widget area', defaultProps: { title: 'Sidebar' }, defaultStyles: { padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }, editableProps: [{ key: 'title', label: 'Title', type: 'text' }] },

  // ── Content ──
  { name: 'Hero Section', type: 'hero', icon: '⚡', category: 'content', description: 'Full-width hero with heading and CTA', defaultProps: { title: 'Build Something Amazing', subtitle: 'Create WordPress sites with AI-powered visual builder.', cta: 'Get Started' }, defaultStyles: { padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#1e1b4b', borderRadius: '0.75rem', marginBottom: '1rem' }, editableProps: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'text' }, { key: 'cta', label: 'CTA Text', type: 'text' }] },
  { name: 'Feature Grid', type: 'feature-grid', icon: '🔲', category: 'content', description: 'Features showcase grid', defaultProps: { features: [{ title: 'AI Powered', desc: 'Generate content with AI' }, { title: 'Visual Builder', desc: 'Drag and drop interface' }, { title: 'WP Native', desc: 'WordPress-compatible output' }] }, defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', padding: '2rem 0' }, editableProps: [] },
  { name: 'Testimonial', type: 'testimonial', icon: '⭐', category: 'content', description: 'Customer testimonial card', defaultProps: { quote: 'This is the best builder we have ever used.', author: 'Jane Doe', role: 'CEO, Company', avatar: '' }, defaultStyles: { padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }, editableProps: [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'author', label: 'Author', type: 'text' }, { key: 'role', label: 'Role', type: 'text' }] },
  { name: 'Pricing Table', type: 'pricing', icon: '💰', category: 'content', description: 'Plan pricing card', defaultProps: { plan: 'Pro', price: '$19', interval: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], cta: 'Choose Plan' }, defaultStyles: { padding: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }, editableProps: [{ key: 'plan', label: 'Plan Name', type: 'text' }, { key: 'price', label: 'Price', type: 'text' }, { key: 'interval', label: 'Interval', type: 'text' }, { key: 'cta', label: 'CTA Text', type: 'text' }] },
  { name: 'FAQ', type: 'faq', icon: '❓', category: 'content', description: 'Accordion FAQ section', defaultProps: { items: [{ q: 'How does it work?', a: 'Describe your site and AI builds it.' }, { q: 'Is it WordPress compatible?', a: 'Yes, it exports to WordPress.' }] }, defaultStyles: { padding: '1rem 0' }, editableProps: [] },
  { name: 'Table of Contents', type: 'toc', icon: '📑', category: 'content', description: 'Auto-generated table of contents', defaultProps: { title: 'Table of Contents' }, defaultStyles: { padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }, editableProps: [{ key: 'title', label: 'Title', type: 'text' }] },

  // ── Embed ──
  { name: 'Embed', type: 'embed', icon: '🔗', category: 'embed', description: 'Generic embed (tweet, codepen, etc.)', defaultProps: { url: '', caption: '' }, defaultStyles: { marginBottom: '1rem' }, editableProps: [{ key: 'url', label: 'Embed URL', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
  { name: 'Map', type: 'map', icon: '🗺️', category: 'embed', description: 'Google/OpenStreetMap embed', defaultProps: { src: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.004%2C51.476%2C0.005%2C51.480&layer=mapnik' }, defaultStyles: { width: '100%', height: '300px', border: 'none', borderRadius: '0.5rem', marginBottom: '1rem' }, editableProps: [{ key: 'src', label: 'Map URL', type: 'text' }] },

  // ── Design ──
  { name: 'Divider', type: 'divider', icon: '➖', category: 'design', description: 'Decorative divider', defaultProps: { style: 'solid' }, defaultStyles: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '2rem 0' }, editableProps: [] },
  { name: 'Icon', type: 'icon', icon: '✨', category: 'design', description: 'Decorative icon or emoji', defaultProps: { icon: '✨', size: '2rem' }, defaultStyles: { fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }, editableProps: [{ key: 'icon', label: 'Icon', type: 'text' }, { key: 'size', label: 'Size', type: 'text' }] },
  { name: 'Count Up', type: 'count-up', icon: '📊', category: 'design', description: 'Animated number counter', defaultProps: { number: 1000, suffix: '+', label: 'Users' }, defaultStyles: { textAlign: 'center', padding: '1.5rem' }, editableProps: [{ key: 'number', label: 'Number', type: 'number' }, { key: 'suffix', label: 'Suffix', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }] },
  { name: 'HTML', type: 'custom-html', icon: '🔧', category: 'design', description: 'Custom HTML block', defaultProps: { html: '<div>Custom HTML</div>' }, defaultStyles: { padding: '0.5rem' }, editableProps: [{ key: 'html', label: 'HTML', type: 'textarea' }] },
];

const BLOCK_CATEGORIES: { key: BlockCategory; label: string; icon: string }[] = [
  { key: 'text', label: 'Text', icon: '🔤' },
  { key: 'media', label: 'Media', icon: '🎬' },
  { key: 'layout', label: 'Layout', icon: '🔲' },
  { key: 'wordpress', label: 'WordPress', icon: '📝' },
  { key: 'content', label: 'Content', icon: '📄' },
  { key: 'embed', label: 'Embed', icon: '🔗' },
  { key: 'design', label: 'Design', icon: '✨' },
];

export default function ComponentLibrary() {
  const { addElement, setLeftPanelOpen } = useBuilderStore();
  const [activeCategory, setActiveCategory] = React.useState<BlockCategory>('text');
  const [search, setSearch] = React.useState('');

  const filtered = BLOCKS.filter(
    (b) => b.category === activeCategory && (!search || b.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDragStart = useCallback((e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleAdd = useCallback((block: BlockDefinition) => {
    const el: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: block.type,
      name: block.name,
      icon: block.icon,
      props: { ...block.defaultProps },
      styles: { ...block.defaultStyles },
    };
    addElement(el);
  }, [addElement]);

  return (
    <div className="flex flex-col h-full w-72 bg-[#0b0f19] text-white border-r border-white/10">
      <div className="shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Blocks</h3>
          <button onClick={() => setLeftPanelOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">✕</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/20"
        />
      </div>

      <div className="shrink-0 flex overflow-x-auto gap-1 p-2 border-b border-white/10">
        {BLOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
              activeCategory === cat.key ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No blocks found.</p>
        )}
        {filtered.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => handleDragStart(e, block)}
            onClick={() => handleAdd(block)}
            className="flex items-center gap-2.5 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 cursor-grab active:cursor-grabbing transition-all group"
            title={block.description}
          >
            <span className="text-lg shrink-0">{block.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80 truncate">{block.name}</p>
              <p className="text-[10px] text-white/30 truncate">{block.description}</p>
            </div>
            <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
