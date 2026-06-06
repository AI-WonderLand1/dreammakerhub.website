"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Shield, RefreshCw, CheckCircle, XCircle, ExternalLink, X } from "lucide-react";

interface DaemonStats {
  uptime: number;
  checksRun: number;
  repairsApplied: number;
  lastCheckTime: number | null;
  lastRepairTime: number | null;
  isRunning: boolean;
  recentFindings: number;
}

interface CheckResult {
  checkName: string;
  passed: boolean;
  findings: { id: string; severity: string; title: string }[];
}

export default function AetherGuardDialog() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<DaemonStats | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function loadData() {
    setLoading(true);
    const [statusRes, checksRes] = await Promise.all([
      fetch("/api/aetherguard/status"),
      fetch("/api/aetherguard/checks"),
    ]);
    if (statusRes.ok) setStats((await statusRes.json()).stats);
    if (checksRes.ok) {
      const data = await checksRes.json();
      setChecks(data.checks || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const totalFindings = checks.reduce((s, c) => s + c.findings.length, 0);
  const passed = checks.filter(c => c.passed).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition"
        title="AetherGuard System Status"
      >
        <Shield size={14} />
        <span className="hidden md:inline">AetherGuard</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1117] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-blue-400" />
                <span className="font-bold text-sm">AetherGuard</span>
                <span className={`w-2 h-2 rounded-full ${stats?.isRunning ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-xs text-white/50">{stats?.isRunning ? 'Running' : 'Stopped'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
                <Link
                  href="/dashboard/aetherguard"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink size={12} />
                  Full
                </Link>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 text-xs">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                  <div className="font-bold text-sm">{passed}/{checks.length}</div>
                  <div className="text-white/50 text-[10px]">Passed</div>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                  <div className={`font-bold text-sm ${totalFindings > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {totalFindings}
                  </div>
                  <div className="text-white/50 text-[10px]">Findings</div>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                  <div className="font-bold text-sm text-green-400">{stats?.repairsApplied ?? 0}</div>
                  <div className="text-white/50 text-[10px]">Repairs</div>
                </div>
              </div>

              {/* Checks */}
              <div>
                <div className="text-white/50 uppercase tracking-wider text-[10px] font-semibold mb-2">Checks</div>
                {checks.length === 0 && (
                  <div className="text-white/40 py-2">{loading ? 'Loading...' : 'No checks run yet'}</div>
                )}
                <div className="space-y-1.5">
                  {checks.map((check) => (
                    <div key={check.checkName} className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                        <span className="text-xs">{check.checkName}</span>
                      </div>
                      <span className="text-white/40 text-[10px]">
                        {check.findings.length} finding{check.findings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/10 pt-3">
                <div className="text-white/50 uppercase tracking-wider text-[10px] font-semibold mb-2">Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Run ESLint Fix', action: 'eslint-fix' },
                    { label: 'npm Audit Fix', action: 'npm-audit-fix' },
                    { label: 'Format Code', action: 'prettier' },
                  ].map(({ label, action }) => (
                    <button
                      key={action}
                      onClick={async () => {
                        await fetch("/api/aetherguard/repairs", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action }),
                        });
                        loadData();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
