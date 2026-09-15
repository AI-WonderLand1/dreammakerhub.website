"use client";

import { useEffect } from "react";
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
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Go Home
              </a>
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
