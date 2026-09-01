import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-2 inline-block text-lg font-bold text-white">
              AI Wonderland
            </Link>
            <p className="mb-3 text-sm text-white/50">
              Build anything. Just by describing it.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a href="https://twitter.com/aiwonderland" className="text-white/40 hover:text-white">Twitter</a>
              <a href="https://github.com/aiwonderland" className="text-white/40 hover:text-white">GitHub</a>
              <a href="https://discord.gg/aiwonderland" className="text-white/40 hover:text-white">Discord</a>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-white">Build</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/wonder-build" className="text-white/60 hover:text-white">WonderBuild</Link></li>
              <li><Link href="/wonder-build/builder" className="text-white/60 hover:text-white">Visual Builder</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-white">Code</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/wonderspace" className="text-white/60 hover:text-white">WonderSpace</Link></li>
              <li><Link href="/ide" className="text-white/60 hover:text-white">Cloud IDE</Link></li>
              <li><a href="https://playground.dreammakerhub.website/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Playground</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-white">3D</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/wonder-build/playcanvas" className="text-white/60 hover:text-white">NPC AI SIM</Link></li>
              <li><Link href="/dashboard/3dhub" className="text-white/60 hover:text-white">3DHub Studio</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-white">Explore</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/dashboard/projects" className="text-white/60 hover:text-white">Projects</Link></li>
              <li><Link href="/marketplace" className="text-white/60 hover:text-white">Marketplace</Link></li>
              <li><Link href="/docs" className="text-white/60 hover:text-white">Docs</Link></li>
              <li><Link href="/settings/account" className="text-white/60 hover:text-white">Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} AI Wonderland. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
