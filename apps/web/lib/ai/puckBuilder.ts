import { LocalizedConfession } from "@/core/ai/pipeline-v1/confessions/types";
import { logger } from '@/lib/logger';

export interface PuckComponentData {
  type: string;
  props: Record<string, unknown>;
}

export interface PuckData {
  content: PuckComponentData[];
  root: {
    type: string;
    props: Record<string, unknown>;
  };
}

export interface AIBuildResult {
  puckData: PuckData;
  response: string;
  confessions: LocalizedConfession[];
}

// ── Universal Block Catalog ──────────────────────────────────────
// All available blocks the AI can compose from.
// Each block maps to a registry component with its exact fields.

interface BlockDefinition {
  category: string;
  description: string;
  fields: Record<string, string>;
}

const BLOCK_CATALOG: Record<string, BlockDefinition> = {
  // ── Heroes ──
  heroSection: {
    category: "hero",
    description: "Full-width hero with title, subtitle, CTA buttons, and optional badge",
    fields: { title: "text", subtitle: "text", badge: "text", primaryCta: "text", secondaryCta: "text" },
  },
  centerHero: {
    category: "hero",
    description: "Centered hero with title, subtitle, and CTA",
    fields: { title: "text", subtitle: "text", ctaText: "text" },
  },
  splitHero: {
    category: "hero",
    description: "Split hero with text on left, image placeholder on right",
    fields: { title: "text", subtitle: "text", ctaText: "text" },
  },
  typewriterHero: {
    category: "hero",
    description: "Hero with animated typewriter text effect",
    fields: { title: "text", words: "text (comma separated)", subtitle: "text", ctaText: "text" },
  },
  glassmorphicHero: {
    category: "hero",
    description: "Hero with glassmorphism blur overlay effect",
    fields: { title: "text", subtitle: "text", ctaText: "text" },
  },
  microHero: {
    category: "hero",
    description: "Compact minimal hero for landing pages",
    fields: { title: "text", subtitle: "text", ctaText: "text" },
  },

  // ── Features ──
  featureGrid: {
    category: "features",
    description: "Grid of feature cards with icons, titles, descriptions",
    fields: { title: "text", subtitle: "text", features: "text (semicolon: icon|title|desc;)" },
  },
  featureList: {
    category: "features",
    description: "Vertical list of features with bullet points",
    fields: { title: "text", features: "text (semicolon separated)" },
  },
  iconGrid: {
    category: "features",
    description: "Grid of icons with labels",
    fields: { items: "text (semicolon: icon|label;)" },
  },
  bentoGrid: {
    category: "features",
    description: "Bento-style grid layout with varied sizes",
    fields: { items: "text (semicolon: icon|title|desc;)" },
  },

  // ── Pricing ──
  pricingTable: {
    category: "pricing",
    description: "Pricing table with plans, features, and CTA buttons",
    fields: { title: "text", subtitle: "text", plans: "text (semicolon: name|price|desc|features|cta;)" },
  },

  // ── Social Proof ──
  testimonialCard: {
    category: "social",
    description: "Testimonial with quote, author, role, and star rating",
    fields: { quote: "text", author: "text", role: "text", company: "text" },
  },
  logoCloud: {
    category: "social",
    description: "Row of company logos for trust signals",
    fields: { logos: "text (comma separated)" },
  },
  logoMarquee: {
    category: "social",
    description: "Scrolling marquee of logos",
    fields: { logos: "text (comma separated)" },
  },
  statsSection: {
    category: "social",
    description: "Statistics grid with big numbers and labels",
    fields: { stats: "text (semicolon: value|label;)" },
  },
  teamGrid: {
    category: "social",
    description: "Team member grid with avatars and roles",
    fields: { title: "text", members: "text (semicolon: name|role|initials;)" },
  },

  // ── CTAs ──
  ctaBox: {
    category: "cta",
    description: "Call-to-action section with title, subtitle, and button",
    fields: { title: "text", subtitle: "text", buttonText: "text" },
  },
  floatingCTA: {
    category: "cta",
    description: "Fixed floating CTA bar at bottom of page",
    fields: { text: "text", buttonText: "text" },
  },
  newsletterStrip: {
    category: "cta",
    description: "Email newsletter subscription strip",
    fields: { title: "text", description: "text", buttonText: "text" },
  },

  // ── Content ──
  accordionFAQ: {
    category: "content",
    description: "FAQ accordion with expandable questions",
    fields: { title: "text", items: "text (semicolon: question|answer;)" },
  },
  contactSplit: {
    category: "content",
    description: "Contact form with split layout",
    fields: { title: "text", buttonText: "text" },
  },
  blogPreviewGrid: {
    category: "content",
    description: "Blog post preview grid",
    fields: { posts: "text (semicolon: title|excerpt|date;)" },
  },
  stepProcess: {
    category: "content",
    description: "Step-by-step process display",
    fields: { title: "text", steps: "text (semicolon: icon|title|desc;)" },
  },
  tabsSystem: {
    category: "content",
    description: "Tabbed content interface",
    fields: { tabs: "text (semicolon: title|content;)" },
  },
  typography: {
    category: "content",
    description: "Rich text content block",
    fields: { content: "textarea" },
  },
  videoPlayer: {
    category: "content",
    description: "Video player with title",
    fields: { url: "text", title: "text" },
  },
  masonryGallery: {
    category: "content",
    description: "Masonry image gallery grid",
    fields: { images: "text (comma separated URLs)", columns: "select: 2|3|4" },
  },
  beforeAfterSlider: {
    category: "content",
    description: "Before/after image comparison slider",
    fields: { beforeLabel: "text", afterLabel: "text" },
  },

  // ── Navigation & Layout ──
  stickyHeader: {
    category: "layout",
    description: "Sticky navigation header with brand and links",
    fields: { brand: "text", links: "text (comma separated)", ctaText: "text" },
  },
  footerSections: {
    category: "layout",
    description: "Full footer with brand, columns, and social links",
    fields: { brand: "text", tagline: "text", columns: "text (semicolon: title|links;)" },
  },
  multiColumnFooter: {
    category: "layout",
    description: "Multi-column footer layout",
    fields: { brand: "text", columns: "text (semicolon: title|links;)" },
  },
  breadcrumb: {
    category: "layout",
    description: "Breadcrumb navigation",
    fields: { items: "text (comma separated)", separator: "text" },
  },

  // ── Effects ──
  confettiExplosion: {
    category: "effects",
    description: "Animated confetti explosion effect",
    fields: { trigger: "text" },
  },
  glitchText: {
    category: "effects",
    description: "Glitch distortion text effect",
    fields: { text: "text" },
  },
  parallaxSection: {
    category: "effects",
    description: "Parallax scrolling section",
    fields: { title: "text", subtitle: "text" },
  },
  particleCanvas: {
    category: "effects",
    description: "Animated particle background canvas",
    fields: { particleCount: "number" },
  },

  // ── Application Blocks ──
  signIn: {
    category: "app",
    description: "Sign-in form page",
    fields: { title: "text", subtitle: "text" },
  },
  signUp: {
    category: "app",
    description: "Sign-up form page",
    fields: { title: "text", subtitle: "text" },
  },
  appShells: {
    category: "app",
    description: "Application shell with sidebar and content area",
    fields: { title: "text", navItems: "text (comma separated)" },
  },

  // ── E-commerce ──
  productCard: {
    category: "ecommerce",
    description: "Product card with image, name, price, and add to cart",
    fields: { name: "text", price: "text", description: "text" },
  },
  shoppingCart: {
    category: "ecommerce",
    description: "Shopping cart with items and total",
    fields: { items: "text (semicolon: name|price|qty;)" },
  },
};

