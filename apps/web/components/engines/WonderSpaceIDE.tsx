'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { CoderIntegration } from '@/lib/coder/integration';

// Each user gets their OWN private cloud IDE at Coder.com
// Like GitHub Codespaces - isolated, no installation required

export default function WonderSpaceIDE() {
  const { user, loading } = useAuth();
  const [ideUrl, setIdeUrl] = useState<string>('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user || loading) return;

    const provisionIDE = async () => {
      setCreatingWorkspace(true);
      setError('');

      try {
        const coder = new CoderIntegration();
        
        // Each user gets their OWN isolated workspace
        const { ideUrl } = await coder.provisionIDEForProject(
          user.id,
          'wonderspace-project'
        );

        setIdeUrl(ideUrl);
        
        // Redirect to their private Coder workspace
        window.location.href = ideUrl;
        
      } catch (err) {
        console.error('Failed to provision IDE:', err);
        setError('Failed to create your private IDE workspace. Please try again.');
      } finally {
        setCreatingWorkspace(false);
      }
    };

    provisionIDE();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to access your private IDE workspace.</p>
          <Link 
            href="/auth/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Workspace Creation Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
        <h1 className="text-3xl font-bold mb-4">Creating Your Private IDE</h1>
        <p className="text-gray-400 mb-2">Provisioning your isolated cloud workspace...</p>
        <p className="text-gray-500 text-sm">
          Each user gets their own private environment - just like GitHub Codespaces
        </p>
        
        {ideUrl && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              Your workspace is ready! Redirecting to your private IDE...
            </p>
            <p className="text-green-400/70 text-xs mt-1">
              If redirect doesn't work, <a href={ideUrl} className="underline">click here</a>
            </p>
          </div>
        )}
        
        {creatingWorkspace && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="text-gray-500 text-xs">This may take a minute...</p>
          </div>
        )}
      </div>
    </div>
  );
}