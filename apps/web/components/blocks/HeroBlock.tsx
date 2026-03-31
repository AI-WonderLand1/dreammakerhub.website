import React from "react";

export function HeroBlock({ content, children }: { content?: any; children?: React.ReactNode }) {
  return (
    <section className="h-full w-full rounded-xl border border-white/15 bg-white/5 p-5 text-white">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Hero</p>
      <h2 className="mt-2 text-2xl font-black">{content?.title ?? "AI Hero"}</h2>
      <p className="mt-2 text-sm text-white/70">{content?.subtitle ?? "Generated hero subtitle"}</p>
      {children}
    </section>
  );
}