// ── AI Prompt ────────────────────────────────────────────────────

const BLOCK_LIST = Object.entries(BLOCK_CATALOG)
  .map(([type, def]) => `  - ${type} (${def.category}): ${def.description}. Fields: ${Object.entries(def.fields).map(([k, v]) => `${k}:${v}`).join(", ")}`)
  .join("\n");

const AI_SYSTEM_PROMPT = `You are a page builder AI. You compose web pages by selecting and configuring blocks from a universal block catalog.

AVAILABLE BLOCKS:
${BLOCK_LIST}

RULES:
1. Return ONLY a JSON array of blocks. No markdown, no explanation outside JSON.
2. Each block has a "type" (must match a block name exactly) and "props" (configured for the user's request).
3. Order blocks logically: hero first, then features, pricing, social proof, CTAs, footer last.
4. Customize content to match the user's request — don't use generic placeholder text.
5. For fields that accept structured data (semicolon/pipe separated), format them properly.
6. Use 3-8 blocks depending on page complexity.

OUTPUT FORMAT (JSON array only):
[
  {"type": "heroSection", "props": {"title": "...", "subtitle": "...", "primaryCta": "..."}},
  {"type": "featureGrid", "props": {"title": "...", "features": "..."}},
  ...
]`;

// ── Builder Functions ────────────────────────────────────────────

