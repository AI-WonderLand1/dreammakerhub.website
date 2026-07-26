"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { logger } from '@/lib/logger';

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.push(`/wonder-build/builder?blueprint=${id}`);
    }
  }, [id, router]);

  return null;
}