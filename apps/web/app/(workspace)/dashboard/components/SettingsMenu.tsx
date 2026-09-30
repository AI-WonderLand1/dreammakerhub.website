"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logger } from '@/lib/logger';

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
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-xl z-50">
          {[
            ["/dashboard/settings","Settings Home"],
            ["/dashboard/settings/account","Account"],
            ["/dashboard/settings/simplerick","SimpleRickSettings"],
            ["/dashboard/usage","Usage & Billing"],
            ["/dashboard/settings/webhooks","Webhooks"],
            ["/support","Support"],
          ].map(([href,label]) => (
            <Link key={href} href={href} className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
