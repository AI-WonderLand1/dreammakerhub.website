'use client';

interface FileManagerToolbarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onDeleteSelected: () => void;
  onImport: () => void;
  onDownloadZip: () => void;
  selectedPath: string | null;
}

export function FileManagerToolbar({
  onNewFile,
  onNewFolder,
  onDeleteSelected,
  onImport,
  onDownloadZip,
  selectedPath,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-2 py-1.5">
      <button
        onClick={onNewFile}
        className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        title="New File"
      >
        📄 New File
      </button>
      <button
        onClick={onNewFolder}
        className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        title="New Folder"
      >
        📁 New Folder
      </button>
      {selectedPath && (
        <button
          onClick={onDeleteSelected}
          className="rounded px-2 py-1 text-xs text-red-400/60 hover:bg-white/10 hover:text-red-400"
          title="Delete Selected"
        >
          🗑️ Delete
        </button>
      )}
      <button
        onClick={onImport}
        className="rounded px-2 py-1 text-xs text-cyan-400/70 hover:bg-white/10 hover:text-cyan-300"
        title="Import ZIP / HTML / JSON"
      >
        ⬆️ Import
      </button>
      <button
        onClick={onDownloadZip}
        className="rounded px-2 py-1 text-xs text-emerald-400/70 hover:bg-white/10 hover:text-emerald-300"
        title="Download project as ZIP"
      >
        ⬇️ Download ZIP
      </button>
    </div>
  );
}
