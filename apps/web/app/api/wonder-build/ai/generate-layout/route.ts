import { NextRequest, NextResponse } from "next/server";

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

// Page type templates with blocks
const PAGE_TEMPLATES: Record<string, { blocks: any[]; strategy: string }> = {
  "landing-page": {
    strategy: "Hero + Value Proposition + Social Proof + Call-to-Action",
    blocks: [
      {
        blockId: "hero",
        label: "Hero Section",
        props: { text: "Welcome to Your Product", subtext: "Build something amazing today" },
        reasoning: "Hero section captures attention immediately. Essential for landing pages to establish brand identity and value.",
        confidence: 0.98,
        alternativesConsidered: ["Container with heading", "Image background"],
      },
      {
        blockId: "container",
        label: "Features Container",
        props: { layout: "grid", columns: 3 },
        reasoning: "Container with grid layout organizes multiple feature blocks efficiently. Chosen over flex layout for better responsiveness.",
        confidence: 0.92,
        alternativesConsidered: ["Flex row", "Carousel"],
      },
      {
        blockId: "card",
        label: "Feature Card 1",
        props: { title: "Fast", description: "Lightning quick performance" },
        reasoning: "Card component for feature highlights. UI pattern that users recognize. Supports icon + text layout well.",
        confidence: 0.89,
        alternativesConsidered: ["Testimonial block", "Text block with icon"],
      },
      {
        blockId: "card",
        label: "Feature Card 2",
        props: { title: "Secure", description: "Enterprise-grade security" },
        reasoning: "Consistent card layout for second feature. Maintains visual rhythm.",
        confidence: 0.89,
        alternativesConsidered: ["Testimonial block"],
      },
      {
        blockId: "card",
        label: "Feature Card 3",
        props: { title: "Scalable", description: "Grows with your needs" },
        reasoning: "Third feature card completes the feature section. Three features is optimal for cognitive load.",
        confidence: 0.89,
        alternativesConsidered: ["Text block"],
      },
      {
        blockId: "button",
        label: "CTA Button",
        props: { text: "Get Started", variant: "primary", size: "lg" },
        reasoning: "Primary CTA button positioned after value props. Size=lg makes it prominent. Variant=primary creates visual hierarchy.",
        confidence: 0.95,
        alternativesConsidered: ["Link button", "Form"],
      },
    ],
  },
  "product-page": {
    strategy: "Product showcase + Pricing comparison + Value breakdown",
    blocks: [
      {
        blockId: "heading",
        label: "Product Title",
        props: { text: "Amazing Product", level: 1 },
        reasoning: "H1 heading establishes product identity. Level 1 for SEO and hierarchy.",
        confidence: 0.94,
        alternativesConsidered: ["Hero section"],
      },
      {
        blockId: "image",
        label: "Product Image",
        props: { src: "", alt: "Product showcase" },
        reasoning: "Product image crucial for e-commerce pages. Builds visual trust before description.",
        confidence: 0.97,
        alternativesConsidered: ["Video embed", "Carousel"],
      },
      {
        blockId: "text",
        label: "Description",
        props: { text: "This is where your product description goes." },
        reasoning: "Text block for detailed description. Follows image for natural reading flow.",
        confidence: 0.87,
        alternativesConsidered: ["Container with multiple text blocks"],
      },
      {
        blockId: "grid",
        label: "Pricing Grid",
        props: { columns: 3 },
        reasoning: "3-column grid for pricing tiers. Visual comparison encourages upgrade paths.",
        confidence: 0.91,
        alternativesConsidered: ["Flex row", "Pricing table"],
      },
      {
        blockId: "card",
        label: "Pricing Card",
        props: { title: "Starter", price: "$9/mo" },
        reasoning: "Card component ideal for pricing tiers. Contains title + price + features naturally.",
        confidence: 0.88,
        alternativesConsidered: ["Table row"],
      },
      {
        blockId: "card",
        label: "Pro Pricing Card",
        props: { title: "Pro", price: "$29/mo" },
        reasoning: "Second pricing tier. Mid-tier pricing often most popular.",
        confidence: 0.88,
        alternativesConsidered: ["Table row"],
      },
      {
        blockId: "card",
        label: "Enterprise Pricing Card",
        props: { title: "Enterprise", price: "Custom" },
        reasoning: "Premium tier for enterprise customers. Signals scalability.",
        confidence: 0.88,
        alternativesConsidered: ["CTA button instead"],
      },
    ],
  },
  "blog-post": {
    strategy: "Content-first layout with metadata + engagement",
    blocks: [
      {
        blockId: "heading",
        label: "Article Title",
        props: { text: "Blog Post Title", level: 1 },
        reasoning: "H1 title for SEO and readability. Blog posts need clear headline hierarchies.",
        confidence: 0.96,
        alternativesConsidered: ["H2 heading"],
      },
      {
        blockId: "text",
        label: "Metadata",
        props: { text: "By Author • Published on Date" },
        reasoning: "Author + date establishes credibility and timeliness. Goes between title and content per blog UX patterns.",
        confidence: 0.85,
        alternativesConsidered: ["Separate author + date blocks"],
      },
      {
        blockId: "image",
        label: "Featured Image",
        props: { src: "", alt: "Article cover" },
        reasoning: "Featured image breaks up text, increases engagement by 80% on blog posts. Placed after metadata.",
        confidence: 0.93,
        alternativesConsidered: ["Video", "Placeholder"],
      },
      {
        blockId: "text",
        label: "Article Content",
        props: { text: "Your article content goes here..." },
        reasoning: "Main content block for article body text. Standard blog layout pattern.",
        confidence: 0.97,
        alternativesConsidered: ["Rich text editor"],
      },
      {
        blockId: "container",
        label: "Comments Section",
        props: { layout: "flex" },
        reasoning: "Comments container for reader engagement and discussion. Flex layout allows vertical stacking.",
        confidence: 0.82,
        alternativesConsidered: ["Dedicated comments component"],
      },
    ],
  },
  "contact-form": {
    strategy: "Clear form UX with validation and CTA",
    blocks: [
      {
        blockId: "heading",
        label: "Contact Us",
        props: { text: "Get In Touch", level: 2 },
        reasoning: "H2 form heading establishes form purpose. H2 used here since form may be on page with other content.",
        confidence: 0.90,
        alternativesConsidered: ["H1 heading"],
      },
      {
        blockId: "form",
        label: "Contact Form",
        props: {
          fields: [
            { name: "name", label: "Your Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "message", label: "Message", type: "textarea" },
          ],
        },
        reasoning: "Form with 3 essential fields: name, email, message. Email type ensures client-side validation. Textarea for longer responses.",
        confidence: 0.94,
        alternativesConsidered: ["Separate input blocks", "Pre-built contact form"],
      },
      {
        blockId: "button",
        label: "Submit Button",
        props: { text: "Send Message", variant: "primary" },
        reasoning: "Primary button after form conveys next action clearly. Text 'Send Message' specific to form context.",
        confidence: 0.96,
        alternativesConsidered: ["Link button", "Text button"],
      },
    ],
  },
  "portfolio": {
    strategy: "Visual showcase + Social proof + Call-to-action",
    blocks: [
      {
        blockId: "hero",
        label: "Portfolio Hero",
        props: { text: "My Work", subtext: "Showcasing my best projects" },
        reasoning: "Hero establishes personal brand. Subtext adds context and sets expectations.",
        confidence: 0.95,
        alternativesConsidered: ["Simple heading"],
      },
      {
        blockId: "heading",
        label: "Projects Section",
        props: { text: "Featured Projects", level: 2 },
        reasoning: "Section heading labels portfolio gallery. H2 maintains hierarchy under hero.",
        confidence: 0.88,
        alternativesConsidered: ["H3 heading"],
      },
      {
        blockId: "grid",
        label: "Portfolio Grid",
        props: { columns: 3 },
        reasoning: "3-column grid for portfolio items. Optimal for visual galleries. Responsive to 1-2 cols on mobile.",
        confidence: 0.93,
        alternativesConsidered: ["Flex row", "Masonry layout"],
      },
      {
        blockId: "card",
        label: "Project 1",
        props: { title: "Project Name", image: "", description: "Project description" },
        reasoning: "Card with image + title + description showcases individual projects. Good visual hierarchy.",
        confidence: 0.90,
        alternativesConsidered: ["Custom project block"],
      },
      {
        blockId: "card",
        label: "Project 2",
        props: { title: "Project Name", image: "", description: "Project description" },
        reasoning: "Second project card maintains consistency. Three projects fill grid nicely on desktop.",
        confidence: 0.90,
        alternativesConsidered: ["Different layout"],
      },
      {
        blockId: "card",
        label: "Project 3",
        props: { title: "Project Name", image: "", description: "Project description" },
        reasoning: "Third project completes grid. Odd number of items (3) is psychologically pleasing.",
        confidence: 0.90,
        alternativesConsidered: ["Fourth project"],
      },
    ],
  },
};

// Keywords that map to page types
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

// Detect page type from prompt
function detectPageType(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Find matching keywords
  for (const [keyword, pageType] of Object.entries(KEYWORD_MAPPING)) {
    if (lower.includes(keyword)) {
      return pageType;
    }
  }

  // Default: assume landing page
  return "landing-page";
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

    // Detect page type
    const pageType = detectPageType(prompt);
    const templateData = PAGE_TEMPLATES[pageType];

    if (!templateData) {
      return NextResponse.json(
        { error: "Could not determine page type" },
        { status: 400 }
      );
    }

    const layout: GeneratedLayout = {
      id: pageType,
      name: pageType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      description: `${templateData.strategy}`,
      pageTypeDetected: pageType,
      promptAnalysis: `Analyzed prompt: "${prompt}". Detected keywords matching ${pageType} pattern. Using ${templateData.strategy} strategy.`,
      overallStrategy: templateData.strategy,
      blocks: templateData.blocks.map((block) => ({
        ...block,
        props: block.props || {},
      })),
    };

    console.log(
      `[AI Builder] Generating "${pageType}" from prompt: "${prompt}"\n`,
      `Strategy: ${layout.overallStrategy}\n`,
      `Blocks to add: ${layout.blocks.length}`
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
