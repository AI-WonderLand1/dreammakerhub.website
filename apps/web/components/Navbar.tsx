'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            AI Wonderland
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
             <Link href="/wonder-build" className="text-white/70 hover:text-white">Builder</Link>
             <Link href="/3d-library" className="text-white/70 hover:text-white">3D Library</Link>
             <Link href="/docs" className="text-white/70 hover:text-white">Docs</Link>
             <Link href="/community" className="text-white/70 hover:text-white">Community</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-white/70 hover:text-white">Dashboard</Link>
                <button onClick={signOut} className="text-white/70 hover:text-white">Sign Out</button>
              </>
            ) : (
              <Link href="/public-pages/auth" className="text-white/70 hover:text-white">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}