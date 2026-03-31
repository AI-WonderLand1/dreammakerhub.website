import { useMemo } from 'react';

/**
 * Lightweight placeholder hook used by generated docs and future AI event-stream work.
 * Keeping this file non-empty prevents accidental parser/install failures in workspace tooling.
 */
export function useAIEventStream() {
  return useMemo(
    () => ({
      status: 'idle' as const,
      events: [] as unknown[],
    }),
    [],
  );
}
