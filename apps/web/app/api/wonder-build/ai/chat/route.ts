/**
 * POST /api/wonder-build/ai/chat
 * Handles multi-turn AI chat for the builder
 * Returns response text and suggested blocks
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  currentBlocks: string[];
  history: ChatMessage[];
}

interface ChatResponse {
  response: string;
  suggestions: Array<{ blockId: string; reason: string }>;
}

const SYSTEM_PROMPT = `You are an AI assistant helping users build web pages using a visual builder.
Your role is to:
1. Understand what the user wants to build
2. Suggest appropriate blocks/components (Button, Card, Form, Grid, Hero, Image, Text, Heading, Container, AI Block, etc.)
3. Explain why each suggestion is good for their use case
4. Keep responses concise and friendly
5. Ask clarifying questions if needed

When suggesting blocks, format them as: [SUGGEST: blockId | reason]
Example: [SUGGEST: hero | Eye-catching header section]

Available blocks: button, form, card, grid, hero, heading, image, text, input, container, row, testimonial, aiBlock

Always be encouraging and creative!`;

export async function POST(req: NextRequest) {
  try {
    const { message, currentBlocks, history } = (await req.json()) as ChatRequest;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // For demo: call a mock LLM (replace with real Anthropic/OpenAI call)
    const { response, suggestions } = await generateAIResponse(
      message,
      currentBlocks,
      history
    );

    return NextResponse.json(
      { response, suggestions } as ChatResponse,
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in AI chat:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateAIResponse(
  userMessage: string,
  currentBlocks: string[],
  history: ChatMessage[]
): Promise<ChatResponse> {
  const messageLower = userMessage.toLowerCase();

  // Mock response with simple keyword matching
  let response = "";
  const suggestions: Array<{ blockId: string; reason: string }> = [];

  // Analyze user's intent
  if (
    messageLower.includes("form") ||
    messageLower.includes("contact") ||
    messageLower.includes("email")
  ) {
    response = `Great idea! I recommend adding a **Form Block** to collect user input. You could pair it with:
- A **Heading** to label what the form is for
- **Input fields** for name, email, message
- A **Button** to submit
This will give you a complete contact section!`;

    suggestions.push(
      { blockId: "heading", reason: "Label your form section" },
      { blockId: "form", reason: "Collect user input" },
      { blockId: "button", reason: "Submit the form" }
    );
  } else if (
    messageLower.includes("landing") ||
    messageLower.includes("hero") ||
    messageLower.includes("welcome")
  ) {
    response = `Perfect! A **Hero section** is ideal for a landing page. I'd suggest:
- **Hero Block** with a headline and CTA
- **Card blocks** below to highlight features
- Icons and images for visual interest
Let's build something impressive! 🚀`;

    suggestions.push(
      { blockId: "hero", reason: "Eye-catching header section" },
      { blockId: "card", reason: "Feature highlights" },
      { blockId: "image", reason: "Visual content" }
    );
  } else if (
    messageLower.includes("card") ||
    messageLower.includes("list") ||
    messageLower.includes("grid")
  ) {
    response = `**Card blocks** are perfect for displaying lists of items! Combine with a **Grid** for layout:
- Use a **Grid block** (2-3 columns) as the container
- Add **Card blocks** inside for each item
- Include **Images**, **Text**, and **Buttons** in each card
This creates a scalable, responsive product showcase!`;

    suggestions.push(
      { blockId: "grid", reason: "Responsive card layout" },
      { blockId: "card", reason: "Individual item container" },
      { blockId: "image", reason: "Product or item image" },
      { blockId: "button", reason: "Action per item" }
    );
  } else if (
    messageLower.includes("ai") ||
    messageLower.includes("chat") ||
    messageLower.includes("assistant")
  ) {
    response = `Awesome! An **AI Block** lets you add a conversational assistant to your page. Users can:
- Ask questions and get answers
- Generate content on-the-fly
- Get recommendations
Perfect for support, content generation, or personalization!`;

    suggestions.push(
      { blockId: "aiBlock", reason: "Inline AI assistant for users" },
      { blockId: "heading", reason: "Label your AI feature" },
      { blockId: "container", reason: "Contain and style the AI block" }
    );
  } else if (
    messageLower.includes("about") ||
    messageLower.includes("team") ||
    messageLower.includes("testimonial")
  ) {
    response = `Great for an About or Team page! I recommend:
- **Heading** to introduce each section
- **Testimonial blocks** for social proof
- **Text** blocks for bios or descriptions
- **Image** blocks for photos
This creates a personal, trustworthy feel.`;

    suggestions.push(
      { blockId: "heading", reason: "Section titles" },
      { blockId: "testimonial", reason: "Customer/team quotes" },
      { blockId: "text", reason: "Bios or descriptions" },
      { blockId: "image", reason: "Photos of people or moments" }
    );
  } else if (messageLower.includes("button")) {
    response = `**Buttons** are essential for user interaction! Tips:
- Use a primary button for main CTAs (sign up, buy, learn more)
- Use secondary buttons for less important actions
- Place buttons where users naturally expect them
- Keep button text clear and action-oriented
What action do you want users to take?`;

    suggestions.push(
      { blockId: "button", reason: "User interaction" },
      { blockId: "container", reason: "Group and style buttons" }
    );
  } else {
    response = `I'd love to help you build this! Could you tell me a bit more about what you're creating? For example:
- Is it a **landing page**, **portfolio**, **form**, or **product showcase**?
- What's the main goal? (sales, engagement, information sharing?)
- Who's your audience?

Once I know more, I can suggest the perfect blocks for your page!`;

    // Default suggestions for unknown intents
    suggestions.push(
      { blockId: "hero", reason: "Eye-catching header to start" },
      { blockId: "heading", reason: "Clear section titles" },
      { blockId: "button", reason: "Call-to-action" }
    );
  }

  return { response, suggestions };
}
