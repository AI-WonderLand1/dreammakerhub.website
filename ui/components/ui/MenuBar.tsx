"use client";
import { useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";

interface MenuBarProps {
  onAction: (action: string) => void;
}

export default function MenuBar({ onAction }: MenuBarProps) {
  const [open, setOpen] = useState<string | null>(null);

  const menus = {
    File: ["New File", "Open File", "Save", "Export"],
    Edit: ["Undo", "Redo", "Cut", "Copy", "Paste"],
    View: ["Toggle Sidebar", "Zoom In", "Zoom Out"],
    Run: ["Start", "Stop"],
    Terminal: ["New Terminal", "Clear Output"],
    AI: ["Open Chat", "Ask AI"],
    Help: ["Docs", "About Wonderland IDE"],
  };

  return (
    <nav className="flex items-center justify-between bg-[#0b0018] text-gray-200 border-b border-fuchsia-800/40 px-3 select-none z-50 relative">
      <div className="flex items-center space-x-6">
        {Object.keys(menus).map((menu) => (
          <div key={menu} className="relative">
            <button
              onClick={() => setOpen(open === menu ? null : menu)}
              className="flex items-center gap-1 py-2 text-sm hover:text-fuchsia-300"
            >
              {menu} <ChevronDown size={14} />
            </button>
            {open === menu && (
              <div
                className="absolute left-0 top-full mt-1 bg-[#14002a] border border-fuchsia-900/40 rounded-md shadow-lg w-40 z-50"
                onMouseLeave={() => setOpen(null)}
              >
                {menus[menu].map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      onAction(item);
                      setOpen(null);
                    }}
                    className="px-3 py-1.5 text-sm hover:bg-fuchsia-900/40 cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm hover:text-fuchsia-300"
        onClick={() => onAction("Open Chat")}
      >
        <MessageSquare size={16} /> AI Assistant
      </button>
    </nav>
  );
                      }
