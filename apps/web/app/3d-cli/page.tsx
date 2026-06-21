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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">3D CLI Interface</h1>
          <p className="text-gray-600 mt-2">Create and manage your 3D development environments</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-3d-project"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engine Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="webgl">WebGL Studio (Default)</option>
                <option value="playcanvas">PlayCanvas</option>
                <option value="custom">Custom 3D Runtime</option>
              </select>
            </div>

            <button
              onClick={create3DProject}
              disabled={isCreating || !projectName.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-4">Command Reference</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p><code className="bg-gray-200 px-2 py-1 rounded">create webgl my-project</code> - Create WebGL Studio project</p>
            <p><code className="bg-gray-200 px-2 py-1 rounded">create playcanvas my-game</code> - Create PlayCanvas project</p>
            <p><code className="bg-gray-200 px-2 py-1 rounded">create custom my-runtime</code> - Create custom 3D runtime</p>
            <p><code className="bg-gray-200 px-2 py-1 rounded">list</code> - List all your projects</p>
            <p><code className="bg-gray-200 px-2 py-1 rounded">status {`{project-id}`}</code> - Check project status</p>
          </div>
        </div>
      </div>
    </div>
  );
}
