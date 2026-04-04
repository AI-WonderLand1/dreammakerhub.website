import { MasterBlock } from "../blocks/MasterBlock";

export const creativeConfig = {
  MotionText: {
    fields: {
      text: { type: "text" },
      speed: { type: "number" },
      glowColor: { type: "text" },
    },
    defaultProps: {
      text: "STREAMING_DATA...",
      speed: 1,
      glowColor: "#a855f7",
    },
    render: ({ text, glowColor, ...props }: any) => (
      <MasterBlock title="Animated Signal" iconName="Zap" variant="neon" glowColor={glowColor} {...props}>
        <h2 className="text-3xl font-bold tracking-tighter" style={{ textShadow: `0 0 10px ${glowColor}` }}>
          {text || "STREAMING_DATA..."}
        </h2>
      </MasterBlock>
    ),
  },

  AICodeGen: {
    fields: {
      prompt: { type: "text" },
      language: {
        type: "select",
        options: [
          { label: "TypeScript", value: "ts" },
          { label: "Python", value: "py" },
        ],
      },
    },
    defaultProps: {
      prompt: "Create API route",
      language: "ts",
    },
    render: ({ prompt, language }: any) => (
      <MasterBlock title="GenGenie AI" iconName="Code2" variant="neon" glowColor="#a855f7" triggerEvent="onHover">
        <div className="rounded border border-purple-500/30 bg-zinc-950 p-3 font-mono text-[10px] text-purple-400">
          <code>{`// Generating ${language} logic for: ${prompt || "..."}`}</code>
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-zinc-900">
            <div className="h-full w-1/2 animate-pulse bg-purple-500" />
          </div>
        </div>
      </MasterBlock>
    ),
  },
};
