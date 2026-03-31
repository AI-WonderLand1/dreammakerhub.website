import { SkeletonGrid } from "@/app/components/feedback/EmptyState";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-white">
      <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-white/10" />
      <SkeletonGrid cards={4} />
    </div>
  );
}
