'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

const LINKS = [
  { label: 'Build', href: '/wonder-build' },
  { label: 'Code', href: '/wonderspace' },
  { label: '3D', href: '/dashboard/3dhub' },
  { label: 'Docs', href: '/docs' },
] as const;

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            AI Wonderland
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            {LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="text-white/70 transition hover:text-white">
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link href="/dashboard/projects" className="text-white/70 transition hover:text-white">Projects</Link>
                <button onClick={() => void signOut()} className="text-white/70 transition hover:text-white">Sign Out</button>
              </>
            ) : (
              <Link href="/public-pages/auth" className="text-white/70 transition hover:text-white">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
