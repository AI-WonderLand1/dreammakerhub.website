"use client";

import * as React from "react";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-violet-600 text-white",
  secondary: "bg-white/10 text-white",
  success: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-600/20 text-amber-400 border border-amber-500/30",
  destructive: "bg-red-600/20 text-red-400 border border-red-500/30",
  outline: "bg-transparent text-white border border-white/20",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
