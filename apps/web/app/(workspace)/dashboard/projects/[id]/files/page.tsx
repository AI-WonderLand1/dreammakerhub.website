'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

/**
 * Compatibility route for old deep links.
 *
 * The project dashboard now owns the single file browser/editor UI. Keeping
 * this route as a redirect avoids breaking bookmarks without maintaining a
 * second file manager implementation.
 */
export default function ProjectFilesCompatibilityPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const requestedPath = searchParams.get('path');

  useEffect(() => {
    const query = requestedPath ? `?path=${encodeURIComponent(requestedPath)}` : '';
    router.replace(`/dashboard/projects/${encodeURIComponent(projectId)}${query}#files`);
  }, [projectId, requestedPath, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/40">
      Opening project files...
    </div>
  );
}
