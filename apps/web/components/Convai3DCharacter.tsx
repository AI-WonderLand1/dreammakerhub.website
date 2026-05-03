"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ConvaiPlayer?: any;
    convai: any;
  }
}

interface Convai3DCharacterProps {
  characterId?: string;
  onResponse?: (text: string) => void;
  className?: string;
}

export default function Convai3DCharacter({ 
  characterId: propCharacterId,
  onResponse,
  className = ""
}: Convai3DCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ apiKey: string; characterId: string } | null>(null);

  useEffect(() => {
    async function loadCredentials() {
      try {
        const res = await fetch('/api/vault/credentials');
        const data = await res.json();
        if (data.apiKey && data.characterId) {
          setCredentials(data);
        } else {
          setError("Convai credentials not available");
          setIsLoading(false);
        }
      } catch (e) {
        setError("Failed to load credentials");
        setIsLoading(false);
      }
    }
    loadCredentials();
  }, []);

  useEffect(() => {
    if (!credentials || !containerRef.current || playerRef.current) return;

    const initPlayer = async () => {
      try {
        const container = containerRef.current!;
        
        const script = document.createElement('script');
        script.src = 'https://cdn.convai.com/player/sdk.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });

        if (!window.ConvaiPlayer) {
          throw new Error("Convai SDK failed to load");
        }

        const characterIdToUse = propCharacterId || credentials.characterId;
        
        playerRef.current = new window.ConvaiPlayer({
          characterId: characterIdToUse,
          apiKey: credentials.apiKey,
          container: container,
          enableVoice: true,
          enableFace: true,
          lipSync: true,
          background: "transparent",
          onStart: () => {
            setIsLoading(false);
            console.log("Convai character started");
          },
          onResponse: (response: string) => {
            if (onResponse) {
              onResponse(response);
            }
          },
          onError: (err: string) => {
            console.error("Convai error:", err);
            setError(err);
          }
        });

      } catch (err) {
        console.error("Failed to initialize Convai player:", err);
        setError(String(err));
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [credentials, propCharacterId, onResponse]);

  const sendMessage = (text: string) => {
    if (playerRef.current) {
      playerRef.current.sendText(text);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 rounded-full ${className}`}>
        <div className="text-center p-4">
          <span className="text-4xl">🔮</span>
          <p className="text-white/60 text-xs mt-2">Spirit Guide ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Loading Spirit Guide...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function useConvaiCharacter() {
  const [credentials, setCredentials] = useState<{ apiKey: string; characterId: string } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      const creds = await getConvaiCredentials();
      setCredentials(creds);
      setIsReady(true);
    }
    load();
  }, []);

  return { credentials, isReady };
}