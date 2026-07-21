'use client';

import { useState } from 'react';
import { SceneStreamLoader } from '@/lib/scene/stream-loader';
import { logger } from '@/lib/logger';

export function StreamingSceneLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scene, setScene] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadScene = async (sceneId: string) => {
    setLoading(true);
    setProgress(0);
    setScene(null);
    setError(null);

    try {
      await SceneStreamLoader.streamScene(sceneId, {
        onMetadata: (metadata) => {
          logger.info('Scene metadata:', metadata);
        },
        onEntity: (entity, index, total) => {
          logger.info(`Loaded entity ${index + 1}/${total}:`, entity.name);
        },
        onEnvironment: (environment) => {
          logger.info('Environment loaded:', environment);
        },
        onLight: (light, index, total) => {
          logger.info(`Loaded light ${index + 1}/${total}:`, light.type);
        },
        onProgress: (progress) => {
          setProgress(progress);
        },
        onComplete: (completeScene) => {
          setScene(completeScene);
          setLoading(false);
          logger.info('Scene loading complete:', completeScene);
        },
        onError: (error) => {
          setError(error);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Streaming Scene Loader</h3>
      
      <div className="space-y-4">
        <button
          onClick={() => loadScene('template_futuristic_city')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Load Futuristic City Scene
        </button>

        {loading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Loading... {progress.toFixed(0)}%</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {scene && (
          <div className="p-3 bg-green-100 border border-green-400 rounded">
            <h4 className="font-semibold">Scene Loaded Successfully!</h4>
            <p className="text-sm">
              Name: {scene.name}<br />
              Entities: {scene.entities?.length || 0}<br />
              Lights: {scene.lights?.length || 0}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}