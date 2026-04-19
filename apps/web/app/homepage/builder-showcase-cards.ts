export type BuilderShowcaseCard = {
  title: string;
  image: string;
  href: string;
  desc: string;
};

export const BUILDER_SHOWCASE_CARDS: BuilderShowcaseCard[] = [
  {
    title: "PlayCanvas 3D Studio",
    image: "/images/screenshots/playcanvas-builder.svg",
    href: "/wonder-build/playcanvas",
    desc: "Realtime 3D world builder with physics, materials, and scene graph.",
  },
  {
    title: "WebGL Studio",
    image: "/images/screenshots/webgl-builder.svg",
    href: "/wonder-build/playcanvas",
    desc: "Interactive shader editor and real-time render pipeline.",
  },
  {
    title: "Puck UI Builder",
    image: "/images/screenshots/puck-builder.svg",
    href: "/wonder-build/puck",
    desc: "UI component builder with responsive grids and design tokens.",
  },
  {
    title: "WonderSpace IDE",
    image: "/images/screenshots/theia-builder.svg",
    href: "/ide",
    desc: "Cloud IDE for custom coding, debugging, and deployment flows.",
  },
];

export function toSafeInternalHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("://")) return "/";
  return href;
}
