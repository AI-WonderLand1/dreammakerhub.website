import { logger } from '@/lib/logger';
export type BuilderShowcaseCard = {
  title: string;
  image: string;
  href: string;
  desc: string;
};

export const BUILDER_SHOWCASE_CARDS: BuilderShowcaseCard[] = [
  {
    title: "WonderPlay 3D Editor",
    image: "/images/screenshots/playcanvas-builder.svg",
    href: "/wonder-build/playcanvas",
    desc: "Real-time 3D world builder with physics, materials, WebGL shaders, and scene graph editing.",
  },
  {
    title: "WonderBuild",
    image: "/images/screenshots/puck-builder.svg",
    href: "/wonder-build/ai-builder",
    desc: "Describe what you want — three AI agents generate complete websites, games, and dashboard UIs.",
  },
  {
     title: "WonderSpace IDE",
     image: "/images/screenshots/theia-builder.svg",
     href: "/ide",
     desc: "Cloud IDE for custom coding, debugging, and deployment flows with AI autocomplete.",
  },
];

export function toSafeInternalHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("://")) return "/";
  return href;
}
