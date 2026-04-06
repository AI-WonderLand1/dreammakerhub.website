"use client";

import * as React from "react";

type AlertVariant = "default" | "success" | "warning" | "destructive" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  default: "bg-white/5 border-white/10 text-white",
  info: "bg-blue-600/10 border-blue-500/30 text-blue-300",
  success: "bg-emerald-600/10 border-emerald-500/30 text-emerald-300",
  warning: "bg-amber-600/10 border-amber-500/30 text-amber-300",
  destructive: "bg-red-600/10 border-red-500/30 text-red-300",
};

const icons: Record<AlertVariant, string> = {
  default: "ℹ",
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  destructive: "✕",
};

export function Alert({ variant = "default", title, children, className = "" }: AlertProps) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        variantClasses[variant],
        className,
      ].join(" ")}
      role="alert"
    >
      <div className="flex gap-3">
        <span className="shrink-0 text-sm leading-5">{icons[variant]}</span>
        <div className="flex-1">
          {title && <p className="font-medium text-sm mb-1">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
