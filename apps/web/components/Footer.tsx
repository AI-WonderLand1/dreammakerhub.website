import Link from "next/link";
import { logger } from '@/lib/logger';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="text-xl font-bold text-white mb-4 inline-block">
              AI Wonderland
            </Link>
            <p className="text-white/50 text-sm mb-4">
              Build anything. Just by describing it.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/aiwonderland" className="text-white/40 hover:text-white">Twitter</a>
              <a href="https://github.com/aiwonderland" className="text-white/40 hover:text-white">GitHub</a>
              <a href="https://discord.gg/aiwonderland" className="text-white/40 hover:text-white">Discord</a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Build</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wonder-build" className="text-white/60 hover:text-white">WonderBuild</Link></li>
              <li><Link href="/wonder-build/builder" className="text-white/60 hover:text-white">Visual Builder</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Code</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wonderspace" className="text-white/60 hover:text-white">WonderSpace</Link></li>
              <li><Link href="/ide" className="text-white/60 hover:text-white">Cloud IDE</Link></li>
              <li><a href="https://playground.dreammakerhub.website/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Playground</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">3D</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wonder-build/playcanvas" className="text-white/60 hover:text-white">WonderPlay 3D</Link></li>
              <li><Link href="/dashboard/3dhub" className="text-white/60 hover:text-white">3DHub Studio</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/projects" className="text-white/60 hover:text-white">Projects</Link></li>
              <li><Link href="/marketplace" className="text-white/60 hover:text-white">Marketplace</Link></li>
              <li><Link href="/docs" className="text-white/60 hover:text-white">Docs</Link></li>
              <li><Link href="/settings/account" className="text-white/60 hover:text-white">Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} AI Wonderland. All rights reserved.
        </div>
      </div>
    </footer>
  );
}