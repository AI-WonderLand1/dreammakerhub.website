/**
 * Convert AI-generated HTML to Puck blocks
 */

interface PuckBlock {
  type: string;
  props: Record<string, unknown>;
}

interface PuckContent {
  content: PuckBlock[];
  root?: { type: string; props: Record<string, unknown> };
}

const TAG_TO_COMPONENT: Record<string, string> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  p: "typography",
  button: "button",
  a: "link",
  input: "input",
  blockquote: "blockquote",
  hr: "divider",
};

const HEADING_LEVELS: Record<string, string> = {
  h1: "text-4xl font-bold",
  h2: "text-3xl font-semibold",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-medium",
  h5: "text-lg font-medium",
  h6: "text-base font-medium",
};

function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttributes(html: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  const classMatch = html.match(/class=["']([^"']*)["']/i);
  if (classMatch) attrs.className = classMatch[1];
  
  const hrefMatch = html.match(/href=["']([^"']*)["']/i);
  if (hrefMatch) attrs.href = hrefMatch[1];
  
  const styleMatch = html.match(/style=["']([^"']*)["']/i);
  if (styleMatch) attrs.style = styleMatch[1];
  
  const srcMatch = html.match(/src=["']([^"']*)["']/i);
  if (srcMatch) attrs.src = srcMatch[1];
  
  const placeholderMatch = html.match(/placeholder=["']([^"']*)["']/i);
  if (placeholderMatch) attrs.placeholder = placeholderMatch[1];
  
  return attrs;
}

function parseButtonElement(html: string): PuckBlock {
  const text = extractTextContent(html);
  const attrs = extractAttributes(html);
  
  let variant = "bg-violet-600 hover:bg-violet-700";
  if (attrs.className?.includes("outline") || attrs.className?.includes("border")) {
    variant = "border border-white/20 bg-transparent hover:bg-white/10";
  } else if (attrs.className?.includes("ghost")) {
    variant = "bg-transparent hover:bg-white/10";
  } else if (attrs.className?.includes("red") || attrs.className?.includes("destructive")) {
    variant = "bg-red-600 hover:bg-red-700";
  }
  
  return {
    type: "button",
    props: {
      content: text,
      variant,
      size: "px-4 py-2 text-sm",
      style: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    },
  };
}

function parseHeadingElement(html: string, tag: string): PuckBlock {
  const text = extractTextContent(html);
  
  return {
    type: "heading",
    props: {
      content: text,
      level: HEADING_LEVELS[tag] || "text-3xl font-semibold",
      style: "text-white mb-4",
    },
  };
}

function parseTypographyElement(html: string): PuckBlock {
  const text = extractTextContent(html);
  
  return {
    type: "typography",
    props: {
      content: text,
      style: "text-white/80",
    },
  };
}

function parseLinkElement(html: string): PuckBlock {
  const text = extractTextContent(html);
  const attrs = extractAttributes(html);
  
  return {
    type: "link",
    props: {
      content: text,
      url: attrs.href || "#",
      style: "text-violet-400 hover:text-violet-300 underline",
    },
  };
}

function parseInputElement(html: string): PuckBlock {
  const attrs = extractAttributes(html);
  
  return {
    type: "input",
    props: {
      content: attrs.placeholder || "Enter text...",
      label: "",
      style: "bg-white/5 border border-white/20 rounded-lg",
    },
  };
}

function parseBlockquoteElement(html: string): PuckBlock {
  const text = extractTextContent(html);
  
  return {
    type: "blockquote",
    props: {
      content: text,
      style: "border-l-4 border-violet-500 pl-4 italic text-white/70",
    },
  };
}

function parseListElement(html: string, ordered: boolean): PuckBlock {
  const items: string[] = [];
  const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while ((match = itemRegex.exec(html)) !== null) {
    items.push(extractTextContent(match[1]));
  }
  
  const text = items.join(", ");
  
  return {
    type: "typography",
    props: {
      content: text,
      style: "text-white/80",
    },
  };
}

function parseSectionElement(html: string): PuckBlock[] {
  const blocks: PuckBlock[] = [];
  
  const sectionRegex = /<(section|div|article|main|header|footer)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = sectionRegex.exec(html)) !== null) {
    const innerBlocks = parseHtmlToBlocks(match[2]);
    blocks.push(...innerBlocks);
  }
  
  return blocks;
}

