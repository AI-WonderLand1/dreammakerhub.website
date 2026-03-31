"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/dashboard", label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/85 hover:bg-white/10"
      aria-label={`${label}, fallback to ${fallbackHref}`}
    >
      ← {label}
    </button>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/85 hover:bg-white/10"
    >
      ← {label}
    </Link>
  );
}
