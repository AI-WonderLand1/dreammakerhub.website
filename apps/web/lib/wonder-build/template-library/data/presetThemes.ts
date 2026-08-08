export interface ThemePreset {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'vibrant' | 'editorial' | 'minimal';
  description: string;
  swatches: string[]; // [bg, accent, card, text]
  styles: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize?: string;
    fontWeight?: string;
    padding?: string;
    borderRadius?: string;
    borderColor?: string;
    border?: string;
  };
  // Card/Container sub-styles for template-wide theme application
  childStyles?: {
    cardBg: string;
    cardBorder: string;
    buttonBg: string;
    buttonText: string;
    headingColor: string;
    textColor: string;
  };
}

export const PRESET_THEME_LIBRARY: ThemePreset[] = [
  {
    id: 'theme_sleek_dark',
    name: 'Sleek Modern Dark',
    category: 'dark',
    description: 'Deep navy charcoal background with electric indigo accent and crisp white text.',
    swatches: ['#0f172a', '#6366f1', '#1e293b', '#f8fafc'],
    styles: {
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      padding: '24px',
      borderRadius: '12px',
      borderColor: '#334155',
      border: '1px solid #334155',
    },
    childStyles: {
      cardBg: '#1e293b',
      cardBorder: '1px solid #334155',
      buttonBg: '#6366f1',
      buttonText: '#ffffff',
      headingColor: '#ffffff',
      textColor: '#94a3b8',
    },
  },
  {
    id: 'theme_clean_light',
    name: 'Clean Light Luxury',
    category: 'light',
    description: 'Crisp off-white canvas with dark slate headings and sapphire blue action elements.',
    swatches: ['#f8fafc', '#2563eb', '#ffffff', '#0f172a'],
    styles: {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
      borderRadius: '12px',
      borderColor: '#e2e8f0',
      border: '1px solid #e2e8f0',
    },
    childStyles: {
      cardBg: '#ffffff',
      cardBorder: '1px solid #e2e8f0',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
      headingColor: '#0f172a',
      textColor: '#475569',
    },
  },
  {
    id: 'theme_cyber_neon',
    name: 'Cyberpunk Neon',
    category: 'vibrant',
    description: 'High-contrast midnight dark with cyan neon accent lines and tech aesthetic.',
    swatches: ['#090d16', '#06b6d4', '#111827', '#f0fdf4'],
    styles: {
      backgroundColor: '#090d16',
      color: '#f0fdf4',
      fontFamily: 'Space Grotesk, monospace, sans-serif',
      padding: '20px',
      borderRadius: '8px',
      borderColor: '#06b6d4',
      border: '1px solid #06b6d4',
    },
    childStyles: {
      cardBg: '#111827',
      cardBorder: '1px solid #1f2937',
      buttonBg: '#06b6d4',
      buttonText: '#090d16',
      headingColor: '#22d3ee',
      textColor: '#94a3b8',
    },
  },
  {
    id: 'theme_warm_editorial',
    name: 'Warm Editorial Serif',
    category: 'editorial',
    description: 'Sophisticated warm cream canvas with deep espresso serif typography and terracotta accent.',
    swatches: ['#fdfbf7', '#c2410c', '#f7f3eb', '#1c1917'],
    styles: {
      backgroundColor: '#fdfbf7',
      color: '#1c1917',
      fontFamily: 'Playfair Display, Georgia, serif',
      padding: '32px',
      borderRadius: '4px',
      borderColor: '#e7e5e4',
      border: '1px solid #e7e5e4',
    },
    childStyles: {
      cardBg: '#f7f3eb',
      cardBorder: '1px solid #e7e5e4',
      buttonBg: '#c2410c',
      buttonText: '#ffffff',
      headingColor: '#1c1917',
      textColor: '#57534e',
    },
  },
  {
    id: 'theme_emerald_lux',
    name: 'Emerald Minimalist',
    category: 'minimal',
    description: 'Rich dark forest emerald backdrop with mint green highlights and subtle borders.',
    swatches: ['#022c22', '#10b981', '#064e3b', '#ecfdf5'],
    styles: {
      backgroundColor: '#022c22',
      color: '#ecfdf5',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      padding: '24px',
      borderRadius: '16px',
      borderColor: '#047857',
      border: '1px solid #047857',
    },
    childStyles: {
      cardBg: '#064e3b',
      cardBorder: '1px solid #047857',
      buttonBg: '#10b981',
      buttonText: '#022c22',
      headingColor: '#ffffff',
      textColor: '#a7f3d0',
    },
  },
  {
    id: 'theme_sunset_vibrant',
    name: 'Sunset Gradient',
    category: 'vibrant',
    description: 'Vibrant violet-to-rose warm gradient theme for high energy marketing cards.',
    swatches: ['#18181b', '#e11d48', '#27272a', '#fafafa'],
    styles: {
      backgroundColor: '#18181b',
      color: '#fafafa',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      padding: '28px',
      borderRadius: '20px',
      borderColor: '#e11d48',
      border: '1px solid #e11d48',
    },
    childStyles: {
      cardBg: '#27272a',
      cardBorder: '1px solid #3f3f46',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
      headingColor: '#f43f5e',
      textColor: '#a1a1aa',
    },
  },
  {
    id: 'theme_nordic_slate',
    name: 'Nordic Slate',
    category: 'minimal',
    description: 'Cool slate gray theme inspired by minimalist Scandinavian design.',
    swatches: ['#1e293b', '#38bdf8', '#334155', '#f1f5f9'],
    styles: {
      backgroundColor: '#1e293b',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
      borderRadius: '10px',
      borderColor: '#475569',
      border: '1px solid #475569',
    },
    childStyles: {
      cardBg: '#334155',
      cardBorder: '1px solid #475569',
      buttonBg: '#38bdf8',
      buttonText: '#0f172a',
      headingColor: '#ffffff',
      textColor: '#cbd5e1',
    },
  },
  {
    id: 'theme_monochrome_glass',
    name: 'Monochrome Glass',
    category: 'dark',
    description: 'Ultra-clean obsidian black with translucent borders and stark white elements.',
    swatches: ['#000000', '#ffffff', '#121212', '#e4e4e7'],
    styles: {
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
      borderRadius: '16px',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    childStyles: {
      cardBg: '#121212',
      cardBorder: '1px solid rgba(255,255,255,0.15)',
      buttonBg: '#ffffff',
      buttonText: '#000000',
      headingColor: '#ffffff',
      textColor: '#a1a1aa',
    },
  },
];

export const SPACING_SCALE_PRESETS = [
  { name: 'Compact', padding: '12px 16px', gap: '12px', borderRadius: '6px' },
  { name: 'Standard', padding: '24px 32px', gap: '20px', borderRadius: '12px' },
  { name: 'Spacious', padding: '40px 60px', gap: '32px', borderRadius: '20px' },
  { name: 'Pill / Soft', padding: '16px 28px', gap: '16px', borderRadius: '9999px' },
];

export const FONT_PAIRING_PRESETS = [
  { name: 'Modern Sans (Jakarta)', font: 'Plus Jakarta Sans, sans-serif' },
  { name: 'Clean Minimal (Inter)', font: 'Inter, sans-serif' },
  { name: 'Editorial Serif (Playfair)', font: 'Playfair Display, Georgia, serif' },
  { name: 'Tech Grotesk (Space)', font: 'Space Grotesk, monospace' },
  { name: 'Classic Monospace', font: 'Courier New, monospace' },
];
