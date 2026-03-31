"use client";

import { Badge } from "@wonder/shadon";

export type BadgeBlockProps = {
  label: string;
  variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
};

export default function BadgeBlock({ label, variant }: BadgeBlockProps) {
  return (
    <div className="p-4" data-block="badge">
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}
