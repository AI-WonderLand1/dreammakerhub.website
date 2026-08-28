"use client";

import React, { useState, useEffect } from 'react';
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';
import { getCurrentUserSession } from '@/components/playcanvas-isolation/utils/auth';
import { logger } from '@/lib/logger';

export default function PlayCanvasIsolatedPage() {
  const [userId, setUserId] = useState<string>('');
  const [sceneId, setSceneId] = useState<string>('test-scene');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const userSession = await getCurrentUserSession();
        if (userSession) {
          setUserId(userSession.userId);
          setSession(userSession);
        } else {
          setError('Authentication required — please log in.');
        }
      } catch (err) {
        setError('Failed to load user session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const handleStatusChange = (status: string) => {
    logger.info('[PlayCanvas Status]', status);
  };

  const handleReady = () => {
    logger.info('[PlayCanvas] Editor is ready');
  };

  const handleError = (error: Error) => {
    logger.error('[PlayCanvas] Error:', error);
    // Only set error if it's not a WebContainer availability issue
    if (!error.message.includes('WebContainer') && !error.message.includes('SharedArrayBuffer')) {
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">NPC AI SIM - Isolated Editor</h1>
          <p className="text-gray-400">
            AI Wonderland's private WebContainer-based PlayCanvas 3D environment
          </p>
          
          {/* User info */}
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">User ID</p>
                <p className="font-mono text-sm">{userId.substring(0, 16)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Scene ID</p>
                <p className="font-mono text-sm">{sceneId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Session</p>
                <p className={`text-sm ${session ? 'text-green-400' : 'text-yellow-400'}`}>
                  {session ? 'Authenticated' : 'Demo Mode'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Controls */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scene ID</label>
              <input
                type="text"
                value={sceneId}
                onChange={(e) => setSceneId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="Enter scene ID"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="Enter user ID"
              />
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Reload Editor
            </button>
          </div>
        </div>

        {/* Isolated PlayCanvas Editor */}
        <div className="h-[600px] border border-gray-800 rounded-lg overflow-hidden">
          {error ? (
            <div className="h-full flex items-center justify-center bg-gray-900">
              <div className="text-center p-8">
                <p className="text-red-400 mb-4">{error}</p>
                <p className="text-gray-400 text-sm mb-4">
                  Demo mode: WebContainer might not be available in this environment.
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    // In a real environment, this would re-initialize the component
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <IsolatedPlayCanvas
              userId={userId}
              sceneId={sceneId}
              onReady={handleReady}
              onError={handleError}
              onStatusChange={handleStatusChange}
              className="h-full"
            />
          )}
        </div>

        {/* Info section */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-3">Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded">
              <h4 className="font-semibold text-blue-400 mb-2">1. Service Worker</h4>
              <p className="text-sm text-gray-400">
                Routes requests to user-specific WebContainer instances
              </p>
            </div>
            <div className="p-4 bg-gray-800 rounded">
              <h4 className="font-semibold text-green-400 mb-2">2. WebContainer</h4>
              <p className="text-sm text-gray-400">
                Isolated virtual filesystem per user for project files
              </p>
            </div>
            <div className="p-4 bg-gray-800 rounded">
              <h4 className="font-semibold text-purple-400 mb-2">3. PlayCanvas</h4>
              <p className="text-sm text-gray-400">
                3D editor runs in browser with data from WebContainer
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <h4 className="text-red-400 font-semibold mb-2">Error</h4>
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}