"use client";

import * as React from "react";

export interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "bordered" | "glass";
}

const variantClasses = {
  default: "bg-white/5",
  bordered: "bg-transparent border border-white/20",
  glass: "bg-white/10 backdrop-blur-md border border-white/10",
};

export function Card({ title, description, children, className = "", variant = "default" }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl p-6",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {title && (
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-white/60 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={["mb-4", className].join(" ")}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={["mt-4 pt-4 border-t border-white/10", className].join(" ")}>{children}</div>;
}