function detectHeroComponent(html: string): PuckBlock | null {
  const lowerHtml = html.toLowerCase();
  const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html);
  const hasButton = /<button[^>]*>[\s\S]*?<\/button>/i.test(html) || /<a[^>]*class="[^"]*btn[^"]*"[^>]*>/i.test(html);
  const hasLargeText = hasH1;
  
  if (hasLargeText && hasButton) {
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const subtitleMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const buttonMatch = html.match(/<button[^>]*>([\s\S]*?)<\/button>/i) || html.match(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    
    const title = titleMatch ? extractTextContent(titleMatch[1]) : "Welcome";
    const subtitle = subtitleMatch ? extractTextContent(subtitleMatch[1]) : "Build something amazing";
    const ctaText = buttonMatch ? extractTextContent(buttonMatch[1]) : "Get Started";
    
    if (lowerHtml.includes("center") || lowerHtml.includes("text-center")) {
      return {
        type: "centerHero",
        props: {
          title,
          subtitle,
        },
      };
    }
    
    return {
      type: "splitHero",
      props: {
        title,
        subtitle,
        ctaText,
      },
    };
  }
  
  return null;
}

function detectFeatureGrid(html: string): PuckBlock | null {
  const cardCount = (html.match(/<(div|article|section)[^>]*class="[^"]*(card|feature|grid-item)[^"]*"[^>]*>/gi) || []).length;
  const hasGrid = /class="[^"]*grid[^"]*"/i.test(html);
  const hasMultipleCards = cardCount >= 3 || (html.match(/<div[^>]*>/gi) || []).length >= 6;
  
  if (hasGrid && hasMultipleCards) {
    const features: string[] = [];
    const headingRegex = /<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const text = extractTextContent(match[1]);
      if (text.length < 50) features.push(text);
      if (features.length >= 4) break;
    }
    
    if (features.length === 0) {
      features.push("Feature 1", "Feature 2", "Feature 3");
    }
    
    return {
      type: "featureGrid",
      props: {
        features: features.join(","),
      },
    };
  }
  
  return null;
}

function detectPricingTable(html: string): PuckBlock | null {
  const lowerHtml = html.toLowerCase();
  const hasPricing = lowerHtml.includes("price") || lowerHtml.includes("$") || lowerHtml.includes("month") || lowerHtml.includes("plan");
  const hasMultipleCards = (html.match(/<div[^>]*class="[^"]*(card|plan|pricing)[^"]*"[^>]*>/gi) || []).length >= 2;
  
  if (hasPricing && hasMultipleCards) {
    const planNames: string[] = [];
    const headingRegex = /<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const text = extractTextContent(match[1]);
      if (text.length < 20) planNames.push(text);
      if (planNames.length >= 3) break;
    }
    
    if (planNames.length === 0) {
      planNames.push("Basic", "Pro", "Enterprise");
    }
    
    return {
      type: "pricingTable",
      props: {
        plans: planNames.join(","),
        price: "$9/mo",
      },
    };
  }
  
  return null;
}

function detectTestimonial(html: string): PuckBlock | null {
  const lowerHtml = html.toLowerCase();
  const hasQuote = lowerHtml.includes("quote") || /"[^"]{20,}"/.test(html);
  const hasAuthor = lowerHtml.includes("author") || lowerHtml.includes("name") || /—\s*\w+/.test(html);
  
  if (hasQuote || hasAuthor) {
    const quoteMatch = html.match(/"([^"]{20,})"/);
    const quote = quoteMatch ? quoteMatch[1] : "This product changed my life!";
    
    return {
      type: "testimonialCard",
      props: {
        quote,
        author: "Happy Customer",
      },
    };
  }
  
  return null;
}

function detectCTABox(html: string): PuckBlock | null {
  const lowerHtml = html.toLowerCase();
  const hasCTA = lowerHtml.includes("get started") || lowerHtml.includes("sign up") || lowerHtml.includes("subscribe");
  const hasButton = /<button[^>]*>[\s\S]*?<\/button>/i.test(html);
  const isCompact = html.length < 2000;
  
  if (hasCTA && hasButton && isCompact) {
    const titleMatch = html.match(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/i);
    const title = titleMatch ? extractTextContent(titleMatch[1]) : "Ready to get started?";
    
    return {
      type: "ctaBox",
      props: {
        title,
        buttonText: "Get Started",
      },
    };
  }
  
  return null;
}

function detectNewsletter(html: string): PuckBlock | null {
  const lowerHtml = html.toLowerCase();
  const hasNewsletter = lowerHtml.includes("newsletter") || lowerHtml.includes("subscribe") || lowerHtml.includes("email");
  const hasEmailInput = lowerHtml.includes('type="email"') || lowerHtml.includes('placeholder') && lowerHtml.includes('email');
  
  if (hasNewsletter && hasEmailInput) {
    return {
      type: "newsletterStrip",
      props: {
        title: "Subscribe to our newsletter",
      },
    };
  }
  
  return null;
}

