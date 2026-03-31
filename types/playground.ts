
//
// 🧠 Core message + session model (multi-turn chat)
//

export interface PlaygroundMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
  };
}

export interface PlaygroundParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface PlaygroundSession {
  id: string;
  name: string;
  messages: PlaygroundMessage[];
  model: string;
  systemPrompt: string;
  parameters: PlaygroundParameters;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaygroundHistory {
  sessions: PlaygroundSession[];
  totalRuns: number;
  totalTokens: number;
}

//
// 🧩 Models and providers
//

export type PlaygroundProviderId = "openai" | "anthropic" | "custom";

export interface ModelConfig {
  id: string;
  name: string;
  provider: PlaygroundProviderId;
  maxTokens: number;
  supportedFeatures: string[];
  costPer1kTokens?: {
    input: number;
    output: number;
  };
}

//
// 🎛️ Modules (unified system)
//

export type PlaygroundModuleId = "code" | "chat" | "agent" | "vision" | "data";

export type PlaygroundModuleKind =
  | "code"
  | "chat"
  | "agent"
  | "vision"
  | "data";

export interface PlaygroundModuleContext {
  sessionId: string;
  userId?: string | null;
  mode?: PlaygroundModuleId;
  // Room for: tenantId, projectId, etc.
}

export interface PlaygroundModuleInput {
  moduleId: PlaygroundModuleId;

  // Core input, shared across modules
  prompt: string;

  // Optional, module-specific hints
  sourceCode?: string;
  language?: string;
  metadata?: Record<string, any>;

  // For chat-like modules (e.g. "chat")
  messages?: PlaygroundMessage[];
  systemPrompt?: string;
  parameters?: Partial<PlaygroundParameters>;

  // For model selection, if the module wants to override defaults
  modelId?: string;
}

export interface PlaygroundModuleResult {
  moduleId: PlaygroundModuleId;
  output: string;

  // For chat-like modules, include the updated message list if needed
  messages?: PlaygroundMessage[];

  artifacts?: any[];

  timing?: {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
  };

  debug?: Record<string, any>;
}

export interface PlaygroundModule {
  id: PlaygroundModuleId;
  label: string;
  description: string;
  kind: PlaygroundModuleKind;

  // Main execution entry point
  run: (
    input: PlaygroundModuleInput,
    ctx: PlaygroundModuleContext
  ) => Promise<PlaygroundModuleResult>;
}

//
// 🎚️ Optional: presets for quick testing
//

export interface PlaygroundPreset {
  id: string;
  title: string;
  prompt: string;
  category: string;
  moduleId?: PlaygroundModuleId;
}

export const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    id: "code-generation",
    title: "Code Generation",
    prompt: "Write a Python function to encode the input text in base64.",
    category: "coding",
    moduleId: "code",
  },
  {
    id: "image-caption",
    title: "Image Captioning",
    prompt: "Add descriptive captions for the image.",
    category: "vision",
    moduleId: "vision",
  },
  {
    id: "markdown-format",
    title: "Markdown Formatting",
    prompt:
      "Explore typical scenarios where traditional applications can leverage large language model capabilities, structure the output in markdown format.",
    category: "formatting",
    moduleId: "chat",
  },
  {
    id: "data-analysis",
    title: "Data Analysis",
    prompt:
      "Given a CSV with columns: user_id, event_type, timestamp, describe 3 useful product metrics we can derive.",
    category: "data",
    moduleId: "data",
  },
];
