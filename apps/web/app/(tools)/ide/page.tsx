"use client";

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/auth-context';

const WonderSpaceIDE = dynamic(() => import('@/components/engines/WonderSpaceIDE'), { ssr: false });

export default function IDEPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="bg-black text-green-500 p-4">Booting environment...</div>;
  if (!user) return <div className="bg-black text-red-500 p-4">Auth required.</div>;

  return (
    <div className="w-full h-screen">
      <WonderSpaceIDE />
    </div>
  );
}
