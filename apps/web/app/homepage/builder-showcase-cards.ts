export type BuilderShowcaseCard = {
  title: string;
  image: string;
  href: string;
  desc: string;
};

export const BUILDER_SHOWCASE_CARDS: BuilderShowcaseCard[] = [
  {
    title: "WonderBuild",
    image: "/images/screenshots/puck-builder.svg",
    href: "/wonder-build",
    desc: "Create websites and web apps with AI, templates, visual editing, code, preview, and publish.",
  },
  {
    title: "WonderSpace",
    image: "/images/screenshots/theia-builder.svg",
    href: "/wonderspace",
    desc: "Use a cloud development workspace with files, Git, terminal, and AI-assisted coding.",
  },
  {
    title: "WonderPlay",
    image: "/images/screenshots/playcanvas-builder.svg",
    href: "/dashboard/3dhub",
    desc: "Create realtime 3D scenes, games, worlds, assets, and intelligent characters.",
  },
];

export function toSafeInternalHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("://")) return "/";
  return href;
}
