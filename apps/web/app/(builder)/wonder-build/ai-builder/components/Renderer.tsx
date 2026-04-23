"use client";

import { useMemo } from "react";
import { Puck } from "@measured/puck";

interface PuckData {
  content: any[];
  zones: any[];
  fields: any;
}

interface JSONRendererProps {
  puckData: PuckData;
}

export function JSONRenderer({ puckData }: JSONRendererProps) {
  const config = useMemo(() => ({
    components: {}
  }), []);

  return (
    <div className="json-renderer">
      <Puck
        data={puckData}
        config={config}
        onChange={() => {}}
        editable={false}
        className="pointer-events-none"
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