function detectComponentPatterns(html: string): PuckBlock[] {
  const blocks: PuckBlock[] = [];
  
  const heroBlock = detectHeroComponent(html);
  if (heroBlock) blocks.push(heroBlock);
  
  const featureBlock = detectFeatureGrid(html);
  if (featureBlock) blocks.push(featureBlock);
  
  const pricingBlock = detectPricingTable(html);
  if (pricingBlock) blocks.push(pricingBlock);
  
  const testimonialBlock = detectTestimonial(html);
  if (testimonialBlock) blocks.push(testimonialBlock);
  
  const ctaBlock = detectCTABox(html);
  if (ctaBlock) blocks.push(ctaBlock);
  
  const newsletterBlock = detectNewsletter(html);
  if (newsletterBlock) blocks.push(newsletterBlock);
  
  return blocks;
}

function parseBasicElements(html: string): PuckBlock[] {
  const blocks: PuckBlock[] = [];
  
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    
    if (content.trim()) {
      blocks.push(parseHeadingElement(content, tag));
    }
  }
  
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = paragraphRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.trim()) {
      blocks.push(parseTypographyElement(content));
    }
  }
  
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    blocks.push(parseButtonElement(match[0]));
  }
  
  const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const linkContent = match[0];
    if (!linkContent.includes("<button") && !linkContent.includes('class="[^"]*btn')) {
      blocks.push(parseLinkElement(linkContent));
    }
  }
  
  const inputRegex = /<input[^>]*>/gi;
  while ((match = inputRegex.exec(html)) !== null) {
    blocks.push(parseInputElement(match[0]));
  }
  
  const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  while ((match = blockquoteRegex.exec(html)) !== null) {
    blocks.push(parseBlockquoteElement(match[0]));
  }
  
  const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
  while ((match = ulRegex.exec(html)) !== null) {
    blocks.push(parseListElement(match[0], false));
  }
  
  const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  while ((match = olRegex.exec(html)) !== null) {
    blocks.push(parseListElement(match[0], true));
  }
  
  if (/<hr[^>]*>/i.test(html)) {
    blocks.push({
      type: "divider",
      props: { style: "border-t border-white/10 my-4" },
    });
  }
  
  return blocks;
}

export function parseHtmlToBlocks(html: string): PuckBlock[] {
  const blocks: PuckBlock[] = [];
  
  const cleanedHtml = html
    .replace(/<!DOCTYPE[^>]*>/i, "")
    .replace(/<html[^>]*>[\s\S]*<\/html>/i, (match) => {
      const bodyMatch = match.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      return bodyMatch ? bodyMatch[1] : match;
    })
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  const patternBlocks = detectComponentPatterns(cleanedHtml);
  blocks.push(...patternBlocks);
  
  if (blocks.length < 3) {
    const basicBlocks = parseBasicElements(cleanedHtml);
    
    for (const block of basicBlocks) {
      const isDuplicate = blocks.some(
        (existing) =>
          existing.type === block.type &&
          JSON.stringify(existing.props) === JSON.stringify(block.props)
      );
      
      if (!isDuplicate) {
        blocks.push(block);
      }
    }
  }
  
  if (blocks.length === 0) {
    const mainText = extractTextContent(cleanedHtml);
    if (mainText.length > 50) {
      blocks.push({
        type: "centerHero",
        props: {
          title: "Generated Website",
          subtitle: mainText.slice(0, 100) + "...",
        },
      });
    }
  }
  
  return blocks;
}

export function convertHtmlToPuck(html: string, prompt?: string): PuckContent {
  const blocks = parseHtmlToBlocks(html);
  
  const title = prompt ? prompt.slice(0, 50) : "Generated Website";
  
  if (blocks.length === 0) {
    return {
      content: [
        {
          type: "centerHero",
          props: {
            title,
            subtitle: "Your AI-generated website is ready to customize",
          },
        },
        {
          type: "featureGrid",
          props: {
            features: "Fast,Secure,Scalable",
          },
        },
        {
          type: "ctaBox",
          props: {
            title: "Ready to get started?",
            buttonText: "Get Started",
          },
        },
      ],
      root: {
        type: "Fragment",
        props: {},
      },
    };
  }
  
  return {
    content: blocks,
    root: {
      type: "Fragment",
      props: {},
    },
  };
}