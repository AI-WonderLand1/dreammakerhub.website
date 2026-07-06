import Link from "next/link";

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
            <h3 className="text-sm font-bold text-white mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wonder-build" className="text-white/60 hover:text-white">WonderBuild</Link></li>
              <li><Link href="/playground" className="text-white/60 hover:text-white">Playground</Link></li>
              <li><Link href="/wonder-build/playcanvas" className="text-white/60 hover:text-white">WonderPlay 3D</Link></li>
              <li><Link href="/wonderspace/ide" className="text-white/60 hover:text-white">WonderSpace IDE</Link></li>
              <li><Link href="/marketplace" className="text-white/60 hover:text-white">Marketplace</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-white/60 hover:text-white">About</Link></li>
              <li><Link href="/careers" className="text-white/60 hover:text-white">Careers</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white">Contact</Link></li>
              <li><Link href="/blog" className="text-white/60 hover:text-white">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-white/60 hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="text-white/60 hover:text-white">Terms</Link></li>
              <li><Link href="/faq" className="text-white/60 hover:text-white">FAQ</Link></li>
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