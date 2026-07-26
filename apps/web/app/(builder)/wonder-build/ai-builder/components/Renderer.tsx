"use client";

import { useCallback } from "react";
import { CanvasElement } from '@/lib/builder/types';

interface AIBuilderRendererProps {
  jsonData: any;
}

export default function AIBuilderRenderer({ jsonData }: AIBuilderRendererProps) {
  const json = jsonData;

  const handleExport = useCallback(() => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'builder-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [json]);

  return (
    <div className="ai-builder-renderer pointer-events-none">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Builder Content</h3>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Export JSON
          </button>
        </div>
        <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
