"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown, ChevronUp, GripHorizontal, SquareTerminal, X } from "lucide-react";

type TerminalTab = "terminal" | "problems" | "output";

const OPEN_KEY = "dmh.browser-terminal.open";
const HEIGHT_KEY = "dmh.browser-terminal.height";
const TAB_KEY = "dmh.browser-terminal.tab";
const DEFAULT_HEIGHT = 220;
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 520;

const clampHeight = (value: number) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, value));

export default function BrowserTerminalPanel({ projectId }: { projectId?: string | null }) {
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [tab, setTab] = useState<TerminalTab>("terminal");
  const dragging = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    try {
      const storedOpen = window.localStorage.getItem(OPEN_KEY);
      const storedHeight = Number(window.localStorage.getItem(HEIGHT_KEY));
      const storedTab = window.localStorage.getItem(TAB_KEY) as TerminalTab | null;
      if (storedOpen !== null) setOpen(storedOpen === "true");
      if (Number.isFinite(storedHeight) && storedHeight > 0) setHeight(clampHeight(storedHeight));
      if (storedTab && ["terminal", "problems", "output"].includes(storedTab)) setTab(storedTab);
    } catch {
      // Storage can be blocked in privacy modes; the panel still works in memory.
    }
  }, []);

  const persistOpen = (next: boolean) => {
    setOpen(next);
    try { window.localStorage.setItem(OPEN_KEY, String(next)); } catch {}
  };

  const persistTab = (next: TerminalTab) => {
    setTab(next);
    try { window.localStorage.setItem(TAB_KEY, next); } catch {}
  };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = { startY: event.clientY, startHeight: height };
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const active = dragging.current;
      if (!active) return;
      setHeight(clampHeight(active.startHeight + (active.startY - moveEvent.clientY)));
    };
    const stop = () => {
      dragging.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      setHeight(current => {
        try { window.localStorage.setItem(HEIGHT_KEY, String(current)); } catch {}
        return current;
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const tabs: Array<{ key: TerminalTab; label: string }> = [
    { key: "terminal", label: "Terminal" },
    { key: "problems", label: "Problems" },
    { key: "output", label: "Output" },
  ];

  return (
    <section aria-label="Browser terminal panel" className="overflow-hidden rounded-xl border border-white/10 bg-[#070d16]">
      {open && (
        <button
          type="button"
          aria-label="Resize terminal panel"
          title="Drag to resize terminal"
          onPointerDown={startResize}
          className="flex h-3 w-full cursor-row-resize items-center justify-center border-b border-white/5 text-white/25 hover:text-white/60"
        >
          <GripHorizontal size={16} aria-hidden="true" />
        </button>
      )}

      <div className="flex min-h-10 items-center justify-between border-b border-white/10 bg-[#0a1220] px-2">
        <div className="flex min-w-0 items-center">
          {tabs.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                persistTab(item.key);
                if (!open) persistOpen(true);
              }}
              aria-current={tab === item.key ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-xs transition ${
                open && tab === item.key
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => persistOpen(!open)}
            aria-label={open ? "Collapse terminal panel" : "Open terminal panel"}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          {open && (
            <button
              type="button"
              onClick={() => persistOpen(false)}
              aria-label="Hide terminal panel"
              className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ height }} className="min-h-0 overflow-auto bg-[#050a12] p-4 font-mono text-xs text-slate-300">
          {tab === "terminal" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-300">
                <SquareTerminal size={14} aria-hidden="true" />
                <span>DreamMakerHub browser terminal</span>
                {projectId && <span className="text-slate-500">· project {projectId}</span>}
              </div>
              <p className="text-slate-500">$ runtime status</p>
              <p>Browser runtime is not connected yet.</p>
              <p className="max-w-2xl text-slate-500">
                This panel is intentionally UI-only for now. It does not pretend to run shell commands or expose server credentials.
              </p>
            </div>
          )}
          {tab === "problems" && (
            <p className="text-slate-500">No runtime diagnostics are connected yet.</p>
          )}
          {tab === "output" && (
            <p className="text-slate-500">Build and preview output will appear here when the browser runtime is connected.</p>
          )}
        </div>
      )}
    </section>
  );
}
