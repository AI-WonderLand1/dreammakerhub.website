// apps/web/app/(tools)/playground/modules.ts

/** * FIX: Overriding the broken 'string' type with a full Interface.
 * This is the ONLY way to fix the error in image_595fc2.png
 */
interface PlaygroundModule {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
    defaultValue?: string;
  }>;
  buildUserPrompt: (values: any) => string;
}

export const playgroundModules: PlaygroundModule[] = [
  {
    id: "chat",
    name: "General Chat",
    description: "Ask anything. Good default assistant.",
    category: "general",
    systemPrompt:
      "You are a helpful assistant. Be direct, practical, and clear. Ask no follow-up questions unless necessary.",
    fields: [
      {
        key: "message",
        label: "Message",
        type: "textarea",
        required: true,
        placeholder: "Ask anything...",
      },
    ],
    buildUserPrompt: (v) => String(v.message ?? ""),
  },
  {
    id: "prompt_refiner",
    name: "Prompt Refiner",
    description: "Turn messy ideas into a clean, high-quality prompt.",
    category: "writing",
    systemPrompt:
      "You are a prompt engineer. Rewrite the user's input into a structured, high quality prompt. Keep it concise and actionable.",
    fields: [
      {
        key: "goal",
        label: "What are you trying to do?",
        type: "textarea",
        required: true,
        placeholder: "Example: Build a landing page for my AI builder...",
      },
      {
        key: "constraints",
        label: "Constraints (optional)",
        type: "textarea",
        placeholder: "Example: must be mobile-first, dark theme, include voice features...",
      },
    ],
    buildUserPrompt: (v) => {
      const goal = String(v.goal ?? "");
      const constraints = String(v.constraints ?? "");
      return [
        `Goal: ${goal}`,
        constraints.trim() ? `Constraints: ${constraints}` : "",
        `Output: Return ONLY the refined prompt.`,
      ]
        .filter(Boolean)
        .join("\n");
    },
  },
  {
    id: "code_explainer",
    name: "Code Explainer",
    description: "Explain code and suggest improvements.",
    category: "code",
    systemPrompt:
      "You are a senior engineer. Explain what the code does, point out bugs and risks, and suggest improvements. Keep it practical.",
    fields: [
      { 
        key: "code", 
        label: "Paste code", 
        type: "textarea", 
        required: true, 
        placeholder: "Paste code here..." 
      },
      {
        key: "focus",
        label: "Focus area (optional)",
        type: "select",
        options: [
          { label: "Bugs", value: "bugs" },
          { label: "Performance", value: "perf" },
          { label: "Accessibility", value: "a11y" },
          { label: "Architecture", value: "arch" },
        ],
        defaultValue: "bugs",
      },
    ],
    buildUserPrompt: (v) => {
      return `Focus: ${v.focus ?? "bugs"}\n\nCode:\n${v.code ?? ""}`;
    },
  },
  {
    id: "ui_critic",
    name: "UI Critic",
    description: "Audit a UI plan with UX + accessibility advice.",
    category: "design",
    systemPrompt:
      "You are a UX + accessibility expert. Provide actionable suggestions. Include mobile/touch considerations.",
    fields: [
      { 
        key: "ui", 
        label: "Describe the UI", 
        type: "textarea", 
        required: true, 
        placeholder: "Describe your screen..." 
      },
      {
        key: "platform",
        label: "Target platform",
        type: "select",
        options: [
          { label: "Mobile", value: "mobile" },
          { label: "Desktop", value: "desktop" },
          { label: "Both", value: "both" },
        ],
        defaultValue: "both",
      },
    ],
    buildUserPrompt: (v) => `Platform: ${v.platform ?? "both"}\n\nUI:\n${v.ui ?? ""}`,
  },
];
