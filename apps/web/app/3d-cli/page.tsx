"use client";

import { useState } from 'react';

type ProjectType = 'webgl' | 'playcanvas' | 'custom';

interface CreateProjectResponse {
  success: boolean;
  message: string;
  workspaceId?: string;
  accessUrl?: string;
  status?: string;
}

export default function Custom3DCLInterface() {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('webgl');
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<CreateProjectResponse | null>(null);

  const create3DProject = async () => {
    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/3d-cli/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectType,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create project',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getTemplateLabel = (type: ProjectType) => {
    switch (type) {
      case 'webgl':
        return 'WebGL Studio';
      case 'playcanvas':
        return 'PlayCanvas';
      case 'custom':
        return 'Custom 3D';
      default:
        return 'WebGL Studio';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">WonderBuild 3D CLI</h1>
          <p className="text-violet-300 mt-2">Create and manage your AI Wonderland 3D development environments</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/70 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-violet-200 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-3d-project"
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-200 mb-2">
                Engine Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-white"
              >
                <option value="webgl">WonderPlay 3D (WebGL)</option>
                <option value="playcanvas">WonderPlay 3D (PlayCanvas)</option>
                <option value="custom">Custom 3D Runtime</option>
              </select>
            </div>

            <button
              onClick={create3DProject}
              disabled={isCreating || !projectName.trim()}
              className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating 3D Environment...' : `Create ${getTemplateLabel(projectType)} Project`}
            </button>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-6 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-semibold text-lg mb-2">
              {result.success ? '✅ Project Created' : '❌ Creation Failed'}
            </h3>
            <p className="text-gray-700">{result.message}</p>
            {result.workspaceId && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Workspace ID:</strong> {result.workspaceId}
                </p>
                {result.accessUrl && (
                  <a
                    href={result.accessUrl}
                    className="text-blue-600 hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open 3D Environment →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 rounded-lg border border-white/10 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-lg mb-4 text-white">Command Reference</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p><code className="bg-slate-800 px-2 py-1 rounded text-violet-300">create webgl my-project</code> - Create WonderPlay 3D (WebGL) project</p>
            <p><code className="bg-slate-800 px-2 py-1 rounded text-violet-300">create playcanvas my-game</code> - Create WonderPlay 3D (PlayCanvas) project</p>
            <p><code className="bg-slate-800 px-2 py-1 rounded text-violet-300">create custom my-runtime</code> - Create custom 3D runtime</p>
            <p><code className="bg-slate-800 px-2 py-1 rounded text-violet-300">list</code> - List all your projects</p>
            <p><code className="bg-slate-800 px-2 py-1 rounded text-violet-300">status {`{project-id}`}</code> - Check project status</p>
          </div>
        </div>
      </div>
    </div>
  );
}
