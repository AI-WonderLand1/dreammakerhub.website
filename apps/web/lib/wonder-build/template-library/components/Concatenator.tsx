'use client';
import React, { useState } from 'react';
import { BATCH_DEFINITIONS } from '../data/batchPrompts';
import { WonderBuildTemplate } from '../types';
import { validateTemplatesJson, downloadJsonFile, copyToClipboard } from '../utils/templateUtils';
import {
  FileJson,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  PieChart,
  FileCode,
} from 'lucide-react';

interface ConcatenatorProps {
  allTemplates: WonderBuildTemplate[];
  onImportBatchTemplates: (newTemplates: WonderBuildTemplate[]) => void;
}

export const Concatenator: React.FC<ConcatenatorProps> = ({
  allTemplates,
  onImportBatchTemplates,
}) => {
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const categoriesCovered = Array.from(new Set(allTemplates.map((t) => t.category)));
  const validationResult = validateTemplatesJson(JSON.stringify(allTemplates));

  const handleCopyMasterJson = async () => {
    const success = await copyToClipboard(JSON.stringify(allTemplates, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMasterJson = () => {
    downloadJsonFile(allTemplates, 'wonderbuild_master_templates_60.json');
  };

  const handleImportPasted = () => {
    if (!pastedJson.trim()) return;
    try {
      const parsed = JSON.parse(pastedJson);
      if (Array.isArray(parsed)) {
        onImportBatchTemplates(parsed);
        setImportStatus(`Successfully merged ${parsed.length} templates into Master Array!`);
        setPastedJson('');
      } else if (parsed && typeof parsed === 'object' && parsed.id) {
        onImportBatchTemplates([parsed]);
        setImportStatus(`Merged 1 template into Master Array!`);
        setPastedJson('');
      } else {
        alert('Input must be a JSON array of template objects or a single template object.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      alert(`JSON Parse Error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 text-white">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
              Concatenation Hub
            </span>
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {allTemplates.length} / 60 Master Array Ready
            </span>
          </div>

          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
            14 Batch Master JSON Orchestrator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Concatenate output JSON arrays from all 14 independent AI Studio batch prompts into a single production-ready templates file.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyMasterJson}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Master JSON' : 'Copy Master JSON'}</span>
          </button>

          <button
            onClick={handleDownloadMasterJson}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download .json File</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Total Master Templates</div>
          <div className="text-2xl font-black text-white">{allTemplates.length}</div>
          <div className="text-[11px] text-slate-500">Target across 14 Batches = 60</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Categories Covered</div>
          <div className="text-2xl font-black text-indigo-400">{categoriesCovered.length} / 14</div>
          <div className="text-[11px] text-slate-500">SaaS, Ecommerce, Tech, etc.</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Schema Integrity</div>
          <div className="text-2xl font-black text-emerald-400">
            {validationResult.valid ? '100% Valid' : 'Errors Found'}
          </div>
          <div className="text-[11px] text-slate-500">CamelCase CSS & Unique IDs</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Total Sections & Elements</div>
          <div className="text-2xl font-black text-purple-400">
            {allTemplates.reduce((acc, t) => acc + (t.elements?.length || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500">Top-level sections in DOM trees</div>
        </div>
      </div>

      {/* 14 Batch Status Matrix */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Batch Category Coverage & Status Matrix</span>
          </h3>
          <span className="text-xs text-slate-400">14 Batches Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BATCH_DEFINITIONS.map((batch) => {
            const countForBatch = allTemplates.filter((t) => t.category === batch.category).length;
            const isComplete = countForBatch >= batch.count;

            return (
              <div
                key={batch.batchNumber}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      Batch #{batch.batchNumber}
                    </span>
                    <span className="text-xs font-bold text-white">{batch.category}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {countForBatch} of {batch.count} templates loaded
                  </div>
                </div>

                <div
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    isComplete
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isComplete ? 'Complete' : `${batch.count - countForBatch} Pending`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import / Paste AI Output Array */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Paste Batch Array Output from AI Studio</span>
          </h3>
          {importStatus && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {importStatus}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          When you generate a batch in AI Studio, copy the resulting JSON array and paste it here to merge it into the 60-template master collection.
        </p>

        <textarea
          value={pastedJson}
          onChange={(e) => setPastedJson(e.target.value)}
          placeholder='Paste JSON array here e.g. [{"id": "template_saas_minimal_landing_01", ...}]'
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={handleImportPasted}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          Merge JSON Array into Master
        </button>
      </div>
    </div>
  );
};
