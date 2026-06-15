'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard/projects';

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data?.user) {
          window.location.href = redirectTo;
        }
      })
      .catch(() => {});
  }, [redirectTo]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <span className="text-white text-2xl font-bold">AI Wonderland</span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-gray-400 mb-6">Sign in with your Replit account to continue building</p>

          <script
            dangerouslySetInnerHTML={{
              __html: `window.__replitAuthRedirect = ${JSON.stringify(redirectTo)};`,
            }}
          />
          <script
            src="https://replit.com/public/js/repl-auth-v2.js"
            data-authed={`window.location.href = window.__replitAuthRedirect || '/dashboard/projects'`}
          />

          <a
            href="/api/auth/replit-login"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition mt-4"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
