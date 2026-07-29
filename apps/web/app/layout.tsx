import "./globals.css";
import "./(builder)/wonder-build/wonder-build.css";

import { Suspense } from "react";
import Script from "next/script";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { BuilderProvider } from "@/app/(builder)/wonder-build/context/BuilderContext";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { PlayCanvasBootstrapStartup } from "@/app/components/startup/PlayCanvasBootstrapStartup";
import { ClientAccessibilityWrapper } from "@/components/ClientAccessibilityWrapper";
import { cn } from "@/lib/utils";
import UniversalAIAssistant from "@/components/ai/UniversalAIAssistant";
import { AutoRunAI, AutoRunFromURL, AutoBuildTrigger } from "@/components/ai/AutoRunAI";
import Footer from "@/components/Footer";
import { logger } from '@/lib/logger';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <head>
        <Script src="/correctai-monitor.js" strategy="afterInteractive" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <BuilderProvider>
            <AccessibilityProvider>
              <PlayCanvasBootstrapStartup />
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
              <AutoRunAI />
              <AutoRunFromURL />
              <AutoBuildTrigger />
              <ClientAccessibilityWrapper />
              <Footer />
            </AccessibilityProvider>
          </BuilderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
