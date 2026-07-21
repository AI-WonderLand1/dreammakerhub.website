"use client";

import { useMemo, useState } from "react";
import { Puck, type Config } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import EgyptianVoiceModule from "@/ai-modules/EgyptianVoiceModule";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { logger } from '@/lib/logger';

type Props = {
  EgyptianAI: { title: string; defaultText: string };
  CustomButton: { label: string; mode: "decode" | "generate" };
};

const config: Config<Props> = {
  components: {
    EgyptianAI: {
      fields: {
        title: { type: "text" },
        defaultText: { type: "text" },
      },
      render: ({ title, defaultText }) => (
        <div className="rounded-lg border border-amber-900/20 bg-zinc-950 p-4">
          <h3 className="mb-2 font-bold text-amber-500">{title}</h3>
          <EgyptianVoiceModule defaultText={defaultText} />
        </div>
      ),
    },
    CustomButton: {
      fields: {
        label: { type: "text" },
        mode: {
          type: "radio",
          options: [
            { label: "Decode", value: "decode" },
            { label: "Generate", value: "generate" },
          ],
        },
      },
      render: ({ label, mode }) => (
        <div className="btn-wrapper">
          <Button variant={mode === "generate" ? "default" : "secondary"}>{label} · {mode.toUpperCase()}</Button>
        </div>
      ),
    },
  },
};

const initialData = {
  content: [
    { type: "EgyptianAI", props: { title: "Egyptian Voice", defaultText: "𓂀𓋴𓏏" } },
    { type: "CustomButton", props: { label: "Invoke", mode: "generate" } },
  ],
};

export default function AdminEditorPage() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<string>("");

  const handlePublish = async (data: unknown) => {
    setStatus("Saving to Supabase...");

    const { error } = await supabase
      .from("pages")
      .upsert(
        {
          id: "my-ai-page",
          content: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setStatus("Saved successfully.");
  };

  return (
    <div className="space-y-3 p-4">
      <Puck config={config} data={initialData} onPublish={handlePublish} />
      {status ? <p className="text-sm text-white/70">{status}</p> : null}
    </div>
  );
}
