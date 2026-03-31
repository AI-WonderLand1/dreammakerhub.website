"use client";

import React from 'react';
import { useAuth } from '@/lib/supabase/auth-context';

/**
 * Rick's Note: Listen, Morty, this is the bridge to the Coder-based sandbox.
 * It uses the tenant-ide-proxy to avoid CORS nightmares and keep things secure.
 */
export default function IDEPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="bg-black text-green-500 p-4">Booting environment...</div>;
  if (!user) return <div className="bg-black text-red-500 p-4">Auth required. You think we give free compute to anyone?</div>;

  // The proxy route pipes traffic to the user's specific code-server instance
  // This mimics the 'Codespaces' experience without the Microsoft bloat.
  const workspaceUrl = `/api/tenant-ide-proxy/`;

  return (
    <div className="flex flex-col w-full h-screen bg-[#1e1e1e]">
      <div className="bg-[#2d2d2d] text-xs text-gray-400 px-4 py-1 flex justify-between items-center border-b border-black">
        <span>Wonderspace IDE - Logged in as {user.email}</span>
        <span className="text-orange-500 font-bold underline cursor-pointer">Emergency Shutdown</span>
      </div>
      <iframe 
        src={workspaceUrl}
        className="w-full flex-grow border-none shadow-2xl"
        title="Cloud IDE Environment"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}