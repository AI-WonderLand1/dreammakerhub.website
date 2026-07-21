"use client";

import { useMemo } from "react";
import { Puck, Data } from "@puckeditor/core";
import { logger } from '@/lib/logger';

interface JSONRendererProps {
  puckData: Data;
}

export function JSONRenderer({ puckData }: JSONRendererProps) {
  const config = useMemo(() => ({
    components: {}
  }), []);

  return (
    <div className="json-renderer pointer-events-none">
      <Puck
        data={puckData}
        config={config}
        onChange={() => {}}
      />
    </div>
  );
}

export function PreviewRenderer({ html }: { html: string }) {
  return (
    <div className="preview-renderer">
      <iframe
        srcDoc={html}
        className="w-full h-full border-none"
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}