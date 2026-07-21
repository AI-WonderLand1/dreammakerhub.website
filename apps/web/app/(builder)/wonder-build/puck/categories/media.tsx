import { MasterBlock } from "../blocks/MasterBlock";
import { logger } from '@/lib/logger';

export const mediaConfig = {
  ImageComparison: {
    fields: {
      title: { type: "text" },
      beforeImage: { type: "text" },
      afterImage: { type: "text" },
      glowColor: { type: "text" },
    },
    defaultProps: {
      title: "Visual Decoder",
      beforeImage: "https://picsum.photos/800/450",
      afterImage: "https://picsum.photos/800/450?grayscale",
      glowColor: "#00f3ff",
      triggerEvent: "onHover",
      variant: "glass",
      iconName: "Split",
    },
    render: ({ title, beforeImage, afterImage, ...props }: any) => (
      <MasterBlock title={title || "Visual Decoder"} iconName="Split" variant="glass" {...props}>
        <div className="group/slider relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
          <img src={afterImage || "https://picsum.photos/800/450?grayscale"} className="absolute inset-0 h-full w-full object-cover" alt="After" />
          <div className="absolute inset-0 w-1/2 overflow-hidden border-r-2 border-cyan-400">
            <img src={beforeImage || "https://picsum.photos/800/450"} className="absolute inset-0 h-full w-[200%] object-cover" alt="Before" />
          </div>
          <div className="absolute top-2 left-2 rounded bg-black/80 px-2 py-1 text-[8px] font-mono text-white">INPUT_SRC</div>
          <div className="absolute top-2 right-2 rounded bg-cyan-500/80 px-2 py-1 text-[8px] font-mono font-bold text-black">AI_RENDER</div>
        </div>
      </MasterBlock>
    ),
  },

  VideoPlayer: {
    fields: {
      url: { type: "text" },
      thumbnail: { type: "text" },
      autoPlay: {
        type: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
      },
    },
    defaultProps: {
      url: "",
      thumbnail: "https://picsum.photos/800/450?blur=2",
      autoPlay: "false",
      iconName: "Play",
      variant: "neon",
      glowColor: "#00f3ff",
      triggerEvent: "onHover",
    },
    render: ({ thumbnail, ...props }: any) => (
      <MasterBlock title="Media Stream" iconName="Play" variant="neon" {...props}>
        <div className="group relative overflow-hidden rounded-xl border border-white/10">
          <img src={thumbnail || "https://picsum.photos/800/450?blur=2"} className="aspect-video w-full object-cover" alt="Video thumbnail" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110">
              <div className="ml-1 h-0 w-0 border-b-[8px] border-l-[12px] border-t-[8px] border-b-transparent border-l-white border-t-transparent" />
            </div>
          </div>
          <div className="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-cyan-400 opacity-50 shadow-[0_0_15px_cyan]" />
        </div>
      </MasterBlock>
    ),
  },
};
