'use client';

interface FileManagerToolbarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onDeleteSelected: () => void;
  selectedPath: string | null;
}

export function FileManagerToolbar({
  onNewFile,
  onNewFolder,
  onDeleteSelected,
  selectedPath,
}: FileManagerToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
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
    </div>
  );
}
