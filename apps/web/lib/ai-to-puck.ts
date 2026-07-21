import { logger } from '@/lib/logger';
/**
 * Converts AI-generated HTML into Puck editor data structure
 */

export interface PuckBlock {
  type: string;
  props: Record<string, any>;
}

export interface PuckData {
  content: PuckBlock[];
  root?: {
    type: string;
    props: Record<string, any>;
  };
}

/**
 * Parse HTML string and convert to Puck blocks
 * This handles common HTML structures and maps them to available Puck components
 */
export async function htmlToPuckBlocks(htmlString: string): Promise<PuckData> {
  const blocks: PuckBlock[] = [];

  if (!htmlString || typeof htmlString !== "string") {
    return { content: [] };
  }

  try {
    // Create a temporary DOM parser
    const parser = new (typeof window !== "undefined"
      ? window.DOMParser
      : (await import("jsdom")).JSDOM)();

    const doc =
      typeof window !== "undefined"
        ? new DOMParser().parseFromString(htmlString, "text/html")
        : new ((await import("jsdom")).JSDOM)(htmlString).window.document;

    const bodyElements = doc.body?.children || [];

    for (const element of Array.from(bodyElements)) {
      const block = parseHtmlElement(element as HTMLElement);
      if (block) {
        blocks.push(block);
      }
    }
  } catch (error) {
    logger.error("[AI to Puck] Parse error:", error);
    // Fallback: create a single text block with the HTML
    return {
      content: [
        {
          type: "typography",
          props: { content: htmlString.substring(0, 200) },
        },
      ],
    };
  }

  return { content: blocks };
}

/**
 * Parse individual HTML elements into Puck blocks
 */
function parseHtmlElement(element: HTMLElement): PuckBlock | null {
  const tag = element.tagName.toLowerCase();
  const textContent = element.textContent?.trim() || "";
  const classes = element.className || "";

  // Headings
  if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
    return {
      type: "heading",
      props: {
        content: textContent,
        level: getLevelFromTag(tag),
        style: classes,
      },
    };
  }

  // Buttons
  if (tag === "button" || (tag === "a" && classes.includes("button"))) {
    return {
      type: "button",
      props: {
        content: textContent,
        variant: getVariantFromClasses(classes),
        size: getSizeFromClasses(classes),
        href: tag === "a" ? element.getAttribute("href") : undefined,
      },
    };
  }

  // Cards (look for divs with card-like classes)
  if (
    tag === "div" &&
    (classes.includes("card") ||
      classes.includes("rounded-lg") ||
      classes.includes("border"))
  ) {
    const title = element.querySelector("h2, h3, h4")?.textContent?.trim() || "";
    const description = element.querySelector("p")?.textContent?.trim() || "";
    return {
      type: "card",
      props: {
        title: title || "Card Title",
        description: description || "",
        body: textContent.substring(0, 200),
        variant: "default",
      },
    };
  }

  // Paragraphs
  if (tag === "p") {
    return {
      type: "typography",
      props: {
        content: textContent,
        style: classes,
      },
    };
  }

  // Images
  if (tag === "img") {
    return {
      type: "image",
      props: {
        src: element.getAttribute("src") || "",
        alt: element.getAttribute("alt") || "",
        style: classes,
      },
    };
  }

  // Badge / Span
  if (tag === "span" || tag === "badge") {
    return {
      type: "badge",
      props: {
        content: textContent,
        variant: getVariantFromClasses(classes),
      },
    };
  }

  // Lists
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(element.querySelectorAll("li"))
      .map((li) => li.textContent?.trim() || "")
      .filter((text) => text);
    return {
      type: "typography",
      props: {
        content: items.join("\n"),
        style: classes,
      },
    };
  }

  return null;
}

function getLevelFromTag(
  tag: string
): "text-4xl font-bold" | "text-3xl font-semibold" | "text-2xl font-semibold" | "text-xl font-medium" {
  const levels: Record<
    string,
    "text-4xl font-bold" | "text-3xl font-semibold" | "text-2xl font-semibold" | "text-xl font-medium"
  > = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-semibold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-medium",
  };
  return levels[tag] || "text-3xl font-semibold";
}

function getVariantFromClasses(classes: string): string {
  if (classes.includes("destructive") || classes.includes("red")) {
    return "bg-red-600 hover:bg-red-700";
  }
  if (classes.includes("outline")) {
    return "border border-white/20 bg-transparent hover:bg-white/10";
  }
  if (classes.includes("ghost")) {
    return "bg-transparent hover:bg-white/10";
  }
  if (classes.includes("secondary")) {
    return "bg-white/10 text-white";
  }
  return "bg-violet-600 hover:bg-violet-700";
}

function getSizeFromClasses(classes: string): string {
  if (classes.includes("large") || classes.includes("lg")) {
    return "px-6 py-3 text-base";
  }
  if (classes.includes("small") || classes.includes("sm")) {
    return "px-3 py-1.5 text-xs";
  }
  return "px-4 py-2 text-sm";
}

/**
 * Store Puck data in session storage for retrieval after navigation
 */
export function storePuckData(data: PuckData): string {
  const key = `puck-ai-${Date.now()}`;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
  return key;
}

/**
 * Retrieve and clear Puck data from session storage
 */
export function retrievePuckData(key: string): PuckData | null {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(key);
  if (stored) {
    sessionStorage.removeItem(key);
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}
