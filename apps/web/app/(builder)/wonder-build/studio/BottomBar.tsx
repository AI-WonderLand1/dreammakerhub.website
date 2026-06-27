"use client";

interface BottomBarProps {
  editorMode: "visual" | "preview" | "code";
  setEditorMode: (mode: "visual" | "preview" | "code") => void;
}

export default function BottomBar({ editorMode, setEditorMode }: BottomBarProps) {
  return (
    <div className="h-8 bg-black/80 border-t border-white/10 px-4 flex items-center justify-between text-white/40 text-[10px] font-medium">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Connected to WonderBuild</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Mode: </span>
          <span className="text-white/70 uppercase">{editorMode}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-white/30">Last saved: Just now</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/30">Version: 1.0.0</span>
        </div>
      </div>
    </div>
  );
}