'use client';

import { useState } from 'react';
import { useBuilderStore } from '../store';

type DraftFile = { path: string; content: string };
type Proposal = { summary: string; files: DraftFile[]; notes: string[]; saved: boolean; verifiedBuild: boolean };

export default function AliceCodePanel() {
  const projectId = useBuilderStore((state) => state.projectId);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'fullstack' | 'web' | 'api'>('fullstack');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selected, setSelected] = useState(0);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    if (!projectId || prompt.trim().length < 5 || working) return;
    setWorking(true); setError(''); setFeedback(''); setProposal(null);
    try {
      const response = await fetch('/api/ai/alice/fullstack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, mode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.files)) throw new Error(data.error || 'Alice could not generate valid project files.');
      setProposal({ summary: data.summary, files: data.files, notes: data.notes || [],
        saved: false, verifiedBuild: false });
      setSelected(0);
      setFeedback('Draft ready. Review every file before saving.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed.');
    } finally { setWorking(false); }
  }

  async function saveFiles() {
    if (!projectId || !proposal || proposal.saved || working) return;
    setWorking(true); setError(''); setFeedback('');
    try {
      const current = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/files', { cache: 'no-store' });
      const existing = await current.json().catch(() => ({}));
      if (!current.ok || !existing.files || typeof existing.files !== 'object') throw new Error(existing.error || 'Could not inspect existing project files.');
      const overwrites = proposal.files.filter((file) => Object.prototype.hasOwnProperty.call(existing.files, file.path)).map((file) => file.path);
      if (overwrites.length && !window.confirm('Overwrite existing files?\n' + overwrites.join('\n') + '\n\nCancel to keep your current files.')) return;
      const files = Object.fromEntries(proposal.files.map((file) => [file.path, file.content]));
      const save = await fetch('/api/projects/' + encodeURIComponent(projectId) + '/files', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }),
      });
      const result = await save.json().catch(() => ({}));
      if (!save.ok || result.success !== true) throw new Error(result.error || 'Project file save failed.');
      setProposal({ ...proposal, saved: true });
      setFeedback('Project files saved. A real build/test and publish are separate steps.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save files.');
    } finally { setWorking(false); }
  }

  const active = proposal?.files[selected] ?? null;
  return (
    <section className="flex h-full flex-col bg-[#080d1b] text-white" aria-label="Alice code workspace">
      <header className="shrink-0 border-b border-white/10 px-3 py-3">
        <div className="text-sm font-bold text-violet-100">Alice · Full-stack code</div>
        <p className="mt-1 text-[11px] leading-4 text-white/55">Generate frontend, backend, and database files for this project. Review before saving.</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="shrink-0 space-y-2 border-b border-white/10 p-3 lg:w-[360px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <label className="block text-[11px] font-semibold text-white/70" htmlFor="alice-code-mode">Build type</label>
        <select id="alice-code-mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}
          className="w-full rounded-lg border border-white/15 bg-[#131b2b] p-2 text-xs text-white">
          <option value="fullstack">Full-stack app</option>
          <option value="web">Website / frontend</option>
          <option value="api">Backend / API</option>
        </select>
        <textarea aria-label="Tell Alice what to build" value={prompt} onChange={(event) => setPrompt(event.target.value)}
          placeholder="Build a beautifully designed SaaS dashboard with signup, database schema and protected API routes…"
          rows={4} className="w-full resize-y rounded-lg border border-white/15 bg-[#131b2b] p-2 text-xs text-white outline-none focus:border-violet-400" />
        <button type="button" onClick={() => void generate()}
          disabled={working || !projectId || prompt.trim().length < 5}
          className="w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40">
          {working ? 'Working…' : 'Generate project files'}
        </button>
        {!projectId && <p role="status" className="text-[11px] text-amber-200">Select or create a saved project first.</p>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {error && <p role="alert" className="mb-2 rounded-lg border border-rose-300/20 p-2 text-xs text-rose-200">{error}</p>}
        {feedback && <p role="status" className="mb-2 text-xs text-violet-100">{feedback}</p>}
        {proposal && <>
          <h3 className="text-xs font-bold text-white">{proposal.summary}</h3>
          <p className="mt-1 text-[11px] text-white/50">{proposal.files.length} file drafts · Not build-verified</p>
          <div className="my-3 space-y-1" aria-label="Generated project file tree">
            {proposal.files.map((file, index) =>
              <button type="button" key={file.path} onClick={() => setSelected(index)}
                className={'block w-full rounded-md px-2 py-1.5 text-left font-mono text-[11px] ' +
                  (selected === index ? 'bg-violet-600/20 text-violet-100' : 'bg-white/[.03] text-white/60')}>
                {file.path}
              </button>)}
          </div>
          {active && <>
            <label htmlFor="alice-draft-code" className="text-[11px] font-bold text-white/75">Review or edit: {active.path}</label>
            <textarea id="alice-draft-code" spellCheck={false} value={active.content} disabled={proposal.saved}
              onChange={(event) => setProposal((current) => current ? ({
                ...current, files: current.files.map((file, index) => index === selected ? { ...file, content: event.target.value } : file),
              }) : current)}
              rows={14} className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/35 p-2 font-mono text-[11px] text-white/80" />
          </>}
          {!!proposal.notes.length && <div className="my-3 text-[11px] text-amber-100/80">
            {proposal.notes.map((note, index) => <p key={index}>{note}</p>)}
          </div>}
          <button type="button" onClick={() => void saveFiles()} disabled={working || proposal.saved}
            className="w-full rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            {proposal.saved ? 'Saved to project' : 'Review complete — save these files'}
          </button>
          <a href={'/dashboard/projects/' + encodeURIComponent(projectId) + '/files'}
            className="mt-2 block text-center text-xs text-violet-200 underline">Open project files</a>
          <p className="mt-2 text-[10px] text-white/40">Saving does not compile, execute, enable payments, or publish the app.</p>
        </>}
      </div>
      </div>
    </section>
  );
}
