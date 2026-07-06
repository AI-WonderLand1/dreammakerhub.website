"use client";

import { useState } from "react";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { PuckEditorClient } from "../puck/PuckEditorClient";
import ComponentsLibrary from "./ComponentsLibrary";
import { BottomBar } from "./BottomBar";
import AIAssistantModal from "./AIAssistantModal";

interface StudioClientProps {
  initialData: any;
}

export default function StudioClient({ initialData }: StudioClientProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [editorMode, setEditorMode] = useState('visual');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editorData, setEditorData] = useState<any>(initialData);

  return (
    <div className="h-full bg-black text-white overflow-hidden">
      <PageHeader
        className="h-12 bg-black/80 backdrop-blur-md border-b border-white/10"
        lead={
          <Breadcrumbs
            items={[{ href: "/wonder-build", label: "Wonder Build" }, { label: "Studio" }]}
          />
        }
        title="WonderBuild Studio"
        subtitle="Unified builder interface with components library, visual/Preview/Code views"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex h-8 items-center rounded-lg bg-violet-600/20 px-3 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors"
            >
              ✨ AI Assist
            </button>
            <Link
              href="/wonder-build"
              className="inline-flex h-8 items-center rounded-lg bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              Back to Wonder Build
            </Link>
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="inline-flex h-8 items-center rounded-lg bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              {isLeftPanelOpen ? "Hide Library" : "Show Library"}
            </button>
          </div>
        }
      />

      <div className="flex h-[calc(100vh-3rem)]">
        <ComponentsLibrary isOpen={isLeftPanelOpen} onToggle={setIsLeftPanelOpen} />

        <div className="flex-1 flex flex-col p-3">
          <div className="rounded-xl border border-white/10 bg-black/30 flex-1 flex flex-col overflow-hidden">
            <div
              className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between"
              style={{ height: '2rem' }}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${editorMode === 'visual' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:bg-white/10'}`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${editorMode === 'preview' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:bg-white/10'}`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setEditorMode('code')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${editorMode === 'code' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:bg-white/10'}`}
                >
                  Code
                </button>
              </div>
              <div className="text-xs text-white/40">
                Editor Mode: {editorMode}
              </div>
            </div>

            <div
              className="flex-1 relative overflow-hidden"
              style={{ height: 'calc(100% - 2rem)' }}
            >
              <Suspense fallback={<div className="text-white/50 text-center py-8">Loading studio...</div>}>
                <PuckEditorClient 
                  initialData={editorData} 
                  viewMode={editorMode} 
                  onDataChange={(newData) => setEditorData(newData)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <BottomBar editorMode={editorMode} setEditorMode={setEditorMode} />

      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        currentData={editorData}
        onApplyData={(data) => {
          setEditorData(data);
        }}
      />
    </div>
  );
}
