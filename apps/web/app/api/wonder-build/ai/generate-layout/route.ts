import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface BlockGeneration {
  blockId: string;
  label: string;
  props: Record<string, any>;
  reasoning: string;
  confidence: number;
  alternativesConsidered: string[];
}

interface GeneratedLayout {
  id: string;
  name: string;
  blocks: BlockGeneration[];
  description: string;
  pageTypeDetected: string;
  promptAnalysis: string;
  overallStrategy: string;
}

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

const SYSTEM_PROMPT = `You are an AI layout generator for a visual web page builder.

Given a user's description of what they want to build, generate a complete page layout.

You MUST respond in this exact JSON format:
{
  "id": "page-type-kebab-case",
  "name": "Human Readable Name",
  "description": "Brief strategy description",
  "pageTypeDetected": "page-type-kebab-case",
  "promptAnalysis": "Analysis of the user's request",
  "overallStrategy": "Overall layout strategy",
  "blocks": [
    {
      "blockId": "one of: hero, heading, text, button, form, card, grid, image, container, row, input, testimonial, aiBlock",
      "label": "Human-readable label for this block",
      "props": { "text": "...", ... other props },
      "reasoning": "Why this block was chosen and positioned here",
      "confidence": 0.95,
      "alternativesConsidered": ["other-block-id"]
    }
  ]
}

Available block types: hero, heading, text, button, form, card, grid, image, container, row, input, testimonial, aiBlock
Generate 4-8 blocks that form a cohesive page layout.
Always include reasoning for each block choice.`;

const FALLBACK_TEMPLATES: Record<string, { blocks: any[]; strategy: string }> = {
  "landing-page": {
    strategy: "Hero + Value Proposition + Social Proof + Call-to-Action",
    blocks: [
      { blockId: "hero", label: "Hero Section", props: { text: "Welcome to Your Product", subtext: "Build something amazing today" }, reasoning: "Hero section captures attention immediately.", confidence: 0.98, alternativesConsidered: ["Container with heading"] },
      { blockId: "container", label: "Features Container", props: { layout: "grid", columns: 3 }, reasoning: "Container with grid layout organizes feature blocks.", confidence: 0.92, alternativesConsidered: ["Flex row"] },
      { blockId: "card", label: "Feature Card 1", props: { title: "Fast", description: "Lightning quick performance" }, reasoning: "Card component for feature highlights.", confidence: 0.89, alternativesConsidered: ["Text block with icon"] },
      { blockId: "card", label: "Feature Card 2", props: { title: "Secure", description: "Enterprise-grade security" }, reasoning: "Consistent card layout.", confidence: 0.89, alternativesConsidered: ["Testimonial block"] },
      { blockId: "card", label: "Feature Card 3", props: { title: "Scalable", description: "Grows with your needs" }, reasoning: "Third feature card completes the section.", confidence: 0.89, alternativesConsidered: ["Text block"] },
      { blockId: "button", label: "CTA Button", props: { text: "Get Started", variant: "primary", size: "lg" }, reasoning: "Primary CTA button after value props.", confidence: 0.95, alternativesConsidered: ["Link button"] },
    ],
  },
  "product-page": {
    strategy: "Product showcase + Pricing comparison",
    blocks: [
      { blockId: "heading", label: "Product Title", props: { text: "Amazing Product", level: 1 }, reasoning: "H1 heading establishes product identity.", confidence: 0.94, alternativesConsidered: ["Hero section"] },
      { blockId: "image", label: "Product Image", props: { src: "", alt: "Product showcase" }, reasoning: "Product image for visual trust.", confidence: 0.97, alternativesConsidered: ["Carousel"] },
      { blockId: "text", label: "Description", props: { text: "Product description goes here." }, reasoning: "Text block for detailed description.", confidence: 0.87, alternativesConsidered: ["Container with multiple text blocks"] },
      { blockId: "grid", label: "Pricing Grid", props: { columns: 3 }, reasoning: "3-column grid for pricing tiers.", confidence: 0.91, alternativesConsidered: ["Flex row"] },
      { blockId: "card", label: "Pricing Card", props: { title: "Starter", price: "$9/mo" }, reasoning: "Card for pricing tiers.", confidence: 0.88, alternativesConsidered: ["Table row"] },
    ],
  },
  "blog-post": {
    strategy: "Content-first layout with engagement",
    blocks: [
      { blockId: "heading", label: "Article Title", props: { text: "Blog Post Title", level: 1 }, reasoning: "H1 title for SEO and readability.", confidence: 0.96, alternativesConsidered: ["H2 heading"] },
      { blockId: "text", label: "Metadata", props: { text: "By Author \u2022 Published on Date" }, reasoning: "Author + date establishes credibility.", confidence: 0.85, alternativesConsidered: ["Separate author + date blocks"] },
      { blockId: "image", label: "Featured Image", props: { src: "", alt: "Article cover" }, reasoning: "Featured image increases engagement.", confidence: 0.93, alternativesConsidered: ["Video"] },
      { blockId: "text", label: "Article Content", props: { text: "Your article content goes here..." }, reasoning: "Main content block.", confidence: 0.97, alternativesConsidered: ["Rich text editor"] },
    ],
  },
  "contact-form": {
    strategy: "Clear form UX with CTA",
    blocks: [
      { blockId: "heading", label: "Contact Us", props: { text: "Get In Touch", level: 2 }, reasoning: "H2 form heading.", confidence: 0.90, alternativesConsidered: ["H1 heading"] },
      { blockId: "form", label: "Contact Form", props: { fields: [{ name: "name", label: "Your Name", type: "text" }, { name: "email", label: "Email", type: "email" }, { name: "message", label: "Message", type: "textarea" }] }, reasoning: "Form with essential fields.", confidence: 0.94, alternativesConsidered: ["Separate input blocks"] },
      { blockId: "button", label: "Submit Button", props: { text: "Send Message", variant: "primary" }, reasoning: "Primary button after form.", confidence: 0.96, alternativesConsidered: ["Link button"] },
    ],
  },
  "portfolio": {
    strategy: "Visual showcase + Social proof",
    blocks: [
      { blockId: "hero", label: "Portfolio Hero", props: { text: "My Work", subtext: "Showcasing my best projects" }, reasoning: "Hero establishes personal brand.", confidence: 0.95, alternativesConsidered: ["Simple heading"] },
      { blockId: "heading", label: "Projects Section", props: { text: "Featured Projects", level: 2 }, reasoning: "Section heading labels gallery.", confidence: 0.88, alternativesConsidered: ["H3 heading"] },
      { blockId: "grid", label: "Portfolio Grid", props: { columns: 3 }, reasoning: "3-column grid for portfolio items.", confidence: 0.93, alternativesConsidered: ["Flex row"] },
      { blockId: "card", label: "Project 1", props: { title: "Project Name", image: "", description: "Project description" }, reasoning: "Card showcases individual projects.", confidence: 0.90, alternativesConsidered: ["Custom project block"] },
      { blockId: "card", label: "Project 2", props: { title: "Project Name", image: "", description: "Project description" }, reasoning: "Second project card.", confidence: 0.90, alternativesConsidered: ["Different layout"] },
      { blockId: "card", label: "Project 3", props: { title: "Project Name", image: "", description: "Project description" }, reasoning: "Third project completes grid.", confidence: 0.90, alternativesConsidered: ["Fourth project"] },
    ],
  },
};

