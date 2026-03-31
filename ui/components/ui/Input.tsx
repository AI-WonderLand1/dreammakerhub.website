"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils"; // Assuming you have your utility for tailwind-merge

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string; // Add error state
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col space-y-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200",
            "bg-slate-950/80 text-slate-100 placeholder-slate-600",
            "border-white/10 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
