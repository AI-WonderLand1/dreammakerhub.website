"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "h-10 px-4 rounded-xl border",
          "border-white/10 bg-white/5 hover:bg-white/10 transition",
          "text-sm font-bold text-white/80"
        )}
      >
        Settings ▾
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0b1220] shadow-xl overflow-hidden z-50">
          <Link
            href="/dashboard/settings"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Settings Home
          </Link>

          <div className="h-px bg-white/10" />

          <Link
            href="/dashboard/subscription"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Subscription
          </Link>

          <Link
            href="/dashboard/features"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Features
          </Link>

          <Link
            href="/dashboard/settings/webhooks"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Webhooks
          </Link>

          <div className="h-px bg-white/10" />

          <Link
            href="/dashboard/teams"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Team & Access
          </Link>

          <Link
            href="/dashboard/support"
            className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            Support
          </Link>
        </div>
      )}
    </div>
  );
}
