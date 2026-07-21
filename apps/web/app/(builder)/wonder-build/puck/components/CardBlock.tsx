"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { logger } from '@/lib/logger';

export type CardBlockProps = {
  title: string;
  description: string;
  body: string;
  variant: "default" | "bordered" | "glass";
};

export default function CardBlock({ title, description, body, variant }: CardBlockProps) {
  return (
    <div className="p-4" data-block="card">
      <Card title={title} description={description} variant={variant}>
        {body && <p className="text-sm text-white/70">{body}</p>}
      </Card>
    </div>
  );
}
