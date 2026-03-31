"use client";

import { Button } from "@wonder/shadon";

export type ButtonBlockProps = {
  label: string;
  variant: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size: "sm" | "md" | "lg";
  href?: string;
};

export default function ButtonBlock({ label, variant, size, href }: ButtonBlockProps) {
  if (href) {
    return (
      <div className="p-4" data-block="button">
        <a href={href}>
          <Button variant={variant} size={size}>
            {label}
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="p-4" data-block="button">
      <Button variant={variant} size={size}>
        {label}
      </Button>
    </div>
  );
}
