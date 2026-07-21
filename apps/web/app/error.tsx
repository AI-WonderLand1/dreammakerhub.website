"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Application error:", error);
    logger.info("%c Fixed: Something went wrong while loading this page. Try refreshing or go back home.", "background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px;");
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
              <p className="text-lg text-muted-foreground">
                Something went wrong.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              We encountered an unexpected error. Please try again or return to the homepage.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={reset} variant="default">
                Try Again
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Go Home</Link>
              </Button>
            </div>

            {error.digest && (
              <p className="text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
