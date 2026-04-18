import "./globals.css";
import "./(builder)/wonder-build/wonder-build.css";

import { Suspense } from "react";
import { AuthProvider } from "@lib/supabase/auth-context";
import { BuilderProvider } from "@/app/(builder)/wonder-build/context/BuilderContext";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { BuilderNavDropdown } from "@/app/components/navigation/BuilderNavDropdown";
import { SpiritGuideSearch } from "@/app/components/navigation/SpiritGuideSearch";
import { PlayCanvasBootstrapStartup } from "@/app/components/startup/PlayCanvasBootstrapStartup";
import { ClientAccessibilityWrapper } from "@/components/ClientAccessibilityWrapper";
import { cn } from "@/lib/utils";
import UniversalAIAssistant from "@/components/ai/UniversalAIAssistant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <BuilderProvider>
            <AccessibilityProvider>
              <PlayCanvasBootstrapStartup />
              <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none gap-3">
                <SpiritGuideSearch />
                <div className="pointer-events-auto">
                  <BuilderNavDropdown />
                </div>
              </div>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>}>
              {children}
            </Suspense>
              <UniversalAIAssistant 
                position="bottom-right"
                theme="dark"
                enableAgents={true}
                enableRunners={true}
                defaultAgent="spirit-guide"
                dashboardUrl="/dashboard"
              />
              {/* Persistent accessibility components - wrapped in client component */}
              <ClientAccessibilityWrapper />
            </AccessibilityProvider>
          </BuilderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
