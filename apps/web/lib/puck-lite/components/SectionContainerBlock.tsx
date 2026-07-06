"use client";

import type { ReactNode } from "react";

export type SectionContainerBlockProps = {
  title: string;
  subtitle: string;
  label: string;
  background: "none" | "dark" | "gradient" | "bordered";
  paddingY: "sm" | "md" | "lg";
  children?: ReactNode;
};

const backgrounds = {
  none: "",
  dark: "bg-white/[0.02] rounded-2xl",
  gradient: "bg-gradient-to-br from-gray-950 to-black rounded-2xl",
  bordered: "border border-white/10 rounded-2xl",
};

const paddings = {
  sm: "py-8 px-6",
  md: "py-12 px-8",
  lg: "py-20 px-10",
};

export default function SectionContainerBlock({
  title,
  subtitle,
  label,
  background = "none",
  paddingY = "md",
}: SectionContainerBlockProps) {
  return (
    <div
      className={`w-full ${backgrounds[background]} ${paddings[paddingY]}`}
      data-block="section-container"
    >
      {label && (
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">{label}</p>
      )}
      {title && (
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h2>
      )}
      {subtitle && (
        <p className="mt-2 text-sm text-white/50">{subtitle}</p>
      )}
    </div>
  );
}
