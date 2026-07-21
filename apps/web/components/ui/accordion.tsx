"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';

type AccordionContextValue = {
  value: string | null;
  setValue: (next: string | null) => void;
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  type = "single",
  collapsible = false,
  className,
}: {
  children: React.ReactNode;
  type?: "single";
  collapsible?: boolean;
  className?: string;
}) {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <AccordionContext.Provider value={{ value, setValue, collapsible: type === "single" && collapsible }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

const ItemContext = React.createContext<{ value: string } | null>(null);

export function AccordionItem({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  return (
    <ItemContext.Provider value={{ value }}>
      <div className={cn("border-b border-white/10", className)}>{children}</div>
    </ItemContext.Provider>
  );
}

export function AccordionTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(AccordionContext);
  const item = React.useContext(ItemContext);
  if (!ctx || !item) return null;

  const open = ctx.value === item.value;
  return (
    <button
      type="button"
      onClick={() => {
        if (open && ctx.collapsible) ctx.setValue(null);
        else ctx.setValue(item.value);
      }}
      className={cn("w-full py-3 text-left text-sm font-medium", className)}
    >
      {children}
    </button>
  );
}

export function AccordionContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(AccordionContext);
  const item = React.useContext(ItemContext);
  if (!ctx || !item) return null;
  const open = ctx.value === item.value;
  if (!open) return null;
  return <div className={cn("pb-3 text-sm", className)}>{children}</div>;
}
