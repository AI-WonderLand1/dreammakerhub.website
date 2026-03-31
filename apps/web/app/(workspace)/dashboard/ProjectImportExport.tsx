"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

type ImportResult = {
  ok: boolean;
  message?: string;
  projectId?: string;
  project?: any;
};

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function ProjectImportExport({
  onImported,
}: {
  onImported?: (r: ImportResult) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  // ✅ Your backend import route requires multipart form-data with `file` (zip).
  const accept = useMemo(() => ".zip,application/zip", []);

  const pickFile = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const uploadZip = useCallback(
    async (file: File) => {
      const name = String(file.name || "").toLowerCase();

      if (!name.endsWith(".zip")) {
        setStatus("Import failed: please choose a .zip project export.");
        onImported?.({ ok: false, message: "Only .zip project exports are supported." });
        return;
      }

      setBusy(true);
      setStatus("Importing…");

      try {
        const fd = new FormData();
        fd.append("file", file, file.name);

        const res = await fetch("/api/projects/import", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Import failed (${res.status})`);
        }

        const json = (await res.json().catch(() => ({}))) as any;

        setStatus("Imported ✅");
        onImported?.({ ok: true, ...json });
      } catch (e: any) {
        console.error(e);
        const msg = e?.message ?? "Unknown error";
        setStatus(`Import failed: ${msg}`);
        onImported?.({ ok: false, message: msg });
      } finally {
        setBusy(false);
      }
    },
    [onImported]
  );

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      e.target.value = "";
      if (!f) return;
      await uploadZip(f);
    },
    [uploadZip]
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white/70">
            Import / Export
          </div>
          <div className="mt-1 text-sm text-white/50">
            Import a <span className="text-white/70 font-semibold">.zip</span> project export into your dashboard.
          </div>
        </div>

        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          className={cx(
            "h-10 px-4 rounded-xl border text-sm font-bold",
            "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 transition",
            busy && "opacity-60 cursor-not-allowed"
          )}
        >
          {busy ? "Working…" : "Import Project"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </div>

      {status ? (
        <div className="mt-3 text-xs text-white/50">
          <span className="font-semibold text-white/70">Status:</span> {status}
        </div>
      ) : null}

      <div className="mt-3 text-[11px] text-white/35">
        Supported: <span className="text-white/55">.zip</span> project exports (includes{" "}
        <span className="text-white/55">files/</span>, optional{" "}
        <span className="text-white/55">snapshots/</span>, and optional{" "}
        <span className="text-white/55">wonderbuild.json</span>).
      </div>
    </div>
  );
}
