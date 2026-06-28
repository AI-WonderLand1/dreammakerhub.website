"use client";

export type ImageGalleryBlockProps = {
  title: string;
  columns: "2" | "3" | "4";
  aspectRatio: "square" | "video" | "portrait";
  accentColor: "cyan" | "violet" | "amber" | "pink";
  imageUrls: string;
};

const aspectRatios = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
};

const accents = {
  cyan: "border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400",
  violet: "border-violet-500/30 hover:border-violet-500/60 text-violet-400",
  amber: "border-amber-500/30 hover:border-amber-500/60 text-amber-400",
  pink: "border-pink-500/30 hover:border-pink-500/60 text-pink-400",
};

const cols = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
};

export default function ImageGalleryBlock({
  title = "Blueprint Gallery",
  columns = "3",
  aspectRatio = "square",
  accentColor = "cyan",
  imageUrls = "",
}: ImageGalleryBlockProps) {
  const urls = imageUrls
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const count = Math.max(parseInt(columns) * 2, 6);
  const slots = urls.length > 0 ? urls : Array.from({ length: count }, () => "");

  return (
    <div className="p-4" data-block="image-gallery">
      {title && (
        <p className={`mb-3 text-xs font-bold uppercase tracking-widest ${accents[accentColor].split(" ").find((c) => c.startsWith("text-"))}`}>
          {title}
        </p>
      )}
      <div className={`grid ${cols[columns]} gap-2`}>
        {slots.map((url, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-xl border bg-white/[0.03] transition ${aspectRatios[aspectRatio]} ${accents[accentColor]}`}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`Gallery image ${i + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xl text-white/10">🖼</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
