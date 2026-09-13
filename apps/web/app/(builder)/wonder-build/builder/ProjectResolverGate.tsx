'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ProjectSummary = {
  id?: string;
  tool?: string | null;
};

type ResolverState = 'resolving' | 'ready' | 'error';

const WEBSITE_TOOLS = new Set(['wonderbuild', 'website', 'web', 'site', 'builder']);

function isWebsiteProject(project: ProjectSummary): boolean {
  const tool = String(project.tool || '').trim().toLowerCase();
  return !tool || WEBSITE_TOOLS.has(tool);
}

export default function ProjectResolverGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId')?.trim() || '';
  const queryString = searchParams.toString();
  const [state, setState] = useState<ResolverState>(projectId ? 'ready' : 'resolving');
  const [error, setError] = useState('');

  const redirectTarget = useMemo(() => {
    const suffix = queryString ? `?${queryString}` : '';
    return `${pathname}${suffix}`;
  }, [pathname, queryString]);

  useEffect(() => {
    if (projectId) {
      setState('ready');
      setError('');
      return;
    }

    let cancelled = false;

    const resolveProject = async () => {
      setState('resolving');
      setError('');

      try {
        const listResponse = await fetch('/api/projects', { cache: 'no-store' });

        if (listResponse.status === 401 || listResponse.status === 403) {
          router.replace(`/public-pages/auth?redirectTo=${encodeURIComponent(redirectTarget)}`);
          return;
        }

        if (!listResponse.ok) {
          throw new Error('Could not load your projects');
        }

        const listData = await listResponse.json();
        const projects = Array.isArray(listData?.projects) ? listData.projects as ProjectSummary[] : [];
        let project = projects.find((item) => typeof item?.id === 'string' && isWebsiteProject(item));

        if (!project?.id) {
          const createResponse = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Untitled Website', tool: 'wonderbuild' }),
          });

          if (createResponse.status === 401 || createResponse.status === 403) {
            router.replace(`/public-pages/auth?redirectTo=${encodeURIComponent(redirectTarget)}`);
            return;
          }

          const createData = await createResponse.json().catch(() => null);
          if (!createResponse.ok || typeof createData?.project?.id !== 'string') {
            throw new Error(createData?.message || 'Could not create a website project');
          }
          project = createData.project as ProjectSummary;
        }

        if (cancelled || !project?.id) return;

        const nextParams = new URLSearchParams(queryString);
        nextParams.set('projectId', project.id);
        router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'Could not open WonderBuild');
        setState('error');
      }
    };

    void resolveProject();

    return () => {
      cancelled = true;
    };
  }, [pathname, projectId, queryString, redirectTarget, router]);

  if (projectId && state === 'ready') return <>{children}</>;

  if (state === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816] p-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-red-400/15 bg-[#0b1020] p-6 text-center shadow-2xl">
          <h1 className="text-base font-bold">Could not open WonderBuild</h1>
          <p className="mt-2 text-xs leading-5 text-white/50">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.replace('/dashboard#projects')}
              className="rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[.06]"
            >
              Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#050816] text-xs font-semibold text-white/45">
      Opening your website project…
    </div>
  );
}
