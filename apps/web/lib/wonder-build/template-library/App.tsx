'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BatchPromptList } from './components/BatchPromptList';
import { PromptViewer } from './components/PromptViewer';
import { VisualRenderer } from './components/VisualRenderer';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { CreatorStudioModal } from './components/CreatorStudioModal';
import { AIImageStudioModal } from './components/AIImageStudioModal';
import { GroundedSearchModal } from './components/GroundedSearchModal';
import { VoiceCoPilotModal } from './components/VoiceCoPilotModal';
import { GeminiIntelligenceModal } from './components/GeminiIntelligenceModal';
import IndustryPicker from './components/IndustryPicker';

import { BATCH_DEFINITIONS } from './data/batchPrompts';
import { INITIAL_PRESET_TEMPLATES } from './data/presetTemplates';
import {
  ActiveTab,
  WonderBuildTemplate,
  WonderBuildElement,
  ViewportMode,
} from './types';
import { downloadJsonFile } from './utils/templateUtils';
import { buildBuilderStatePayload } from './utils/builderAdapter';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('prompts');
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<number>(1);
  const [templates, setTemplates] = useState<WonderBuildTemplate[]>(INITIAL_PRESET_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    INITIAL_PRESET_TEMPLATES[0].id
  );
  const [builderLoading, setBuilderLoading] = useState<boolean>(false);

  const [selectedElementPath, setSelectedElementPath] = useState<number[]>([]);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isCreatorStudioOpen, setIsCreatorStudioOpen] = useState<boolean>(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState<boolean>(false);
  const [isSearchGroundingOpen, setIsSearchGroundingOpen] = useState<boolean>(false);
  const [isVoiceCoPilotOpen, setIsVoiceCoPilotOpen] = useState<boolean>(false);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState<boolean>(false);
  const [isGuidedStartOpen, setIsGuidedStartOpen] = useState<boolean>(true);

  // /wonder-build/templates?mode=ai opens the existing AI starting flow without
  // forcing every consumer of this shared component to use Next's search hook.
  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    if (mode === 'ai') {
      setIsGuidedStartOpen(false);
      setIsAiModalOpen(true);
    }
  }, []);

  const handlePublishCreatorTemplate = (newTemplate: WonderBuildTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    setSelectedTemplateId(newTemplate.id);
  };

  const handleSelectIndustry = (batchNumber: number) => {
    setSelectedBatchNumber(batchNumber);
    setActiveTab('prompts');
    const batch = BATCH_DEFINITIONS.find((b) => b.batchNumber === batchNumber);
    const matched = batch
      ? templates.find((t) => t.category.toLowerCase() === batch.category.toLowerCase())
      : undefined;
    if (matched) setSelectedTemplateId(matched.id);
    setIsGuidedStartOpen(false);
  };

  // Create the real project, seed canonical builder state, then open the real editor.
  const handleOpenInBuilder = async (tpl: WonderBuildTemplate) => {
    if (!tpl || builderLoading) return;
    setBuilderLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tpl.name, tool: 'wonderbuild' }),
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = `/public-pages/auth?redirectTo=${encodeURIComponent('/wonder-build')}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Unable to create project');
      }

      const { project } = await res.json();
      if (!project?.id) throw new Error('Project creation returned no id');

      const seedRes = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: { 'builder-state.json': buildBuilderStatePayload(tpl) },
        }),
      });

      if (!seedRes.ok) throw new Error('Unable to seed the builder with this template');

      window.location.href = `/wonder-build/builder?projectId=${encodeURIComponent(project.id)}`;
    } catch (err: any) {
      alert(err?.message || 'Failed to open template in builder');
      setBuilderLoading(false);
    }
  };

  const currentBatch =
    BATCH_DEFINITIONS.find((b) => b.batchNumber === selectedBatchNumber) ||
    BATCH_DEFINITIONS[0];

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const batchTemplates = templates.filter(
    (t) => t.category.toLowerCase() === currentBatch.category.toLowerCase()
  );

  const getElementAtPath = (
    elements: WonderBuildElement[],
    path: number[]
  ): WonderBuildElement | null => {
    if (!elements || path.length === 0) return null;
    let curr: WonderBuildElement | null = null;
    let currList = elements;

    for (const idx of path) {
      if (!currList || !currList[idx]) return null;
      curr = currList[idx];
      currList = curr.children || [];
    }
    return curr;
  };

  const selectedElement = getElementAtPath(
    currentTemplate.elements,
    selectedElementPath
  );

  // Tree manipulation handlers used by Start-step helper tools.
  const handleUpdateElementNode = (
    path: number[],
    updatedNode: WonderBuildElement
  ) => {
    const updateInTree = (
      elements: WonderBuildElement[],
      p: number[]
    ): WonderBuildElement[] => {
      if (p.length === 0) return elements;
      const [head, ...tail] = p;
      return elements.map((item, index) => {
        if (index === head) {
          if (tail.length === 0) return updatedNode;
          return {
            ...item,
            children: updateInTree(item.children || [], tail),
          };
        }
        return item;
      });
    };

    const newElements = updateInTree(currentTemplate.elements, path);
    const updatedTemplate = { ...currentTemplate, elements: newElements };

    setTemplates((prev) =>
      prev.map((t) => (t.id === currentTemplate.id ? updatedTemplate : t))
    );
  };

  const handleExportAll = () => {
    downloadJsonFile(templates, 'wonderbuild_60_templates_master.json');
  };

  const handleImportBatchTemplates = (newTemplates: WonderBuildTemplate[]) => {
    setTemplates((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filteredNew = newTemplates.filter((t) => !existingIds.has(t.id));
      return [...prev, ...filteredNew];
    });
  };

  // Template cards are starting points. Customize/Edit always opens the canonical builder.
  const handleSelectTemplateAndOpenBuilder = (tpl: WonderBuildTemplate) => {
    setSelectedTemplateId(tpl.id);
    void handleOpenInBuilder(tpl);
  };

  const handleGenerateTemplateFromSearchResearch = (topic: string, summary: string) => {
    const newId = `tpl-grounded-${Date.now()}`;
    const newTemplate: WonderBuildTemplate = {
      id: newId,
      name: `Grounded AI: ${topic.slice(0, 24)}...`,
      category: currentBatch.category,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      description: `Template generated based on Google Search grounding research: ${topic}`,
      elements: [
        {
          type: 'section',
          styles: {
            padding: '60px 24px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            textAlign: 'center',
          },
          children: [
            {
              type: 'heading',
              content: topic,
              styles: {
                fontSize: '36px',
                fontWeight: '800',
                marginBottom: '16px',
                color: '#ffffff',
              },
            },
            {
              type: 'text',
              content: summary.slice(0, 240) + '...',
              styles: {
                fontSize: '16px',
                color: '#94a3b8',
                maxWidth: '700px',
                margin: '0 auto 28px auto',
              },
            },
            {
              type: 'button',
              content: 'Explore Grounded Template',
              styles: {
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: '600',
              },
            },
          ],
        },
      ],
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    setSelectedTemplateId(newId);
    void handleOpenInBuilder(newTemplate);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalTemplatesCount={templates.length}
        readyBatchesCount={BATCH_DEFINITIONS.length}
        onExportAll={handleExportAll}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenCreatorStudio={() => setIsCreatorStudioOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenSearchGrounding={() => setIsSearchGroundingOpen(true)}
        onOpenVoiceCoPilot={() => setIsVoiceCoPilotOpen(true)}
        onOpenIntelligence={() => setIsIntelligenceOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-4rem)]">
        <BatchPromptList
          selectedBatchNumber={selectedBatchNumber}
          templates={templates}
          onSelectBatch={(batch) => {
            setSelectedBatchNumber(batch.batchNumber);
            setActiveTab('prompts');
            const matched = templates.find(
              (t) => t.category.toLowerCase() === batch.category.toLowerCase()
            );
            if (matched) setSelectedTemplateId(matched.id);
          }}
          onRunBatchAi={(batch) => {
            setSelectedBatchNumber(batch.batchNumber);
            setIsAiModalOpen(true);
          }}
          onSelectTemplateToPreview={handleSelectTemplateAndOpenBuilder}
        />

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'prompts' && (
            <PromptViewer
              batch={currentBatch}
              associatedTemplates={batchTemplates}
              onSelectTemplateToView={handleSelectTemplateAndOpenBuilder}
              onRunBatchAi={(batch) => {
                setSelectedBatchNumber(batch.batchNumber);
                setIsAiModalOpen(true);
              }}
            />
          )}

          {activeTab === 'visual-builder' && (
            <div className="flex-1 flex h-full overflow-hidden">
              <VisualRenderer
                template={currentTemplate}
                selectedElementPath={selectedElementPath}
                onSelectElement={(path) => setSelectedElementPath(path)}
                viewportMode={viewportMode}
                setViewportMode={setViewportMode}
              />
            </div>
          )}
        </div>
      </div>

      <IndustryPicker
        isOpen={isGuidedStartOpen}
        onSelectIndustry={handleSelectIndustry}
        onSkip={() => setIsGuidedStartOpen(false)}
      />

      <AiGeneratorModal
        batch={currentBatch}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGeneratedSuccess={(newTemplates) => {
          handleImportBatchTemplates(newTemplates);
          if (newTemplates.length > 0) {
            setSelectedTemplateId(newTemplates[0].id);
            void handleOpenInBuilder(newTemplates[0]);
          }
        }}
      />

      <CreatorStudioModal
        isOpen={isCreatorStudioOpen}
        onClose={() => setIsCreatorStudioOpen(false)}
        currentActiveTemplate={currentTemplate}
        onPublishTemplate={handlePublishCreatorTemplate}
        creatorTemplates={templates.filter((t) => t.isCreatorTemplate)}
      />

      <AIImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        currentTemplate={currentTemplate}
        selectedElementNode={selectedElement}
        selectedElementPath={selectedElementPath}
        onUpdateElementNode={handleUpdateElementNode}
      />

      <GroundedSearchModal
        isOpen={isSearchGroundingOpen}
        onClose={() => setIsSearchGroundingOpen(false)}
        onGenerateFromResearch={handleGenerateTemplateFromSearchResearch}
      />

      <VoiceCoPilotModal
        isOpen={isVoiceCoPilotOpen}
        onClose={() => setIsVoiceCoPilotOpen(false)}
      />

      <GeminiIntelligenceModal
        isOpen={isIntelligenceOpen}
        onClose={() => setIsIntelligenceOpen(false)}
        currentTemplate={currentTemplate}
      />
    </div>
  );
}
