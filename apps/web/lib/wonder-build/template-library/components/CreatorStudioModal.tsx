'use client';
import React, { useState } from 'react';
import { WonderBuildTemplate, WonderBuildElement } from '../types';
import { BATCH_DEFINITIONS } from '../data/batchPrompts';
import {
  Store,
  X,
  DollarSign,
  PlusCircle,
  Tag,
  User,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CreatorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentActiveTemplate: WonderBuildTemplate;
  onPublishTemplate: (newTemplate: WonderBuildTemplate) => void;
  creatorTemplates: WonderBuildTemplate[];
}

export const CreatorStudioModal: React.FC<CreatorStudioModalProps> = ({
  isOpen,
  onClose,
  currentActiveTemplate,
  onPublishTemplate,
  creatorTemplates,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'dashboard'>('submit');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(BATCH_DEFINITIONS[0].category);
  const [variant, setVariant] = useState('Custom Pro Variant');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(29);
  const [authorName, setAuthorName] = useState('Creative Studio');
  const [authorBio, setAuthorBio] = useState('Full-stack UI/UX designer & WonderBuild creator.');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [useCurrentActiveElements, setUseCurrentActiveElements] = useState(true);

  const [publishedSuccess, setPublishedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const thumbnail = customThumbnail.trim();

    const elementsToUse: WonderBuildElement[] = useCurrentActiveElements
      ? currentActiveTemplate.elements
      : [
          {
            type: 'section',
            styles: { padding: '60px 24px', backgroundColor: '#0f172a', color: '#ffffff' },
            children: [
              {
                type: 'heading',
                content: name,
                styles: { fontSize: '36px', fontWeight: '800', textAlign: 'center' },
              },
              {
                type: 'text',
                content: description || 'Premium creator layout built for high conversions.',
                styles: { fontSize: '16px', color: '#94a3b8', textAlign: 'center', margin: '16px 0' },
              },
              {
                type: 'button',
                content: 'Get Started Now',
                styles: {
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  margin: '20px auto',
                  display: 'inline-block',
                },
              },
            ],
          },
        ];

    const newCreatorTemplate: WonderBuildTemplate = {
      id: `creator-tpl-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Exclusive template by ${authorName.trim()}`,
      category: category,
      variant: variant.trim() || 'Creator Pro',
      thumbnail: thumbnail,
      elements: elementsToUse,
      price: Number(price) || 0,
      author: {
        name: authorName.trim() || 'Verified Creator',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          authorName
        )}`,
        bio: authorBio,
        salesCount: 0,
      },
      isCreatorTemplate: true,
      tags: ['Creator Marketplace', 'Verified Pro', category],
    };

    onPublishTemplate(newCreatorTemplate);
    setPublishedSuccess(true);

    setTimeout(() => {
      setPublishedSuccess(false);
      setActiveTab('dashboard');
    }, 1500);
  };

  // Calculate Creator Dashboard Stats
  const totalPublished = creatorTemplates.length;
  const totalSalesCount = creatorTemplates.reduce(
    (acc, t) => acc + (t.author?.salesCount || 12),
    0
  );
  const totalRevenue = creatorTemplates.reduce(
    (acc, t) => acc + (t.price || 0) * (t.author?.salesCount || 12),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Creator Studio & Marketplace</h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Sell & Share
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monetize your custom layout templates or share free open-source designs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-5 py-2.5 flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Publish New Template</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Creator Dashboard</span>
            {creatorTemplates.length > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] rounded-full font-black">
                {creatorTemplates.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'submit' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {publishedSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center space-x-3 text-emerald-400 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Template successfully published to the marketplace library!</span>
                </div>
              )}

              {/* Template Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                    <span>Template Title</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ultra SaaS Launch Pro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category Suite</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {BATCH_DEFINITIONS.map((b) => (
                      <option key={b.batchNumber} value={b.category}>
                        Batch #{b.batchNumber} - {b.category}
                      </option>
                    ))}
                    <option value="Custom Marketplace">Custom Marketplace</option>
                  </select>
                </div>
              </div>

              {/* Variant & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Variant Style Tag</label>
                  <input
                    type="text"
                    placeholder="e.g., Dark Glassmorphic Hero"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Set Selling Price (USD $)</span>
                    <span className="text-[10px] text-amber-400 font-normal">0 = Free Download</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="29"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe what makes this template unique, conversion tips, layout features..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Creator Profile */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                  <User className="w-4 h-4" />
                  <span>Creator Brand Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Creator Handle</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Bio / Tagline</label>
                    <input
                      type="text"
                      value={authorBio}
                      onChange={(e) => setAuthorBio(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Layout Elements Source Option */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCurrentActiveElements}
                    onChange={(e) => setUseCurrentActiveElements(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-300">
                    Use layout elements currently loaded in Visual Builder ({currentActiveTemplate.name})
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  This packages your custom designed tree layout so buyers get the exact visual layout structure.
                </p>
              </div>

              {/* Cover Image URL option */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Custom Cover Image URL (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-generated if empty</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customThumbnail}
                  onChange={(e) => setCustomThumbnail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 text-xs cursor-pointer transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Publish to WonderBuild Marketplace (${price > 0 ? `${price} USD` : 'Free'})</span>
              </button>
            </form>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Creator Analytics Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Templates Listed
                  </span>
                  <div className="text-xl font-black text-white">{totalPublished}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Downloads
                  </span>
                  <div className="text-xl font-black text-indigo-400">{totalSalesCount}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Estimated Revenue
                  </span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    ${totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Creator Templates List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Published Marketplace Items ({creatorTemplates.length})</span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    Verified Creator Status
                  </span>
                </h4>

                {creatorTemplates.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-8 text-center space-y-3">
                    <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      You haven&apos;t published any templates yet. Click &quot;Publish New Template&quot; to list your first design!
                    </p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Create First Listing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {creatorTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={tpl.thumbnail}
                            alt={tpl.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="text-xs font-bold text-white">{tpl.name}</h5>
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold font-mono">
                                {tpl.price ? `$${tpl.price}` : 'Free'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {tpl.category} • {tpl.variant || 'Standard'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {tpl.author?.salesCount || 12} Sales
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