function tryParseAIResponse(text: string): PuckComponentData[] | null {
  // Try to extract JSON array from the response
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((block: any) => block.type && BLOCK_CATALOG[block.type])
      .map((block: any) => ({
        type: block.type,
        props: block.props || {},
      }));
  } catch {
    return null;
  }
}

function extractComponentsFromText(text: string): PuckComponentData[] {
  // Fallback: keyword matching for when AI doesn't return JSON
  const components: PuckComponentData[] = [];
  const lower = text.toLowerCase();

  const keywordMap: Record<string, string> = {
    "hero": "centerHero", "hero section": "heroSection",
    "split hero": "splitHero", "typewriter": "typewriterHero",
    "features": "featureGrid", "feature grid": "featureGrid",
    "pricing": "pricingTable", "pricing table": "pricingTable",
    "testimonials": "testimonialCard", "testimonial": "testimonialCard",
    "faq": "accordionFAQ", "accordion": "accordionFAQ",
    "contact": "contactSplit", "contact form": "contactSplit",
    "newsletter": "newsletterStrip", "subscribe": "newsletterStrip",
    "footer": "footerSections", "multi footer": "multiColumnFooter",
    "stats": "statsSection", "numbers": "statsSection",
    "team": "teamGrid", "team members": "teamGrid",
    "blog": "blogPreviewGrid", "posts": "blogPreviewGrid",
    "logos": "logoCloud", "logo cloud": "logoCloud",
    "cta": "ctaBox", "call to action": "ctaBox",
    "nav": "stickyHeader", "navigation": "stickyHeader", "header": "stickyHeader",
    "bento": "bentoGrid", "bento grid": "bentoGrid",
    "sign in": "signIn", "signin": "signIn",
    "sign up": "signUp", "signup": "signUp",
    "steps": "stepProcess", "process": "stepProcess",
    "tabs": "tabsSystem", "video": "videoPlayer",
    "gallery": "masonryGallery", "parallax": "parallaxSection",
  };

  const defaults: Record<string, Record<string, unknown>> = {
    centerHero: { title: "Build Something Amazing", subtitle: "Create beautiful websites with our visual editor.", ctaText: "Get Started Free" },
    heroSection: { title: "Build Something Amazing", subtitle: "The modern way to create beautiful, responsive websites.", badge: "", primaryCta: "Get Started Free", secondaryCta: "Watch Demo" },
    splitHero: { title: "Build Amazing Things", subtitle: "Start building in minutes.", ctaText: "Start Building" },
    featureGrid: { title: "Features", subtitle: "Everything you need", features: "Speed|⚡|Lightning fast performance;Security|🔒|Enterprise-grade security;Scale|📈|Built to grow with you" },
    pricingTable: { title: "Simple Pricing", subtitle: "No hidden fees", plans: "Starter|$0|For individuals|1 project,Basic support|Get started;Pro|$29/mo|For teams|10 projects,Priority support|Start trial;Enterprise|$99/mo|For orgs|Unlimited,Dedicated support|Contact sales" },
    testimonialCard: { quote: "This platform transformed how I build websites.", author: "Jane Smith", role: "CEO, TechCorp", company: "TechCorp" },
    accordionFAQ: { title: "Frequently Asked Questions", items: "What is this?|A modern platform for building websites.;Is there a free tier?|Yes, the Starter plan is free forever." },
    ctaBox: { title: "Ready to get started?", subtitle: "Join thousands of users.", buttonText: "Start Building Free" },
    contactSplit: { title: "Get in Touch", buttonText: "Send Message" },
    newsletterStrip: { title: "Stay updated", description: "Get the latest news and updates.", buttonText: "Subscribe" },
    statsSection: { stats: "10,000+|Active developers;99.99%|Uptime SLA;500K+|Projects shipped" },
    teamGrid: { title: "Our Team", members: "Alex Chen|CEO|AC|Maria Santos|CTO|MS|Sam Wilson|Designer|SW" },
    stickyHeader: { brand: "Brand", links: "Features, Pricing, Docs", ctaText: "Get Started" },
    footerSections: { brand: "Brand", tagline: "Building the future.", columns: "Product|Features, Pricing, Docs;Company|About, Blog, Careers;Legal|Privacy, Terms" },
    logoCloud: { logos: "Vercel, Next.js, Tailwind, Prisma, Supabase" },
    blogPreviewGrid: { posts: "Getting Started|Learn the basics.|2026-01-15;Advanced Tips|Power features.|2026-02-20" },
    bentoGrid: { items: "✦|Design|Beautiful UI|⚡|Speed|Fast performance|🔒|Security|Enterprise grade" },
    stepProcess: { title: "How it works", steps: "✏️|Sign Up|Create your account;⚙️|Configure|Set up your project;🚀|Launch|Go live in minutes" },
    signIn: { title: "Welcome back", subtitle: "Sign in to your account" },
    signUp: { title: "Create account", subtitle: "Get started for free" },
    masonryGallery: { images: "", columns: "3" },
    videoPlayer: { url: "", title: "Video" },
    parallaxSection: { title: "Scroll to explore", subtitle: "Parallax effect section" },
  };

  for (const [keyword, blockType] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      components.push({
        type: blockType,
        props: { ...(defaults[blockType] || {}) },
      });
    }
  }

  return components;
}

