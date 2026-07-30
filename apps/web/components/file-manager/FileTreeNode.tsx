'use client';

import { useState } from 'react';
import { FileNode } from './FileTree';

interface FileTreeNodeProps {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onNewFile: (dirPath: string) => void;
  onNewFolder: (dirPath: string) => void;
  depth: number;
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'js': return '⚡';
    case 'ts': return '🔷';
    case 'tsx': return '⚛️';
    case 'jsx': return '⚛️';
    case 'json': return '📋';
    case 'svg': return '🖼️';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp': return '🖼️';
    case 'md': return '📝';
    default: return '📄';
  }
}

export function FileTreeNode({
  node,
  selectedPath,
  onSelect,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
  depth,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [showMenu, setShowMenu] = useState(false);

  const isSelected = selectedPath === node.path;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onSelect(node.path);
    }
  };

  const handleRename = () => {
    if (renameValue && renameValue !== node.name) {
      const parentPath = node.path.split('/').slice(0, -1).join('/');
      const newPath = parentPath ? `${parentPath}/${renameValue}` : renameValue;
      onRename(node.path, newPath);
    }
    setRenaming(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-white/5 ${
          isSelected ? 'bg-violet-600/20 text-violet-300' : 'text-white/70'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isFolder && (
          <span className="w-3 text-center text-white/40">
            {expanded ? '▾' : '▸'}
          </span>
        )}
        {!isFolder && <span className="w-3" />}

        <span className="w-4 text-center">
          {isFolder ? (expanded ? '📂' : '📁') : getFileIcon(node.name)}
        </span>

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            className="flex-1 rounded bg-black/40 px-1 py-0 text-xs text-white outline-none border border-violet-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{node.name}</span>
        )}

        {isSelected && !renaming && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameValue(node.name); }}
              className="rounded px-1 text-[10px] text-white/50 hover:text-white hover:bg-white/10"
              title="Rename"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
              className="rounded px-1 text-[10px] text-white/50 hover:text-red-400 hover:bg-white/10"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {showMenu && (
        <div
          className="fixed z-50 rounded-lg border border-white/10 bg-[#0c101d] py-1 shadow-xl"
          style={{ top: '50%', left: '50%' }}
          onMouseLeave={() => setShowMenu(false)}
        >
          {isFolder && (
            <>
              <button
                onClick={() => { onNewFile(node.path); setShowMenu(false); }}
                className="w-full px-3 py-1 text-left text-xs text-white/70 hover:bg-white/10"
              >
                New File
              </button>
              <button
                onClick={() => { onNewFolder(node.path); setShowMenu(false); }}
                className="w-full px-3 py-1 text-left text-xs text-white/70 hover:bg-white/10"
              >
                New Folder
              </button>
              <div className="my-1 border-t border-white/10" />
            </>
          )}
          <button
            onClick={() => { setRenaming(true); setRenameValue(node.name); setShowMenu(false); }}
            className="w-full px-3 py-1 text-left text-xs text-white/70 hover:bg-white/10"
          >
            Rename
          </button>
          <button
            onClick={() => { onDelete(node.path); setShowMenu(false); }}
            className="w-full px-3 py-1 text-left text-xs text-red-400 hover:bg-white/10"
          >
            Delete
          </button>
        </div>
      )}

      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
