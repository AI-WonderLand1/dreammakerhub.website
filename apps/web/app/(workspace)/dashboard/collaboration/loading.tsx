import { SkeletonGrid } from "@/app/components/feedback/EmptyState";

export default function CollaborationLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 text-white">
      <div className="mb-4 h-9 w-56 animate-pulse rounded-lg bg-white/10" />
      <SkeletonGrid cards={3} />
    </div>
  );
}
