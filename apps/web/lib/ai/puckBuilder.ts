import { LocalizedConfession } from "@core/ai/index.ts/confessions/types";

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

const COMPONENT_MAP: Record<string, string> = {
  "button": "button",
  "buttons": "button",
  "cta": "ctaBox",
  "call to action": "ctaBox",
  "hero": "centerHero",
  "hero section": "centerHero",
  "split hero": "splitHero",
  "nav": "stickyHeader",
  "navigation": "stickyHeader",
  "menu": "stickyHeader",
  "header": "stickyHeader",
  "features": "featureGrid",
  "feature grid": "featureGrid",
  "pricing": "pricingTable",
  "pricing table": "pricingTable",
  "testimonials": "testimonialCard",
  "testimonial": "testimonialCard",
  "reviews": "testimonialCard",
  "logos": "logoCloud",
  "logo cloud": "logoCloud",
  "stats": "statsSection",
  "numbers": "statsSection",
  "footer": "multiColumnFooter",
  "team": "teamGrid",
  "team members": "teamGrid",
  "blog": "blogPreviewGrid",
  "posts": "blogPreviewGrid",
  "faq": "glassAccordion",
  "accordion": "glassAccordion",
  "contact": "contactSplit",
  "contact form": "contactSplit",
  "newsletter": "newsletterStrip",
  "subscribe": "newsletterStrip",
  "landing": "centerHero",
  "landing page": "centerHero",
  "about": "splitHero",
  "services": "featureGrid",
  "pricing page": "pricingTable",
  "features page": "featureGrid",
  "contact page": "contactSplit",
  "home": "centerHero",
  "homepage": "centerHero",
};

const DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
  centerHero: { 
    title: "Build Something Amazing", 
    subtitle: "Create beautiful websites with our visual editor. No coding required.",
    ctaText: "Get Started Free"
  },
  splitHero: { 
    title: "Build Amazing Things", 
    subtitle: "The modern way to create beautiful, responsive websites. Start building in minutes.",
    ctaText: "Start Building"
  },
  button: { 
    content: "Get Started", 
    variant: "background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 500;"
  },
  heading: { content: "Welcome", level: "text-3xl font-semibold" },
  typography: { content: "Your text content goes here." },
  cardHover: { title: "Feature Title", description: "Description of this feature goes here." },
  pricingTable: { 
    plans: "Starter,Pro,Enterprise", 
    price: "$9/mo",
    features: "Feature 1,Feature 2,Feature 3"
  },
  featureGrid: { 
    features: "Fast,Secure,Scalable",
    descriptions: "Lightning fast performance,Enterprise-grade security,Built to scale"
  },
  logoCloud: { 
    companies: "Google,Meta,Microsoft,Amazon,Apple,Nvidia" 
  },
  testimonialCard: { 
    quote: "This platform has transformed how I build websites. Absolutely incredible experience!",
    author: "Jane Smith",
    role: "CEO, TechCorp"
  },
  stepProcess: { steps: "Sign Up,Configure,Launch" },
  glassAccordion: { 
    title: "What is this product?", 
    content: "Our platform lets you build beautiful websites without any coding. Just drag, drop, and customize."
  },
  tabsSystem: { tabs: "Features,Pricing,About" },
  videoPlayer: { src: "" },
  ctaBox: { 
    title: "Ready to get started?", 
    buttonText: "Start Building Free",
    subtitle: "Join thousands of users building amazing websites."
  },
  stickyHeader: { title: "Brand" },
  multiColumnFooter: { columns: "Product,Company,Support,Legal" },
  newsletterStrip: { 
    title: "Subscribe to our newsletter",
    buttonText: "Subscribe"
  },
  contactSplit: { 
    title: "Get in Touch",
    buttonText: "Send Message"
  },
  statsSection: { stats: "Users:10K+,Projects:500+,Countries:50+" },
  teamGrid: { count: 4 },
  blogPreviewGrid: { count: 3 },
  masonryGallery: { count: 6 },
};

