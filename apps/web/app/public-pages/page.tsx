import Link from "next/link";

export default function PagesHub() {
  const pages = [
    {
      name: "Wonder‑Build",
      href: "/wonder-build",
      description: "Visual app builder with drag-and-drop interface",
      color: "blue"
    },
    {
      name: "WonderSpace",
      href: "/wonderspace",
      description: "Integrated development environment",
      color: "purple"
    },
    {
      name: "Playground",
      href: "/playground",
      description: "Test and experiment with AI models",
      color: "red"
    },
    {
      name: "Marketplace",
      href: "/marketplace",
      description: "Browse and install extensions",
      color: "green"
    },
    {
      name: "Documentation",
      href: "/docs",
      description: "Learn how to use AI Wonderland",
      color: "yellow"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5",
      purple: "border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/5",
      red: "border-red-500/30 hover:border-red-500 hover:bg-red-500/5",
      green: "border-green-500/30 hover:border-green-500 hover:bg-green-500/5",
      yellow: "border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/5"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-yellow-400 to-white bg-clip-text text-transparent">
            AI Wonderland
          </h1>
          <p className="text-gray-400 text-lg">
            Choose your adventure in the world of AI development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Link
              key={page.name}
              href={page.href}
              className={`
                group relative p-6 rounded-xl border-2 
                bg-gray-800/50 backdrop-blur-sm
                transition-all duration-300 hover:scale-105
                ${getColorClasses(page.color)}
              `}
            >
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:via-yellow-400 group-hover:to-white group-hover:bg-clip-text transition-all">
                  {page.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  {page.description}
                </p>
                <div className="mt-4 text-sm text-white/60 group-hover:text-white/90 transition-colors">
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 p-6 rounded-xl bg-gray-800/30 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Home
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/projects" className="text-gray-400 hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/public-pages/auth" className="text-gray-400 hover:text-white transition-colors">
              Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
