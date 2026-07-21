"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { logger } from '@/lib/logger';

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const loadBlueprint = async () => {
        try {
          const res = await fetch(`/api/blueprints/${id}`);
          const data = await res.json();
          if (data.puckData) {
            router.push(`/wonder-build/puck?blueprint=${id}`);
          } else {
            router.push("/wonder-build");
          }
        } catch {
          router.push("/wonder-build");
        } finally {
          setLoading(false);
        }
      };
      loadBlueprint();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-violet-400 animate-spin" />
          <p className="text-white/60 text-sm">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  return null;
}