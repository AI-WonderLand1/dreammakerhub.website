import { type ReactNode } from "react";

export function EmptyState({ title, description, cta }: { title: string; description: string; cta?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-10 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">{description}</p>
      {cta ? <div className="mt-5">{cta}</div> : null}
    </div>
  );
}

export function SkeletonGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ))}
    </div>
  );
}
