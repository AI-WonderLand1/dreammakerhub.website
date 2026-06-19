"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bookmark, Plus, Save, Trash2, X, Copy, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SavedBlock {
  id: string;
  name: string;
  type: string;
  props: Record<string, unknown>;
  timestamp: number;
}

interface BlocksLibraryProps {
  onAddBlock?: (type: string, props?: Record<string, unknown>) => void;
  onSaveBlock?: (type: string, props: Record<string, unknown>) => void;
}

const STORAGE_KEY = "puck-saved-blocks";

function loadBlocks(): SavedBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBlocks(blocks: SavedBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

export function BlocksLibrary({ onAddBlock, onSaveBlock }: BlocksLibraryProps) {
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<SavedBlock[]>([]);
  const [blockName, setBlockName] = useState("");
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    if (open) setBlocks(loadBlocks());
  }, [open]);

  const handleDelete = useCallback((id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    saveBlocks(updated);
  }, [blocks]);

  const handleSave = useCallback(() => {
    if (!blockName.trim() || !savingType) return;
    const newBlock: SavedBlock = {
      id: `block-${Date.now()}`,
      name: blockName.trim(),
      type: savingType,
      props: {},
      timestamp: Date.now(),
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    saveBlocks(updated);
    setBlockName("");
    setSavingType(null);
  }, [blockName, savingType, blocks]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
        title="Saved Blocks Library"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Blocks</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Saved Blocks</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No saved blocks yet</p>
              <p className="text-white/20 text-xs mt-1">
                Select an element and save it as a block
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {block.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {block.type.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAddBlock?.(block.type, block.props)}
                      className="p-1.5 rounded-lg hover:bg-violet-500/20 text-white/50 hover:text-violet-400 transition-colors"
                      title="Add to page"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {savingType && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Input
                size={1}
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Block name..."
                className="flex-1 text-sm h-9"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
              <Button size="sm" onClick={handleSave} disabled={!blockName.trim()}>
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSavingType(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useBlocksLibrary() {
  const [blocks, setBlocks] = useState<SavedBlock[]>([]);

  useEffect(() => {
    setBlocks(loadBlocks());
  }, []);

  const saveCurrentAsBlock = useCallback((type: string, props: Record<string, unknown>, name: string) => {
    const newBlock: SavedBlock = {
      id: `block-${Date.now()}`,
      name,
      type,
      props,
      timestamp: Date.now(),
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    saveBlocks(updated);
  }, [blocks]);

  return { blocks, saveCurrentAsBlock };
}
