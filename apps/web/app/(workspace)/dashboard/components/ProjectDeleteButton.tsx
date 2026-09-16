'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

type ProjectDeleteButtonProps = {
  project: { id: string; name: string };
  onDeleted: () => void;
  className?: string;
  label?: string;
};

export default function ProjectDeleteButton({
  project,
  onDeleted,
  className,
  label = 'Delete project',
}: ProjectDeleteButtonProps) {
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const exactMatch = confirmationName === project.name;

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmationName('');
    setError('');
  };

  const deleteProject = async () => {
    if (deleting || !exactMatch) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(typeof result.message === 'string' ? result.message : 'Unable to delete project.');
      }
      setOpen(false);
      setConfirmationName('');
      onDeleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setConfirmationName(''); setError(''); setOpen(true); }}
        className={className ?? 'inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10'}
      >
        <Trash2 size={15} aria-hidden="true" /> {label}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          role="presentation"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}
          onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-lg rounded-2xl border border-red-500/25 bg-[#0c1625] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,.65)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-red-500/10 p-2 text-red-300"><AlertTriangle size={20} aria-hidden="true" /></span>
                <div>
                  <h2 id={titleId} className="text-lg font-bold">Delete project?</h2>
                  <p id={descriptionId} className="mt-2 text-sm leading-6 text-white/60">
                    This permanently deletes the DreamMakerHub project and its stored project files and revisions.
                    External repositories, cloud resources, and separately published content are not automatically removed.
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Cancel deletion" onClick={close} disabled={deleting} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 disabled:opacity-50"><X size={18} /></button>
            </div>

            <label htmlFor={inputId} className="mt-6 block text-sm text-white/75">
              Type <strong className="select-all break-all font-mono text-white">{project.name}</strong> to confirm:
            </label>
            <input
              id={inputId}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              disabled={deleting}
              placeholder="Exact project name"
              className="mt-2 w-full rounded-lg border border-white/20 bg-[#060d19] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400 disabled:opacity-50"
            />
            {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={close} disabled={deleting} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button
                type="button"
                onClick={() => void deleteProject()}
                disabled={!exactMatch || deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete project permanently'}
              </button>
            </div>
          </section>
        </div>, document.body
      )}
    </>
  );
}
