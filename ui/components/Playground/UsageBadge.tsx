"use client";

import { useEffect, useState } from "react";
import { getUsage } from "@core/playground/usage";
import { useAuth } from "@lib/supabase/auth-context";
import { logger } from "@lib/logger";

export default function UsageBadge() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      if (!user?.id) {
        setUsage(null);
        return;
      }
      try {
        const data = await getUsage(user.id);
        setUsage({ used: data.used, limit: data.limit });
      } catch (error) {
        logger.error("Failed to load usage", { error });
      }
    };
    
    loadUsage();
  }, [user?.id]);

  if (!usage) return null;

  const percentage = (usage.used / usage.limit) * 100;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-xs">
      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-white">
        {usage.used} / {usage.limit} tokens
      </span>
    </div>
  );
}
