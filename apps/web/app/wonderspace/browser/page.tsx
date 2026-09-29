'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, ensureSupabaseConfig } from '@/lib/supabase/client';
import WonderSpaceProjectNavigation from '@/components/dashboard/WonderSpaceProjectNavigation';

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
};

type State = 'loading' | 'ready' | 'signin' | 'error';

const signInUrl = '/public-pages/auth?redirectTo=%2Fwonderspace%2Fbrowser';

export default function WonderSpaceBrowserPage() {
  const router = useRouter();
  const [state, setState] = useState<State>('loading');
  const [projects, setProjects] = useState<Project[]>([]);
  const [reload, setReload] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setState('loading');
      setError('');
      try {
        await ensureSupabaseConfig();
        const supabase = createClient();
        if (!supabase) throw new Error('Project authentication is not configured.');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError || !user) {
          setState('signin');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch('/api/projects', {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: session?.access_token ? { Authorization: 'Bearer ' + session.access_token } : {},
        });
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          setState('signin');
          return;
        }
        const result = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(result?.projects)) {
          throw new Error(result?.message || 'Unable to load your projects. Your existing files have not been changed.');
        }
        const verified = result.projects.filter(
          (entry: unknown): entry is Project =>
            !!entry && typeof entry === 'object' && !Array.isArray(entry) &&
            typeof (entry as Project).id === 'string' && typeof (entry as Project).name === 'string',
        );
        if (active) {
          setProjects(verified);
          setState('ready');
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Unable to load projects.');
          setState('error');
        }
      }
    }

    void load();
    return () => { active = false; };
  }, [reload]);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating || !name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await ensureSupabaseConfig();
      const supabase = createClient();
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      if (!session?.access_token) {
        setState('signin');
        return;
      }
      const response = await fetch('/api/projects', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ name: name.trim(), type: 'workspace' }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.project?.id !== 'string') {
        throw new Error(result?.message || 'Could not create the workspace. No project has been opened.');
      }
      // Only navigate after the existing project API confirms persistence.
      router.push('/dashboard/projects/' + encodeURIComponent(result.project.id) + '/files');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create workspace.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080d22] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-4"><Link href="/dashboard" className="text-sm text-cyan-300 hover:underline">← Dashboard</Link></div>
        <header className="mt-5 rounded-2xl border border-cyan-400/20 bg-[#101931] p-7">
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">WonderSpace • Browser editor</span>
          <h1 className="mt-3 text-3xl font-bold">Open your projects and code</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Create and edit real project files with the existing DreamMakerHub code editor.
            Files are saved through your authenticated project storage, without starting a virtual machine.
          </p>
          <p className="mt-2 text-xs text-amber-200">
            Browser editor only: a Linux terminal and isolated cloud runtime are not included in this mode.
          </p>
        </header>

        <div className="mt-4"><WonderSpaceProjectNavigation /></div>

        {state === 'loading' && <p role="status" className="mt-7 text-slate-300">Loading your projects…</p>}
        {state === 'signin' && (
          <section className="mt-7 rounded-2xl border border-white/10 bg-[#101931] p-6">
            <h2 className="text-lg font-semibold">Sign in to open your project files</h2>
            <p className="mt-2 text-sm text-slate-300">Each browser editor only loads projects belonging to your account.</p>
            <Link href={signInUrl} className="mt-4 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Sign in</Link>
          </section>
        )}

        {(state === 'error' || error) && (
          <div role="alert" className="mt-6 rounded-lg border border-amber-400/30 bg-amber-900/20 p-4 text-sm text-amber-100">
            {error}
            {state === 'error' && (
              <button type="button" onClick={() => setReload(value => value + 1)} className="ml-4 underline">
                Retry
              </button>
            )}
          </div>
        )}

        {state === 'ready' && (
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-white/10 bg-[#101931] p-6">
              <h2 className="text-xl font-semibold">My projects</h2>
              {projects.length === 0 ? (
                <p className="mt-4 text-sm text-slate-300">No projects yet. Create a code project to get started.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {projects.map(project => (
                    <li key={project.id}>
                      <Link
                        href={'/dashboard/projects/' + encodeURIComponent(project.id) + '/files'}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[.03] p-4 hover:border-cyan-300/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{project.name}</span>
                          <span className="text-xs text-slate-400">{project.tool || project.type || 'Project'}</span>
                        </span>
                        <span className="shrink-0 text-sm text-cyan-300">Open editor →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setReload(value => value + 1)} className="mt-5 text-sm text-cyan-300 hover:underline">
                Refresh projects
              </button>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-[#101931] p-5">
                <h2 className="text-lg font-semibold">New code project</h2>
                <form onSubmit={event => void createWorkspace(event)} className="mt-4 space-y-3">
                  <label htmlFor="wonderspace-project-name" className="block text-sm text-slate-300">Project name</label>
                  <input
                    id="wonderspace-project-name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="My code project"
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                  />
                  <button type="submit" disabled={creating || !name.trim()} className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">
                    {creating ? 'Saving project…' : 'Create and open editor'}
                  </button>
                </form>
              </section>

            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
