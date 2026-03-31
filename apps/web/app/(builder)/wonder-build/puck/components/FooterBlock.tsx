"use client";

export type FooterBlockProps = {
  brand: string;
  tagline: string;
  columns: string;
  copyright: string;
  theme: "dark" | "minimal";
};

function parseColumns(raw: string): { heading: string; links: string[] }[] {
  return raw
    .split("|")
    .map((col) => col.trim())
    .filter(Boolean)
    .map((col) => {
      const lines = col.split("\n").map((l) => l.trim()).filter(Boolean);
      return { heading: lines[0] || "", links: lines.slice(1) };
    });
}

export default function FooterBlock({
  brand = "AI Wonderland",
  tagline = "Where your imagination comes to life.",
  columns = "Platform\nBuilder\nWebGL Studio\nAI Builder\n|\nCompany\nAbout\nPricing\nDocs\n|\nLegal\nPrivacy\nTerms",
  copyright = `© ${new Date().getFullYear()} AI Wonderland. All rights reserved.`,
  theme = "dark",
}: FooterBlockProps) {
  const parsedCols = parseColumns(columns);

  return (
    <div className="p-4" data-block="footer">
      <footer className={`rounded-2xl border border-white/10 px-8 py-10 ${theme === "dark" ? "bg-black" : "bg-white/[0.02]"}`}>
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-white mb-1">{brand}</p>
            <p className="text-xs text-white/40 max-w-xs">{tagline}</p>
          </div>

          <div className="flex flex-wrap gap-8">
            {parsedCols.map((col, i) => (
              <div key={i} className="min-w-[100px]">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  {col.heading}
                </p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs text-white/50 transition hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-[10px] text-white/25">{copyright}</p>
        </div>
      </footer>
    </div>
  );
}
