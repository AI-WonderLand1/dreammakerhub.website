// engine/core/ai/narrator.ts
import { BuildCodeGenPromptArgs } from "./promptBuilder";

export function* getNarrativeStream(args: BuildCodeGenPromptArgs) {
  yield "Initializing Wonderland Engine...";
  yield "Handshaking with Constitutional AI protocols...";
  
  if (args.mode === "update") {
    yield `Analyzing diff for ${args.focusFiles?.length || 'multiple'} files...`;
  } else {
    yield "Synthesizing new project architecture...";
  }

  if (args.currentFileTree) {
    const fileCount = Object.keys(args.currentFileTree).length;
    yield `Mapping existing file tree (${fileCount} files detected)...`;
  }

  yield "Injecting platform specifications: " + (args.targetPlatforms?.join(", ") || "Full Ecosystem");
  yield "Optimizing for production-ready code output...";
  yield "Running final security sweep...";
}