const KEYWORD_MAPPING: Record<string, string> = {
  landing: "landing-page",
  hero: "landing-page",
  features: "landing-page",
  product: "product-page",
  pricing: "product-page",
  blog: "blog-post",
  article: "blog-post",
  post: "blog-post",
  contact: "contact-form",
  form: "contact-form",
  portfolio: "portfolio",
  projects: "portfolio",
};

function detectPageType(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const [keyword, pageType] of Object.entries(KEYWORD_MAPPING)) {
    if (lower.includes(keyword)) return pageType;
  }
  return "landing-page";
}

function generateFallbackLayout(prompt: string): GeneratedLayout {
  const pageType = detectPageType(prompt);
  const templateData = FALLBACK_TEMPLATES[pageType];

  return {
    id: pageType,
    name: pageType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: templateData.strategy,
    pageTypeDetected: pageType,
    promptAnalysis: `Analyzed prompt: "${prompt}". Detected keywords matching ${pageType} pattern. Using ${templateData.strategy} strategy.`,
    overallStrategy: templateData.strategy,
    blocks: templateData.blocks.map((block) => ({ ...block, props: block.props || {} })),
  };
}

async function callCerebras(prompt: string): Promise<string> {
  if (!CEREBRAS_API_KEY) throw new Error("Cerebras API key not configured");

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callHuggingFace(prompt: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HuggingFace token not configured");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/Phi-4-mini-instruct",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: `${SYSTEM_PROMPT}\n\nUser: ${prompt}`,
        parameters: { max_new_tokens: 4096, return_full_text: false },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || "";
}

function parseAIResponse(text: string, prompt: string): GeneratedLayout | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.blocks && Array.isArray(parsed.blocks)) return parsed;
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    let layout: GeneratedLayout | null = null;

    if (CEREBRAS_API_KEY) {
      try {
        const text = await callCerebras(`Generate a complete page layout for: "${prompt}"`);
        layout = parseAIResponse(text, prompt);
      } catch (err: any) {
        console.error("Cerebras failed for layout generation:", err.message);
      }
    }

    if (!layout && HF_TOKEN) {
      try {
        const text = await callHuggingFace(`Generate a complete page layout for: "${prompt}"`);
        layout = parseAIResponse(text, prompt);
      } catch (err: any) {
        console.error("HuggingFace failed for layout generation:", err.message);
      }
    }

    if (!layout) {
      layout = generateFallbackLayout(prompt);
    }

    console.log(
      `[AI Builder] Generated "${layout.pageTypeDetected}" layout from prompt: "${prompt}"\n`,
      `Strategy: ${layout.overallStrategy}\n`,
      `Blocks: ${layout.blocks.length}`
    );

    return NextResponse.json(layout);
  } catch (error) {
    console.error("Layout generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
