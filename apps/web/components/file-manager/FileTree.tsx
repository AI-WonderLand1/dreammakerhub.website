'use client';

import { useState } from 'react';
import { FileTreeNode } from './FileTreeNode';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onNewFile: (dirPath: string) => void;
  onNewFolder: (dirPath: string) => void;
}

function buildTree(filePaths: string[]): FileNode[] {
  const root: FileNode[] = [];

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const path = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1;

      const existing = current.find((n) => n.name === name);
      if (existing) {
        if (!isFile && existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileNode = {
          name,
          path,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        current.push(node);
        if (!isFile) {
          current = node.children!;
        }
      }
    }
  }

  return root;
}

export function FileTree({ files, selectedPath, onSelect, onRename, onDelete, onNewFile, onNewFolder }: FileTreeProps) {
  const tree = buildTree(files);

  if (tree.length === 0) {
    return (
      <div className="p-4 text-xs text-white/40">
        No files yet. Create a new file or folder to get started.
      </div>
    );
  }

  return (
    <div className="py-1">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          depth={0}
        />
      ))}
    </div>
  );
}

export { buildTree };
