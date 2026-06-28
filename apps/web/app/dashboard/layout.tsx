import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#07090E]">
      <Sidebar />
      <main className="flex-1 ml-[18%] min-h-screen">
        <div className="p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
