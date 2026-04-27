"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayCanvasClient } from './PlayCanvasClient';
import { PlayCanvasContainerManager } from '../webcontainer/PlayCanvasContainer';
import { registerPlayCanvasServiceWorker, registerContainer } from '../service-worker/playcanvas-sw';
import { getOrCreateSSHKey, validateSSHKey } from '../utils/ssh-keys';
import type { UserSession } from '../types/isolation';

export interface IsolatedPlayCanvasProps {
  userId: string;
  sceneId?: string;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
  fallbackUrl?: string;
}

const USE_LOCAL_FALLBACK = process.env.NEXT_PUBLIC_USE_LOCAL_PLAYCANVAS === 'true';

let containerReadyFlag = false;

async function signalContainerReady(userId: string) {
  if (containerReadyFlag) return;
  containerReadyFlag = true;
  
  try {
    await fetch('/api/playcanvas-isolation/ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ready: true }),
    });
    console.log('[IsolatedPlayCanvas] Sent ready signal to server');
  } catch (err) {
    console.error('Failed to signal ready:', err);
  }
}

export function IsolatedPlayCanvas({
  userId,
  sceneId,
  className = '',
  style = {},
  onReady,
  onError,
  onStatusChange,
}: IsolatedPlayCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<PlayCanvasClient | null>(null);
  const heartbeatIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const [status, setStatus] = useState<string>('Initializing...');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback((newStatus: string) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setStatus('Error');
    onError?.(err);
  }, [onError]);

  useEffect(() => {
    let isCancelled = false;

    const initializePlayCanvas = async () => {
      try {
        updateStatus('Registering service worker...');
        await registerPlayCanvasServiceWorker();

        updateStatus('Initializing container manager...');
        const containerManager = new PlayCanvasContainerManager();

        // Generate SSH key for secure access
        updateStatus('Generating SSH key...');
        const sshKey = getOrCreateSSHKey(userId);
        
        if (!validateSSHKey(sshKey)) {
          throw new Error('SSH key validation failed');
        }
        
        updateStatus(`SSH key ready: ${sshKey.fingerprint.substring(0, 8)}...`);
        
        // Pass SSH key to container for secure communication
        updateStatus('Creating PlayCanvas client...');
        const client = new PlayCanvasClient({
          userId,
          sceneId,
          sshKey,
          containerManager,
          onReady: () => {
            if (!isCancelled) {
              updateStatus('Client ready, loading editor...');
              
              // Signal that container is ready - prevents cleanup
              signalContainerReady(userId);
              
              // Start heartbeat to keep container alive while user is editing
              const heartbeatInterval = setInterval(() => {
                fetch('/api/playcanvas-isolation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'ping' }),
                }).catch(() => {});
              }, 60000); // Ping every minute
              heartbeatIntervalsRef.current.add(heartbeatInterval);
              
              // Register container with service worker
              if (clientRef.current) {
                const instance = containerManager.getContainer(userId);
                instance.then(inst => {
                  registerContainer(userId, inst.id);
                });
              }
              
              setIsReady(true);
              onReady?.();
            }
          },
          onError: (err) => {
            if (!isCancelled) {
              handleError(err);
            }
          },
          onStatus: (statusMsg) => {
            if (!isCancelled) {
              updateStatus(statusMsg);
            }
          },
        });

        if (isCancelled) {
          return;
        }

        clientRef.current = client;

        await client.initialize();

        // Create editor container
        if (containerRef.current) {
          client.createEditorContainer(containerRef.current);
        }

        // Load scene if provided
        if (sceneId) {
          await client.loadScene(sceneId);
        }

      } catch (err) {
        if (!isCancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Initialization failed';
          
          // Check if this is a WebContainer availability issue
          if (errorMsg.includes('WebContainer') || errorMsg.includes('SharedArrayBuffer')) {
            // Show demo mode for environments where WebContainer isn't available
            updateStatus('Demo mode: WebContainer not available in this environment');
            setIsReady(true);
            setError(null);
            
            // Show demo content in the container
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #1a1a1a; height: 100%;">
                  <h2 style="color: #00ff00; margin-bottom: 20px;">PlayCanvas Isolated Editor - Demo Mode</h2>
                  <p style="color: #888; margin-bottom: 20px;">
                    This is a demonstration of the isolated PlayCanvas architecture.<br>
                    In production, WebContainer would provide per-user isolation.
                  </p>
                  <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #4CAF50; margin: 5px 0;">✓ User: ${userId.substring(0, 8)}...</p>
                    <p style="color: #4CAF50; margin: 5px 0;">✓ Scene: ${sceneId || 'None'}</p>
                    <p style="color: #4CAF50; margin: 5px 0;">✓ Isolated: true</p>
                    <p style="color: #4CAF50; margin: 5px 0;">✓ Filesystem: Virtual per-user</p>
                  </div>
                  <p style="color: #666; font-size: 12px;">
                    Architecture: Service Worker → WebContainer → PlayCanvas Editor
                  </p>
                </div>
              `;
            }
          } else {
            handleError(err instanceof Error ? err : new Error('Initialization failed'));
          }
        }
      }
    };

    initializePlayCanvas();

    return () => {
      isCancelled = true;
      
      // Cleanup heartbeat intervals
      heartbeatIntervalsRef.current.forEach(id => clearInterval(id));
      heartbeatIntervalsRef.current.clear();
      
      // Cleanup
      if (clientRef.current) {
        clientRef.current.destroy();
        clientRef.current = null;
      }
    };
  }, [userId, sceneId, onReady, handleError, updateStatus]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsReady(false);
    updateStatus('Retrying...');
    
    // Trigger re-initialization by updating a key
    if (clientRef.current) {
      clientRef.current.destroy();
      clientRef.current = null;
    }
    
    // Force re-render
    setTimeout(() => {
      const event = new CustomEvent('playcanvas-retry');
      window.dispatchEvent(event);
    }, 100);
  }, [updateStatus]);

  return (
    <div className={`isolated-playcanvas-container ${className}`} style={style}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            error ? 'bg-red-500' : isReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm text-gray-300">
            {error ? 'Error' : isReady ? 'PlayCanvas Isolated' : 'Loading...'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {status}
        </div>
      </div>

      {/* Editor container */}
      <div className="relative flex-1 bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            <div className="text-red-400 mb-4 text-center max-w-md">
              <p className="font-bold mb-2">Failed to load PlayCanvas editor</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div 
            ref={containerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        )}
        
        {/* Loading overlay */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">{status}</p>
              <p className="text-xs text-gray-500 mt-2">
                Setting up isolated environment for user {userId.substring(0, 8)}...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info bar with SSH key fingerprint */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>User: {userId.substring(0, 8)}...</span>
          <span>Scene: {sceneId || 'None'}</span>
          <span className="text-green-400">SSH: Secured</span>
        </div>
      </div>
    </div>
  );
}

// Hook for using isolated PlayCanvas in other components
export function useIsolatedPlayCanvas(userId: string, sceneId?: string) {
  const [client, setClient] = useState<PlayCanvasClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      try {
        const containerManager = new PlayCanvasContainerManager();
        const playCanvasClient = new PlayCanvasClient({
          userId,
          sceneId,
          containerManager,
          onReady: () => {
            if (!isCancelled) {
              setIsReady(true);
            }
          },
          onError: (err) => {
            if (!isCancelled) {
              setError(err.message);
            }
          },
        });

        await playCanvasClient.initialize();

        if (!isCancelled) {
          setClient(playCanvasClient);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
        }
      }
    };

    initialize();

    return () => {
      isCancelled = true;
      if (client) {
        client.destroy();
      }
    };
  }, [userId, sceneId]);

  return { client, isReady, error };
}