function orderBlocks(components: PuckComponentData[]): PuckComponentData[] {
  if (components.length === 0) return [];

  const categoryOrder = ["hero", "features", "pricing", "social", "content", "cta", "layout", "effects", "app", "ecommerce"];

  const getOrder = (type: string): number => {
    const cat = BLOCK_CATALOG[type]?.category || "content";
    return categoryOrder.indexOf(cat);
  };

  const sorted = [...components].sort((a, b) => getOrder(a.type) - getOrder(b.type));

  // Ensure hero is first
  const heroIdx = sorted.findIndex(c => c.type.includes("Hero") || c.type === "heroSection");
  if (heroIdx > 0) {
    const [hero] = sorted.splice(heroIdx, 1);
    sorted.unshift(hero);
  }

  // Ensure footer is last
  const footerIdx = sorted.findIndex(c => c.type.includes("footer") || c.type === "footerSections");
  if (footerIdx >= 0 && footerIdx < sorted.length - 1) {
    const [footer] = sorted.splice(footerIdx, 1);
    sorted.push(footer);
  }

  return sorted;
}

function componentsToPuckData(components: PuckComponentData[]): PuckData {
  return {
    content: components,
    root: { type: "Fragment", props: {} },
  };
}

// ── Exports ──────────────────────────────────────────────────────

export async function sendToAIBuilder(
  prompt: string,
  existingData?: PuckData
): Promise<AIBuildResult> {
  const contextInfo = existingData
    ? `\n\nCurrent page has these components: ${existingData.content.map(c => c.type).join(", ")}`
    : "";

  const existingProps = existingData
    ? `\n\nCurrent component configs:\n${existingData.content.map(c => `  - ${c.type}: ${JSON.stringify(c.props)}`).join("\n")}`
    : "";

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${AI_SYSTEM_PROMPT}\n\nUSER REQUEST: ${prompt}${contextInfo}${existingProps}\n\nReturn a JSON array of blocks to compose this page.`,
      agentId: "builder-default",
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const json = await response.json();
  const aiText = json.result?.response || "";

  // Try to parse structured blocks from AI response
  let components = tryParseAIResponse(aiText);

  // Fallback to keyword matching
  if (!components || components.length === 0) {
    components = extractComponentsFromText(aiText || prompt);
  }

  // If still nothing, use defaults for the prompt
  if (components.length === 0) {
    components = extractComponentsFromText(prompt);
  }

  // Order blocks logically
  const ordered = orderBlocks(components);
  const puckData = componentsToPuckData(ordered);

  return {
    puckData,
    response: aiText || `Built a page with ${ordered.length} blocks: ${ordered.map(c => c.type).join(", ")}`,
    confessions: json.result?.confessions || [],
  };
}

export function convertTextToPuckData(text: string): PuckData {
  const components = extractComponentsFromText(text);
  return componentsToPuckData(orderBlocks(components));
}

export function applyPuckDataUpdate(
  currentData: PuckData,
  update: Partial<PuckData>
): PuckData {
  return {
    content: update.content || currentData.content,
    root: update.root || currentData.root,
  };
}

export function addComponentToPuck(
  currentData: PuckData,
  component: PuckComponentData
): PuckData {
  return {
    ...currentData,
    content: [...currentData.content, component],
  };
}

export function removeComponentFromPuck(
  currentData: PuckData,
  index: number
): PuckData {
  const newContent = [...currentData.content];
  newContent.splice(index, 1);
  return {
    ...currentData,
    content: newContent,
  };
}

export function updateComponentInPuck(
  currentData: PuckData,
  index: number,
  props: Record<string, unknown>
): PuckData {
  const newContent = [...currentData.content];
  if (newContent[index]) {
    newContent[index] = {
      ...newContent[index],
      props: { ...newContent[index].props, ...props },
    };
  }
  return {
    ...currentData,
    content: newContent,
  };
}
