import "./globals.css";
import "./(builder)/wonder-build/wonder-build.css";

import type { Metadata } from "next";
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
import RouteAwareFooter from "@/components/RouteAwareFooter";

const siteUrl = "https://dreammakerhub.website";
const siteDescription =
  "DreamMakerHub by AI WONDERLAND INNOVATION is an independent platform for building websites, apps, AI workflows, cloud workspaces, and interactive 3D experiences.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "DreamMakerHub",
  title: {
    default: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
    template: "%s | DreamMakerHub",
  },
  description: siteDescription,
  authors: [{ name: "AI WONDERLAND INNOVATION", url: `${siteUrl}/about` }],
  creator: "AI WONDERLAND INNOVATION",
  publisher: "AI WONDERLAND INNOVATION",
  category: "technology",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "DreamMakerHub",
    title: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
    description: siteDescription,
    images: ["/images/ai-wonderland-homepage.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamMakerHub | AI-Powered Web, App & 3D Creation",
    description: siteDescription,
    images: ["/images/ai-wonderland-homepage.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "AI WONDERLAND INNOVATION",
  alternateName: "AI Wonderland",
  url: siteUrl,
  sameAs: [
    "https://github.com/AI-WonderLand1",
    "https://ko-fi.com/wonderingtribe",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@dreammakerhub.website",
      url: `${siteUrl}/contact`,
    },
    {
      "@type": "ContactPoint",
      contactType: "business inquiries",
      email: "contact@dreammakerhub.website",
      url: `${siteUrl}/contact`,
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "DreamMakerHub",
  alternateName: "AI Wonderland",
  url: siteUrl,
  description: siteDescription,
  publisher: { "@id": `${siteUrl}/#organization` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
              <RouteAwareFooter />
            </AccessibilityProvider>
          </BuilderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
