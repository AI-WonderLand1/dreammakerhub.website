import React from "react";

export function FeaturesBlock({ content, children }: { content?: any; children?: React.ReactNode }) {
  const items: string[] = Array.isArray(content?.items) ? content.items : [];

  return (
    <section className="h-full w-full rounded-xl border border-white/15 bg-white/5 p-5 text-white">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Features</p>
      <h3 className="mt-2 text-xl font-bold">{content?.heading ?? "Core capabilities"}</h3>
      <ul className="mt-3 space-y-1 text-sm text-white/75">
        {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li>• Feature item</li>}
      </ul>
      {children}
    </section>
  );
}
