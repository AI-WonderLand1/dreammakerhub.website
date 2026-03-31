// apps/web/types/playground.ts

import { playgroundModuleCatalog } from "@core/playground/moduleCatalog";

/**
 * Union type derived directly from the engine catalog.
 * This prevents ID drift forever.
 */
export type PlaygroundModuleId =
  (typeof playgroundModuleCatalog)[number]["id"];

/**
 * Presets shown in the Playground UI
 */
export const PLAYGROUND_PRESETS: {
  moduleId: PlaygroundModuleId;
  label: string;
  prompt: string;
}[] = [
  {
    moduleId: "chat",
    label: "General Chat",
    prompt: "Help me think through an idea step by step.",
  },
  {
    moduleId: "ui",
    label: "Accessibility Review",
    prompt: "Review this UI for accessibility issues.",
  },
  {
    moduleId: "code",
    label: "Fix Bugs",
    prompt: "Find bugs and suggest improvements.",
  },
  {
    moduleId: "apply",
    label: "Apply Changes",
    prompt: "Generate changes and apply them to my project.",
  },
];
