'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const AUTO_RUN_KEY = 'ai-wonderland:auto-run-seen';
const WELCOME_DELAY = 2000;

export function AutoRunAI() {
  const pathname = usePathname();
  const [hasRun, setHasRun] = useState(false);

  const triggerAIAssistant = useCallback(() => {
    const assistantButton = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLElement;
    if (assistantButton) {
      assistantButton.click();
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.placeholder = 'Welcome to AI Wonderland! Ask me anything...';
        }
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (hasRun) return;
    if (typeof window === 'undefined') return;

    // Check if already seen
    const seen = localStorage.getItem(AUTO_RUN_KEY);
    if (seen) return;

    // Don't auto-run on auth pages
    if (pathname?.includes('/auth') || pathname?.includes('/login')) return;

    // Auto-run after welcome delay
    const timer = setTimeout(() => {
      triggerAIAssistant();
      localStorage.setItem(AUTO_RUN_KEY, 'true');
      setHasRun(true);
    }, WELCOME_DELAY);

    return () => clearTimeout(timer);
  }, [pathname, hasRun, triggerAIAssistant]);

  return null;
}

export function AutoRunFromURL() {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (hasTriggered) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const autoPrompt = params.get('auto');
    const agentType = params.get('agent') || 'spirit-guide';

    if (!autoPrompt) return;

    const timer = setTimeout(() => {
      const assistantButton = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLElement;
      if (assistantButton) {
        assistantButton.click();
        setTimeout(() => {
          const textarea = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
          const sendButton = document.querySelector('button[class*="bg-purple-600"]:not([aria-label])') as HTMLElement;
          if (textarea) {
            textarea.value = autoPrompt;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
              if (sendButton) sendButton.click();
            }, 500);
          }
        }, 400);
      }
      setHasTriggered(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasTriggered]);

  return null;
}

export function AutoBuildTrigger() {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (hasTriggered) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const buildPrompt = params.get('build');
    const buildType = (params.get('type') as any) || 'website';

    if (!buildPrompt) return;

    const timer = setTimeout(() => {
      // Try to find the WonderBuild textarea
      const textarea = document.querySelector('textarea[placeholder*="Describe"]') as HTMLTextAreaElement;
      const buildButton = document.querySelector('button[class*="Build with AI"]') as HTMLElement;

      if (textarea && buildButton) {
        textarea.value = buildPrompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => buildButton.click(), 300);
      } else {
        // Fallback: open AI assistant with the build prompt
        const assistantButton = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLElement;
        if (assistantButton) {
          assistantButton.click();
          setTimeout(() => {
            const aiTextarea = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
            const sendBtn = document.querySelector('button[class*="bg-purple-600"]:not([aria-label])') as HTMLElement;
            if (aiTextarea) {
              aiTextarea.value = `Build me a ${buildType}: ${buildPrompt}`;
              aiTextarea.dispatchEvent(new Event('input', { bubbles: true }));
              setTimeout(() => {
                if (sendBtn) sendBtn.click();
              }, 500);
            }
          }, 400);
        }
      }
      setHasTriggered(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasTriggered]);

  return null;
}
