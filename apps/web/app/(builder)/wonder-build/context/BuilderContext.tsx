'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type BuilderContextValue = {
  mode: 'puck' | 'ide';
  setMode: (mode: 'puck' | 'ide') => void;
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'puck' | 'ide'>('puck');
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilderContext() {
  const value = useContext(BuilderContext);

  if (!value) {
    throw new Error('useBuilderContext must be used within BuilderProvider');
  }

  return value;
}
