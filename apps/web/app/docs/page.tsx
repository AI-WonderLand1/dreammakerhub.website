import Link from "next/link";

export const metadata = {
  title: "Documentation - AI Wonderland",
  description: "Learn how to build websites, 3D games, and interactive experiences with AI Wonderland.",
};

export default function DocsPage() {
  const categories = [
    {
      title: "Getting Started",
      links: [
        { name: "Introduction to AI Wonderland", href: "/docs/intro" },
        { name: "Setting up your account", href: "/docs/setup" },
        { name: "Quick start guide", href: "/docs/quick-start" },
      ],
    },
    {
      title: "WonderBuild AI",
      links: [
        { name: "AI Builder overview", href: "/docs/wonderbuild" },
        { name: "Prompt engineering guide", href: "/docs/prompts" },
        { name: "Multi-agent workflow", href: "/docs/agents" },
      ],
    },
    {
      title: "WonderPlay 3D",
      links: [
        { name: "Getting started with PlayCanvas", href: "/docs/playcanvas" },
        { name: "Creating your first scene", href: "/docs/first-scene" },
        { name: "Importing assets", href: "/docs/assets" },
      ],
    },
    {
      title: "WonderSpace IDE",
      links: [
        { name: "IDE features overview", href: "/docs/ide" },
        { name: "WebContainer runtime", href: "/docs/webcontainer" },
        { name: "Git integration", href: "/docs/git" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Documentation</h1>
          <p className="text-lg text-white/70">
            Learn how to build websites, 3D games, and interactive experiences with AI Wonderland.
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.title}>
              <h2 className="text-xl font-bold mb-4 text-purple-400">{category.title}</h2>
              <ul className="space-y-3">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white hover:underline transition"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/50">
            Can't find what you're looking for?{" "}
            <Link href="/support" className="text-purple-400 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}