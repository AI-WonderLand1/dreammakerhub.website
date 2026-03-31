import React from "react";
import Navbar from "@components/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* This Navbar now only exists for marketing/public pages */}
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

