import React from 'react';
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'For Designers | AI Wonderland',
  description: 'AI Wonderland solutions built for designers.',
};

export default function DesignersPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">For Designers</h1>
        <p className="text-xl text-gray-400">This page will be updated soon.</p>
      </div>
    </div>
  );
}
