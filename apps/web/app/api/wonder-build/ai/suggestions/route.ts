/**
 * POST /api/wonder-build/ai/suggestions
 * Analyzes user prompt and suggests blocks using LLM
 * Returns streamed or batched suggestions with explanations
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface SuggestionRequest {
  prompt: string;
  currentBlocks: string[];
  availableBlocks: string[];
}

interface BlockSuggestion {
  blockId: string;
  reason: string;
  confidence: number;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentBlocks, availableBlocks } =
      (await req.json()) as SuggestionRequest;

    if (!prompt || !availableBlocks) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call your LLM (e.g., Anthropic, OpenAI, OpenRouter)
    // For now, return a mock response
    const suggestions: BlockSuggestion[] = generateMockSuggestions(
      prompt,
      currentBlocks,
      availableBlocks
    );

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    console.error("Error in AI suggestions:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Mock suggestion generator
 * Replace with real LLM call
 */
function generateMockSuggestions(
  prompt: string,
  currentBlocks: string[],
  availableBlocks: string[]
): BlockSuggestion[] {
  const promptLower = prompt.toLowerCase();

  const suggestions: BlockSuggestion[] = [];

  // Simple keyword matching for demo
  const blockScores: Record<string, number> = {};

  availableBlocks.forEach((block) => {
    let score = 0;

    // Keyword matching
    if (promptLower.includes("button") && block.includes("button"))
      score += 0.9;
    if (promptLower.includes("form") && block.includes("form")) score += 0.9;
    if (promptLower.includes("card") && block.includes("card")) score += 0.85;
    if (promptLower.includes("grid") && block.includes("grid")) score += 0.8;
    if (promptLower.includes("hero") && block.includes("hero")) score += 0.85;
    if (promptLower.includes("text") && block.includes("text")) score += 0.7;
    if (promptLower.includes("image") && block.includes("image")) score += 0.7;
    if (promptLower.includes("heading") && block.includes("heading"))
      score += 0.8;
    if (promptLower.includes("ai") && block.includes("ai")) score += 0.95;

    // Generic layout suggestions
    if (
      promptLower.includes("layout") ||
      promptLower.includes("build") ||
      promptLower.includes("page")
    ) {
      if (block.includes("container")) score += 0.6;
      if (block.includes("grid")) score += 0.5;
    }

    // Generic suggestions
    if (score === 0) {
      if (
        block.includes("heading") ||
        block.includes("button") ||
        block.includes("card")
      )
        score = 0.4; // Fallback suggestions
    }

    // Penalize already-added blocks
    if (currentBlocks.includes(block)) score *= 0.5;

    if (score > 0) {
      blockScores[block] = score;
    }
  });

  // Sort and take top suggestions
  const sorted = Object.entries(blockScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  sorted.forEach(([blockId, score]) => {
    suggestions.push({
      blockId,
      reason: generateReason(blockId, prompt),
      confidence: score,
      explanation: generateExplanation(blockId, prompt),
    });
  });

  return suggestions;
}

function generateReason(blockId: string, prompt: string): string {
  const blockReasons: Record<string, string> = {
    button: "Perfect for user interactions and CTAs",
    form: "Great for collecting user input",
    card: "Ideal for displaying grouped content",
    grid: "Responsive layout for multiple items",
    hero: "Eye-catching section for your landing page",
    heading: "Clear section titles and hierarchy",
    image: "Visual content that speaks volumes",
    container: "Flexible container for layout control",
    aiBlock: "Add an AI assistant to your page",
    text: "Descriptive or body content",
    row: "Horizontal alignment of elements",
    testimonial: "Social proof and credibility",
  };

  return blockReasons[blockId] || "Good addition to your layout";
}

function generateExplanation(blockId: string, prompt: string): string {
  const blockExplanations: Record<string, string> = {
    button:
      "Buttons encourage user action. Use them for primary CTAs or secondary actions.",
    form: "Forms gather data from users. Add inputs, labels, and validation for best UX.",
    card: "Cards are great for organizing related content. Stack them in grids for impact.",
    grid: "Grids create responsive layouts that adapt to all screen sizes.",
    hero: "Hero sections grab attention. Pair with a heading and CTA for maximum effect.",
    heading: "Headings organize content hierarchically (H1 for main, H2-H6 for subsections).",
    image: "Images break up text and add visual interest. Compress for performance.",
    container:
      "Containers let you control spacing, alignment, and background. Great for organizing.",
    aiBlock:
      "An AI block lets visitors ask questions and get instant answers. Modern and interactive!",
    text: "Body text tells your story. Keep it concise and scannable.",
    row: "Rows arrange elements horizontally. Combine with gaps for clean layouts.",
    testimonial:
      "Testimonials build trust. Use quotes from satisfied customers or users.",
  };

  return (
    blockExplanations[blockId] || "This block will enhance your page design."
  );
}
