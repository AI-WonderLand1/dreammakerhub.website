// engine/core/playground/moduleCatalog.ts

export type PlaygroundModule = {
  id: string;
  label: string;
  description: string;
  kind: "chat" | "apply" | "tool";
};

export const playgroundModuleCatalog: PlaygroundModule[] = [
  {
    id: "chat",
    label: "Chat",
    description: "General assistant chat module.",
    kind: "chat",
  },
  {
    id: "ui",
    label: "UI Critic",
    description: "UX + accessibility review.",
    kind: "tool",
  },
  {
    id: "code",
    label: "Code Fixer",
    description: "Find bugs and propose fixes.",
    kind: "tool",
  },
  {
    id: "apply",
    label: "Apply Changes",
    description: "Generate changes and apply to a selected project.",
    kind: "apply",
  },
];
