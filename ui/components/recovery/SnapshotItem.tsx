"use client";
import { Trash2, RotateCcw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming a class utility

interface Snapshot { id: string; createdAt: string | number | Date; }

export default function SnapshotItem({ snapshot, onRestore, onDelete }: { 
  snapshot: Snapshot, 
  onRestore: (s: any) => void, 
  onDelete: (id: string) => void 
}) {
  const date = new Date(snapshot.createdAt);

  return (
    <div className="group flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Snapshot {date.toLocaleTimeString()}</p>
          <p className="text-xs text-slate-500">{date.toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRestore(snapshot)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-purple-600 text-xs text-white rounded-lg transition"
        >
          <RotateCcw className="w-3 h-3" /> Restore
        </button>
        <button
          onClick={() => onDelete(snapshot.id)}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          title="Delete snapshot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
