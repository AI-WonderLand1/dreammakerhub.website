import React from "react";

export function FooterBlock({ content, children }: { content?: any; children?: React.ReactNode }) {
  const links: string[] = Array.isArray(content?.links) ? content.links : [];

  return (
    <footer className="h-full w-full rounded-xl border border-white/15 bg-white/5 p-4 text-white">
      <p className="text-sm text-white/75">{content?.text ?? "AI Footer"}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
        {links.length ? links.map((link) => <span key={link}>{link}</span>) : <span>Contact</span>}
      </div>
      {children}
    </footer>
  );
}
