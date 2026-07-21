"use client";

import Link from "next/link";
import { logger } from '@/lib/logger';

export default function GitHubStyleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0b1020] px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58 0-.29-.01-1.05-.01-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.48 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.86.12 3.16.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className="font-medium">WonderSpace</span>
        </Link>
        <nav className="flex gap-4 text-sm text-white/70">
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/ide" className="font-semibold text-white">IDE</Link>
          <Link href="/settings" className="hover:text-white">Settings</Link>
        </nav>
      </header>
      <main className="min-h-screen bg-[#0b1020] text-white">{children}</main>
    </>
  );
}
