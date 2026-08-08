'use client';
import React, { useState, useEffect } from 'react';
import { WonderBuildTemplate, ValidationResult } from '../types';
import { validateTemplatesJson, downloadJsonFile, copyToClipboard } from '../utils/templateUtils';
import {
  Code2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface JsonEditorProps {
  currentTemplate: WonderBuildTemplate;
  onUpdateTemplateJson: (updated: WonderBuildTemplate) => void;
  allTemplates: WonderBuildTemplate[];
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  currentTemplate,
  onUpdateTemplateJson,
  allTemplates,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'single') {
      setJsonText(JSON.stringify(currentTemplate, null, 2));
    } else {
      setJsonText(JSON.stringify(allTemplates, null, 2));
    }
  }, [currentTemplate, allTemplates, mode]);

  const handleValidate = () => {
    let textToValidate = jsonText;
    if (mode === 'single') {
      textToValidate = `[${jsonText}]`;
    }
    const result = validateTemplatesJson(textToValidate);
    setValidationResult(result);
  };

  const handleApplyJson = () => {
    try {
      if (mode === 'single') {
        const parsed = JSON.parse(jsonText);
        if (parsed && parsed.id && parsed.elements) {
          onUpdateTemplateJson(parsed);
          setStatusMessage('Successfully synced single template changes!');
        } else {
          alert('Invalid single template format. Must have "id", "name", and "elements".');
        }
      } else {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdateTemplateJson(parsed[0]);
          setStatusMessage(`Loaded array with ${parsed.length} templates successfully!`);
        } else {
          alert('Must be a non-empty array of template objects.');
        }
      }
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`JSON Parse Error: ${err.message}`);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setStatusMessage('JSON formatted cleanly.');
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err: any) {
      alert(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const filename =
        mode === 'single'
          ? `${currentTemplate.id || 'template'}.json`
          : 'wonderbuild_batch_templates.json';
      downloadJsonFile(parsed, filename);
    } catch (err: any) {
      alert(`Invalid JSON cannot be downloaded: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Editor Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Current Template
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                mode === 'batch'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Batch Templates ({allTemplates.length})
            </button>
          </div>

          {statusMessage && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-medium">
              {statusMessage}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleValidate}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validate Schema</span>
          </button>

          <button
            onClick={handleFormatJson}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Format</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={handleApplyJson}
            className="flex items-center space-x-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Sync to Visual Renderer</span>
          </button>
        </div>
      </div>

      {/* Validation Banner if validated */}
      {validationResult && (
        <div
          className={`p-4 border-b text-xs ${
            validationResult.valid
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center space-x-2">
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {validationResult.valid
                  ? 'Schema Validation Passed! Conforms to WonderBuild specifications.'
                  : 'Schema Validation Errors Found:'}
              </span>
            </span>
            <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded">
              Templates Checked: {validationResult.stats.totalTemplates}
            </span>
          </div>

          {validationResult.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-0.5 font-mono text-[11px]">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mt-2 text-amber-300 text-[11px]">
              <span className="font-bold">Warnings:</span>
              <ul className="list-disc list-inside space-y-0.5 font-mono">
                {validationResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Code Area */}
      <div className="flex-1 p-4 bg-slate-950 overflow-hidden flex flex-col">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
        />
      </div>
    </div>
  );
};