function extractComponentsFromText(text: string): PuckComponentData[] {
  const components: PuckComponentData[] = [];
  const lowerText = text.toLowerCase();

  for (const [keyword, componentType] of Object.entries(COMPONENT_MAP)) {
    if (lowerText.includes(keyword)) {
      const props = { ...(DEFAULT_PROPS[componentType] || {}) };
      
      const titleMatch = text.match(new RegExp(`\\b${keyword}\\b\\s+(?:called|named|titled)\\s+["']?([^"'\\n]+)["']?`, 'i'));
      if (titleMatch) {
        props.content = titleMatch[1];
      }
      
      components.push({
        type: componentType,
        props,
      });
    }
  }

  return components;
}

function generateLayoutFromComponents(components: PuckComponentData[]): PuckData {
  if (components.length === 0) {
    return {
      content: [],
      root: { type: "Fragment", props: {} },
    };
  }

  const hasHero = components.some(c => c.type === "splitHero" || c.type === "centerHero");
  const hasFeatures = components.some(c => c.type === "featureGrid");
  const hasPricing = components.some(c => c.type === "pricingTable");
  const hasCTA = components.some(c => c.type === "ctaBox");
  const hasFooter = components.some(c => c.type === "multiColumnFooter");

  const orderedComponents: PuckComponentData[] = [];
  
  if (hasHero) {
    const hero = components.find(c => c.type === "splitHero" || c.type === "centerHero");
    if (hero) orderedComponents.push(hero);
  } else {
    const heading: PuckComponentData = {
      type: "centerHero",
      props: { title: "Welcome", subtitle: "Start building your project" },
    };
    orderedComponents.push(heading);
  }

  const featureComponents = components.filter(c => c.type === "featureGrid");
  orderedComponents.push(...featureComponents);

  const pricingComponent = components.find(c => c.type === "pricingTable");
  if (pricingComponent) orderedComponents.push(pricingComponent);

  const ctaComponent = components.find(c => c.type === "ctaBox");
  if (ctaComponent) orderedComponents.push(ctaComponent);

  const footerComponent = components.find(c => c.type === "multiColumnFooter");
  if (footerComponent) orderedComponents.push(footerComponent);

  const remaining = components.filter(c => 
    !orderedComponents.includes(c) && 
    c.type !== "stickyHeader"
  );
  orderedComponents.push(...remaining);

  const navComponent = components.find(c => c.type === "stickyHeader");
  if (navComponent) {
    orderedComponents.unshift(navComponent);
  }

  return {
    content: orderedComponents,
    root: { type: "Fragment", props: {} },
  };
}

export function convertTextToPuckData(text: string): PuckData {
  const components = extractComponentsFromText(text);
  
  if (components.length > 0) {
    return generateLayoutFromComponents(components);
  }
  
  const genericComponents: PuckComponentData[] = [
    {
      type: "centerHero",
      props: {
        title: "My Project",
        subtitle: "Built with AI",
      },
    },
    {
      type: "ctaBox",
      props: {
        title: "Get Started",
        buttonText: "Sign Up",
      },
    },
  ];
  
  return generateLayoutFromComponents(genericComponents);
}

export async function sendToAIBuilder(
  prompt: string,
  existingData?: PuckData
): Promise<AIBuildResult> {
  const contextInfo = existingData 
    ? `\n\nCurrent page has these components: ${existingData.content.map(c => c.type).join(", ")}`
    : "";

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Build a website/page based on this request: ${prompt}. Create appropriate Puck components. Respond with component names and their properties.${contextInfo}`,
      agentId: "builder-default",
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const json = await response.json();
  const puckData = convertTextToPuckData(json.result?.response || prompt);

  return {
    puckData,
    response: json.result?.response || "",
    confessions: json.result?.confessions || [],
  };
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