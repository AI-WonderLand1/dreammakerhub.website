import { useState, useCallback } from 'react';

export function usePublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(async (options: any) => {
    setIsPublishing(true);
    setError(null);
    try {
      const response = await fetch('/api/projects/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Failed to publish');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, []);

  return { publish, isPublishing, error };
}
