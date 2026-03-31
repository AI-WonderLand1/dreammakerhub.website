"use client";

import { Alert } from "@wonder/shadon";

export type AlertBlockProps = {
  title: string;
  message: string;
  variant: "default" | "success" | "warning" | "destructive" | "info";
};

export default function AlertBlock({ title, message, variant }: AlertBlockProps) {
  return (
    <div className="p-4" data-block="alert">
      <Alert variant={variant} title={title}>
        {message}
      </Alert>
    </div>
  );
}
