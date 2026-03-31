export type AIConfession = {
  id: string;
  projectId: string;
  createdAt: string;

  action: string;        // "add-block", "generate-layout", "style-suggestion"
  summary: string;       // 1–2 sentence human explanation

  reasoning: string[];   // bullet points (safe, high-level)
  signals: string[];     // inputs considered (user intent, canvas state, etc.)
  rejected?: string[];   // optional: alternatives AI considered

  artifacts?: {
    blocks?: string[];
    styles?: string[];
    nodes?: string[];
  };

  raw?: {
    model?: string;
    tokensUsed?: number;
    confidence?: number; // 0–1
  };
};
