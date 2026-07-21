"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Bug } from "lucide-react";
import { logger } from '@/lib/logger';

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
  findings: { id: string; severity: string; title: string; description: string }[];
  durationMs: number;
}

interface FixEntry {
  timestamp: string;
  vulnerabilityType: string;
  file: string;
  line: number;
  description: string;
  applied: boolean;
}

export default function AetherGuardPage() {
  const [daemonStats, setDaemonStats] = useState<DaemonStats | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [fixLog, setFixLog] = useState<FixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [statusRes, checksRes, logRes] = await Promise.all([
      fetch("/api/aetherguard/status"),
      fetch("/api/aetherguard/checks"),
      fetch("/api/aetherguard/log"),
    ]);
    if (statusRes.ok) setDaemonStats((await statusRes.json()).stats);
    if (checksRes.ok) {
      const data = await checksRes.json();
      setChecks(data.checks || []);
    }
    if (logRes.ok) {
      const data = await logRes.json();
      setFixLog(data.entries || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function runChecksNow() {
    setRunning(true);
    const res = await fetch("/api/aetherguard/checks");
    if (res.ok) {
      const data = await res.json();
      setChecks(data.checks || []);
    }
    await loadAll();
    setRunning(false);
  }

  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            AetherGuard
          </h1>
          <p className="text-sm text-white/50">Autonomous system maintenance daemon</p>
        </div>
        <button
          onClick={runChecksNow}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw size={14} className={running ? "animate-spin" : ""} />
          {running ? "Running..." : "Run Checks Now"}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <Shield size={14} />
            Daemon Status
          </div>
          <div className={`text-lg font-bold ${daemonStats?.isRunning ? 'text-green-400' : 'text-yellow-400'}`}>
            {daemonStats?.isRunning ? 'Running' : 'Stopped'}
          </div>
          {daemonStats && (
            <div className="text-xs text-white/40 mt-1">
              Uptime: {Math.floor(daemonStats.uptime / 1000)}s
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <CheckCircle size={14} />
            Checks
          </div>
          <div className="text-lg font-bold">
            {passed}/{total}
          </div>
          <div className="text-xs text-white/40 mt-1">checks passed</div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <AlertTriangle size={14} />
            Findings
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {checks.reduce((s, c) => s + c.findings.length, 0)}
          </div>
          <div className="text-xs text-white/40 mt-1">total issues found</div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <Bug size={14} />
            Repairs
          </div>
          <div className="text-lg font-bold text-green-400">
            {daemonStats?.repairsApplied ?? 0}
          </div>
          <div className="text-xs text-white/40 mt-1">auto-fixes applied</div>
        </div>
      </div>

      {/* Check results */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Check Results</h2>
        {loading && checks.length === 0 ? (
          <div className="text-sm text-white/50">Loading...</div>
        ) : (
          <div className="space-y-2">
            {checks.map((check) => (
              <div key={check.checkName} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    <span className="font-medium">{check.checkName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock size={12} />
                    {check.durationMs}ms
                  </div>
                </div>
                {check.findings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {check.findings.slice(0, 5).map((f) => (
                      <div key={f.id} className="text-xs flex items-start gap-2 text-white/60">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          f.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`} />
                        <span>{f.title}</span>
                      </div>
                    ))}
                    {check.findings.length > 5 && (
                      <div className="text-xs text-white/40 pl-3">
                        +{check.findings.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fix log */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Auto-Fix Log</h2>
        {fixLog.length === 0 ? (
          <div className="text-sm text-white/50">No auto-fixes applied yet</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {fixLog.slice().reverse().map((entry, i) => (
              <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white/80">{entry.vulnerabilityType}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    entry.applied ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {entry.applied ? 'Applied' : 'Failed'}
                  </span>
                </div>
                <div className="text-white/40">{entry.file}:{entry.line}</div>
                <div className="text-white/50 mt-0.5">{entry.description}</div>
                <div className="text-white/30 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
