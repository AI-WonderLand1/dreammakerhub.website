"use client";

import { useCallback, useEffect, useState } from "react";
import { Extension } from "../types";

export function useMarketplace() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/features/list"); // Updated to /api/features/list
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      
      // Combine custom and github features
      const allExtensions = [
        ...data.features.custom.map((f: any) => ({ ...f, source: 'custom' })),
        ...data.features.github.map((f: any) => ({ ...f, source: 'github' }))
      ];
      
      setExtensions(allExtensions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  return { extensions, loading, error, refetch: fetchExtensions };
}
