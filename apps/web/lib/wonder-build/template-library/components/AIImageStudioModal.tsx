'use client';
import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Wand2,
  Sliders,
  Check,
  Download,
  Loader2,
  Layers,
  Upload,
  Zap,
} from 'lucide-react';
import { WonderBuildTemplate, WonderBuildElement } from '../types';

interface AIImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate?: WonderBuildTemplate;
  selectedElementNode?: WonderBuildElement | null;
  selectedElementPath?: number[];
  onUpdateElementNode?: (path: number[], updatedNode: WonderBuildElement) => void;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', icon: 'aspect-square' },
  { id: '16:9', label: '16:9 Widescreen', icon: 'aspect-video' },
  { id: '21:9', label: '21:9 Ultra Wide', icon: 'aspect-wide' },
  { id: '4:3', label: '4:3 Standard', icon: 'aspect-4-3' },
  { id: '3:2', label: '3:2 Photo', icon: 'aspect-3-2' },
  { id: '9:16', label: '9:16 Vertical', icon: 'aspect-tall' },
  { id: '3:4', label: '3:4 Portrait', icon: 'aspect-portrait' },
  { id: '2:3', label: '2:3 Mobile', icon: 'aspect-mobile' },
];

const RESOLUTIONS = [
  { id: '1K', label: '1K HD (1024px)', desc: 'Standard HD Quality' },
  { id: '2K', label: '2K QHD (2048px)', desc: 'Ultra Crisp' },
  { id: '4K', label: '4K UHD (4096px)', desc: 'Maximum Studio Print Detail' },
];

const MODELS = [
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image', desc: 'Studio Quality & Fine Detail' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image', desc: 'High Quality & Fast Generation' },
  { id: 'gemini-3.1-flash-lite-image', name: 'Gemini 3.1 Flash Lite', desc: 'Lightweight & Ultra-Fast' },
];

export const AIImageStudioModal: React.FC<AIImageStudioModalProps> = ({
  isOpen,
  onClose,
  selectedElementNode,
  selectedElementPath = [],
  onUpdateElementNode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('2K');
  const [model, setModel] = useState('gemini-3-pro-image');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(
    selectedElementNode?.type === 'image' ? selectedElementNode.src || null : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBaseImage(reader.result as string);
        setIsEditingMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a descriptive prompt for the image.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wonder-build/template-library/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          baseImage: isEditingMode ? baseImage : null,
          aspectRatio,
          imageSize,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with Gemini Image Studio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToTemplate = () => {
    if (!generatedImageUrl) return;

    if (selectedElementNode && selectedElementPath.length > 0 && onUpdateElementNode) {
      onUpdateElementNode(selectedElementPath, {
        ...selectedElementNode,
        type: 'image',
        src: generatedImageUrl,
        alt: prompt,
      });
      onClose();
    } else {
      // Copy to clipboard or trigger download
      navigator.clipboard.writeText(generatedImageUrl);
      alert('Image Data URL copied to clipboard! You can also click Download.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Gemini Pro Image Studio</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  gemini-3-pro-image
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-resolution site graphics, hero visuals, and edit elements with size & ratio controls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 space-y-5">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEditingMode(false);
                  setBaseImage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  !isEditingMode
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Text-to-Image
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMode(true)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  isEditingMode
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Image Editing & Modification
              </button>
            </div>

            {/* If Editing Mode: Upload/Current Base Image */}
            {isEditingMode && (
              <div className="p-3 bg-slate-950/70 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Source Image for Editing
                  </span>
                  <label className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBaseImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {baseImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-36 bg-black flex items-center justify-center">
                    <img src={baseImage} alt="Base Source" className="max-h-36 object-contain" />
                    <button
                      type="button"
                      onClick={() => setBaseImage(null)}
                      className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full text-slate-300 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4 border border-dashed border-slate-800 rounded-lg">
                    No source image uploaded. Upload an image or select an image element on canvas to edit it with Gemini.
                  </p>
                )}
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Image Description / Edit Instructions
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  isEditingMode
                    ? 'e.g., Add a neon holographic gradient in the background and a sleek metallic finish.'
                    : 'e.g., A futuristic 3D isometric glassmorphic SaaS dashboard hero illustration, dark twilight palette, octane render, 8k.'
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Aspect Ratio (8 Options)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      aspectRatio === ratio.id
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{ratio.id}</div>
                    <div className="text-[10px] text-slate-500 truncate">{ratio.label.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Resolution (1K, 2K, 4K) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Resolution Quality
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RESOLUTIONS.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setImageSize(res.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      imageSize === res.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{res.id}</span>
                      {imageSize === res.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Gemini Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ({m.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating with Gemini Pro Image AI...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {isEditingMode ? 'Edit Image with Gemini' : 'Generate High-Res Asset'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output Preview Canvas */}
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Rendered Asset Preview ({aspectRatio} • {imageSize})
              </span>
              {generatedImageUrl && (
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ready
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center my-4 relative rounded-xl overflow-hidden bg-slate-900/50 border border-slate-800/80 p-2">
              {isLoading ? (
                <div className="text-center space-y-3 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    Crafting image with Gemini 3 Pro...
                  </p>
                  <p className="text-[11px] text-slate-500">Applying {aspectRatio} ratio at {imageSize} resolution</p>
                </div>
              ) : generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Generated AI Asset"
                  className="max-h-[340px] w-auto object-contain rounded-lg shadow-xl"
                />
              ) : (
                <div className="text-center text-slate-600 p-8 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs font-medium">No image generated yet.</p>
                  <p className="text-[10px]">Enter a prompt and click Generate to produce HD assets.</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {generatedImageUrl && (
              <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-3">
                <a
                  href={generatedImageUrl}
                  download="gemini-ai-asset.png"
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={handleApplyToTemplate}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {selectedElementNode
                      ? 'Apply to Selected Element'
                      : 'Copy Data URL for Template'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
