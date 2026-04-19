'use client';

import Link from 'next/link';
import { useAuth } from '@lib/supabase/auth-context';

export default function CoderWorkspacePage() {
  const { user, subscription } = useAuth();
  const hasAccess = subscription && subscription.tier !== 'free';

  return (
    <main className="min-h-screen bg-black text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Cloud Development Workspace</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Your personal development environment in the cloud
          </p>
        </div>

        {/* Access Status */}
        <div className="bg-gray-900/50 rounded-2xl p-8 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Workspace Access</h2>
              <p className="text-gray-400">
                {hasAccess 
                  ? "You have access to cloud development workspaces" 
                  : "Available for Pro and Elite subscribers"
                }
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${hasAccess ? 'bg-green-600' : 'bg-yellow-600'}`}>
              <span className="font-semibold">
                {hasAccess ? 'Access Granted' : 'Upgrade Required'}
              </span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl mb-4">💻</div>
            <h3 className="text-xl font-bold mb-2">VS Code in Browser</h3>
            <p className="text-gray-400">Full VS Code experience with all extensions and themes</p>
          </div>
          
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Pre-configured</h3>
            <p className="text-gray-400">AI Wonderland project ready to code with all dependencies</p>
          </div>
          
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2">Development Tools</h3>
            <p className="text-gray-400">Git, terminal, debugging - everything you need</p>
          </div>
          
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-bold mb-2">Access Anywhere</h3>
            <p className="text-gray-400">Work from any device with an internet connection</p>
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center">
          {hasAccess ? (
            <div>
              <Link 
                href="https://coder.yourdomain.com" // Replace with your Coder URL
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition"
                target="_blank"
              >
                🚀 Launch Workspace
              </Link>
              <p className="text-gray-400 mt-4">Opens in a new tab - your personal development environment</p>
            </div>
          ) : (
            <div>
              <Link 
                href="/subscription"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition"
              >
                🔓 Upgrade to Pro
              </Link>
              <p className="text-gray-400 mt-4">Unlock cloud development workspaces and other premium features</p>
            </div>
          )}
        </div>

        {/* Documentation Link */}
        <div className="mt-12 text-center">
          <Link 
            href="/docs/coder-workspaces"
            className="text-gray-400 hover:text-white transition"
          >
            📚 View workspace documentation →
          </Link>
        </div>
      </div>
    </main>
  );
}