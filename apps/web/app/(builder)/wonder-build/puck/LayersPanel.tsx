"use client";

import { useState } from "react";
import {
  Layers, Eye, EyeOff, Trash2, ChevronRight, ChevronDown,
} from "lucide-react";

interface TreeNode {
  id: string;
  type: string;
  children?: TreeNode[];
  props?: Record<string, unknown>;
}

interface LayersPanelProps {
  content?: TreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function LayersPanel({
  content = [],
  selectedId,
  onSelect,
  onDelete,
  onReorder,
}: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (content.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <Layers className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-xs text-white/30">No elements on the page</p>
        </div>
      </div>
    );
  }

  function renderNode(node: TreeNode, index: number, depth = 0): React.ReactNode {
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
            isSelected
              ? "bg-violet-600/20 text-violet-300"
              : "hover:bg-white/5 text-white/60 hover:text-white/80"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onSelect?.(node.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
              className="p-0.5 hover:bg-white/10 rounded"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-violet-400" : "bg-white/20"}`} />
          <span className="text-xs flex-1 truncate">
            {node.type.replace(/([A-Z])/g, " $1").trim()}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(node.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <div>
            {node.children!.map((child, i) => renderNode(child, i, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/80">Layers</span>
          <span className="text-[10px] text-white/30 ml-auto">{content.length} items</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {content.map((node, i) => renderNode(node, i))}
      </div>
    </div>
  );
}
