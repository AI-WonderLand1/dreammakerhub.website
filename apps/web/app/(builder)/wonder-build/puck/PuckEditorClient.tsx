"use client";

import { Puck } from "@puckeditor/core";
import { useEffect, useMemo, useState } from "react";
import "@measured/puck/puck.css";
import { config } from "./puck.config";

type EditorStatus = "loading" | "loaded" | "empty" | "error";

function LayoutWrapper() {
  return <Puck.Layout />;
}

type InitialData = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
};

export function PuckEditorClient({ initialData }: { initialData: InitialData | null }) {
  const [status, setStatus] = useState<EditorStatus>("loading");

  useEffect(() => {
    if (initialData?.content?.length) {
      setStatus("loaded");
      return;
    }

    setStatus("empty");
  }, [initialData]);

  const hasContent = (initialData?.content?.length ?? 0) > 0;
  const shellClassName = useMemo(
    () => "h-[80vh] w-full overflow-hidden rounded-lg border border-white/10",
    [],
  );

  return (
    <div className={shellClassName}>
      {status === "loading" && (
        <div className="flex h-full animate-pulse items-center justify-center text-sm text-white/80">Loading editor shell…</div>
      )}
      {status === "empty" && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-lg font-semibold text-white">No content yet</p>
          <p className="text-sm text-white/70">Start from a heading block to build your Wonder page.</p>
          <button
            type="button"
            onClick={() => setStatus("loaded")}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Create first block
          </button>
        </div>
      )}
      {status === "error" && <div className="p-4 text-sm text-red-300">Failed to load editor content.</div>}
      {status !== "loading" && (hasContent || status === "loaded") && (
        <Puck
          config={config}
          data={initialData ?? { content: [] }}
          iframe={{
            enabled: false,
            permissions: {},
          }}
        >
          <LayoutWrapper />
        </Puck>
      )}
    </div>
  );
}
