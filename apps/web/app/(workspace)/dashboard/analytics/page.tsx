"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/usage");
  }, [router]);

  return (
    <div className="p-8 text-white">
      Loading...
    </div>
  );
}