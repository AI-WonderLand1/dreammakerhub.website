'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

type BuilderContextValue = {
  mode: 'ide';
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const value = useMemo<BuilderContextValue>(() => ({ mode: 'ide' }), []);

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilderContext() {
  const value = useContext(BuilderContext);

  if (!value) {
    throw new Error('useBuilderContext must be used within BuilderProvider');
  }

  return value;
}
