"use client";

export type VideoPlayerBlockProps = {
  title: string;
  videoUrl: string;
  caption: string;
  rounded: boolean;
  showOverlay: boolean;
};

export default function VideoPlayerBlock({
  title = "",
  videoUrl = "",
  caption = "",
  rounded = true,
  showOverlay = true,
}: VideoPlayerBlockProps) {
  return (
    <div className="p-4" data-block="video-player">
      {title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">{title}</p>
      )}
      <div className={`relative overflow-hidden border border-white/10 bg-zinc-950 ${rounded ? "rounded-2xl" : ""}`}>
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-zinc-900">
            <div className="h-14 w-14 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
              <svg className="ml-0.5 h-6 w-6 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-xs text-white/30">Add a video URL in the editor</p>
          </div>
        )}

        {showOverlay && (
          <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-md">
            {caption || "Video Preview"}
          </div>
        )}
      </div>
      {caption && !showOverlay && (
        <p className="mt-2 text-xs text-white/40 text-center">{caption}</p>
      )}
    </div>
  );
}
