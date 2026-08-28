import React, { useState, useMemo } from 'react';
import {
  BookOpen, Search, Menu, X, ArrowRight, ArrowLeft,
  Check, Copy, ChevronRight, ThumbsUp, ThumbsDown,
  Info, ExternalLink, HelpCircle, Terminal, FileText, Settings
} from 'lucide-react';

interface DocArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  content: React.ReactNode;
  readingTime: string;
}

const accentClasses = {
  text: 'text-violet-600 dark:text-violet-400',
  bg: 'bg-violet-500',
  bgLight: 'bg-violet-50 dark:bg-violet-950/40',
  border: 'border-violet-500 dark:border-violet-400',
  hoverText: 'hover:text-violet-600 dark:hover:text-violet-400',
  focusRing: 'focus:ring-violet-500',
  accentBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
};

const densitySpacing = {
  container: 'py-8 gap-8',
  sidebarItem: 'py-1.5 px-3 text-sm',
  bodySpacing: 'space-y-6 text-base',
  cardPadding: 'p-5',
  headingMargin: 'mt-8 mb-3 text-2xl',
};

const codeBlocks = {
  install: {
    npm: 'npm install @ai-wonderland/cli',
    yarn: 'yarn add @ai-wonderland/cli',
    pnpm: 'pnpm add @ai-wonderland/cli',
  },
  quickstart: `import { WonderBuild } from '@ai-wonderland/core';

// Initialize the AI builder client
const wb = new WonderBuild({
  apiKey: process.env.AI_WONDER_KEY,
  environment: 'production'
});

// Build a 3D scene from a natural language prompt
async function buildWorld() {
  const result = await wb.build({
    prompt: 'A neon cyberpunk cityscape with floating holograms',
    type: 'playcanvas-scene',
    quality: 'high'
  });
  console.log(\`Scene built: \${result.url}\`);
}

buildWorld();`,
  webhook: `// Listen for WonderBuild completion events via webhook
app.post('/api/wonder-webhook', (req, res) => {
  const event = req.body;
  if (event.type === 'build.completed') {
    const { buildId, previewUrl } = event.data;
    console.log(\`Build \${buildId} completed: \${previewUrl}\`);
  }
  res.status(200).send({ received: true });
});`
};

export default function DocsHome() {
  const [activeArticle, setActiveArticle] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'npm' | 'yarn' | 'pnpm'>('npm');

  const copyCodeToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(id);
    setTimeout(() => setCodeCopied(null), 2000);
  };

  const articles: DocArticle[] = [
    {
      id: 'install',
      category: 'Getting Started',
      title: 'Installation Guide',
      description: 'Quickly set up the AI Wonderland CLI, tools, and configure your environment.',
      readingTime: '2 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            AI Wonderland offers a suite of AI-powered tools for building websites, 3D games, and interactive experiences from natural language. Install the CLI to get started with WonderBuild, WonderPlay, and WonderSpace.
          </p>
          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Install the CLI</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Run the install command inside your project directory:
          </p>
          <div className="rounded-lg bg-gray-950 dark:bg-black border border-gray-800 overflow-hidden mt-3">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
              <span className="font-mono text-xs text-gray-400">bash</span>
              <button
                onClick={() => copyCodeToClipboard('npm install @ai-wonderland/cli', 'install-core')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {codeCopied === 'install-core' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-green-400 overflow-x-auto">
              npm install @ai-wonderland/cli
            </div>
          </div>
          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>System Requirements</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Node.js version 18.0.0 or higher.</li>
            <li>React 18+, Next.js 13+, or plain HTML5.</li>
            <li>Valid API credentials from your AI Wonderland dashboard.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'intro',
      category: 'Getting Started',
      title: 'Introduction to AI Wonderland',
      description: 'Learn how AI Wonderland helps you build websites, 3D games, and interactive experiences from natural language prompts.',
      readingTime: '3 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome to <strong>AI Wonderland</strong> — a full-stack AI-powered creative platform where you describe what you want, and our AI agents build it. From responsive websites to immersive 3D worlds, no coding is required (but full code access is always available).
          </p>

          <div className={`flex items-start gap-3 rounded-lg border border-l-4 ${accentClasses.border} ${accentClasses.bgLight} ${densitySpacing.cardPadding}`}>
            <Info className={`w-5 h-5 mt-0.5 shrink-0 ${accentClasses.text}`} />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">What Makes AI Wonderland Different?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Our multi-agent AI system (Architect, Builder, Reviewer) collaborates in real-time to generate production-ready code. Combined with a browser-based 3D engine and cloud IDE, you get everything you need in one platform.
              </p>
            </div>
          </div>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Core Products</h3>
          <p className="text-gray-600 dark:text-gray-300">
            The platform is built around three main tools:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li><strong>WonderBuild</strong>: Prompt-to-code multi-agent builder. Describe your vision, and three AI agents (Architect, Builder, Reviewer) generate the code in real-time.</li>
            <li><strong>NPC AI SIM Engine</strong>: Browser-based PlayCanvas editor for creating and editing 3D scenes with physics, materials, lighting, and AI-assisted generation.</li>
            <li><strong>WonderSpace IDE</strong>: Cloud-based IDE with Monaco Editor, WebContainer runtime, terminal emulation, and Git integration — accessible from any browser.</li>
          </ul>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Platform Support</h3>
          <p className="text-gray-600 dark:text-gray-300">
            All tools support React 18+, Next.js (App and Pages Router), SvelteKit, and pure HTML5. TypeScript definitions ship out-of-the-box.
          </p>
        </div>
      )
    },
    {
      id: 'quickstart',
      category: 'Getting Started',
      title: 'Quick Start Guide',
      description: 'Get up and running with WonderBuild and the AI Wonderland platform in under 5 minutes.',
      readingTime: '4 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            This guide will walk you through installing the CLI, setting up your credentials, and building your first 3D scene using natural language.
          </p>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>1. Install the CLI</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Add the AI Wonderland CLI to your project:
          </p>

          <div className="rounded-lg bg-gray-950 dark:bg-black border border-gray-800 overflow-hidden mt-3">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
              <div className="flex gap-2">
                {(['npm', 'yarn', 'pnpm'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      activeCodeTab === tab
                        ? 'bg-gray-800 text-white font-semibold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyCodeToClipboard(codeBlocks.install[activeCodeTab], 'install')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {codeCopied === 'install' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-green-400 overflow-x-auto whitespace-nowrap">
              <span className="text-gray-500 mr-2">$</span>
              {codeBlocks.install[activeCodeTab]}
            </div>
          </div>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>2. Initialize WonderBuild</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Create an API key in your AI Wonderland dashboard, add it to your environment, and initialize the WonderBuild client:
          </p>

          <div className="rounded-lg bg-gray-950 dark:bg-black border border-gray-800 overflow-hidden mt-3">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
              <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                <Terminal className="w-4.5 h-4.5" />
                <span>deploy.ts</span>
              </div>
              <button
                onClick={() => copyCodeToClipboard(codeBlocks.quickstart, 'quickstart')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {codeCopied === 'quickstart' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
              <code>{codeBlocks.quickstart}</code>
            </pre>
          </div>

          <div className="flex gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mt-8">
            <div className="flex gap-2 items-center">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="text-sm">
          <p className="font-semibold text-gray-900 dark:text-white">Next Step: Webhooks</p>
          <p className="text-gray-500 text-xs dark:text-gray-400">Learn how to receive build completion notifications.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveArticle('webhooks')}
              className={`p-1.5 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${accentClasses.text}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'webhooks',
      category: 'Advanced Core',
      title: 'Webhook Telemetry',
      description: 'Receive real-time build and scene completion notifications for your WonderBuild pipelines.',
      readingTime: '5 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            When WonderBuild or WonderPlay completes a generation task (scene build, code generation, asset export), we send a webhook POST to your registered endpoint so you can trigger downstream workflows.
          </p>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Endpoint Setup</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Register your endpoint in the AI Wonderland dashboard. All webhook requests include a <code>X-Wonder-Signature</code> header for origin verification.
          </p>

          <div className="rounded-lg bg-gray-950 dark:bg-black border border-gray-800 overflow-hidden mt-3">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
              <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                <Terminal className="w-4.5 h-4.5" />
                <span>server.js</span>
              </div>
              <button
                onClick={() => copyCodeToClipboard(codeBlocks.webhook, 'webhook')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {codeCopied === 'webhook' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
              <code>{codeBlocks.webhook}</code>
            </pre>
          </div>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Signature Validation</h3>
          <p className="text-gray-600 dark:text-gray-300">
            We recommend validating every webhook. The signature is a SHA-256 HMAC hash computed using your webhook secret as the key, guaranteeing tamper-proof delivery.
          </p>
        </div>
      )
    },
    {
      id: 'apiref',
      category: 'API Reference',
      title: 'WonderBuild API Reference',
      description: 'Review the parameters, options, and return types for the WonderBuild engine API.',
      readingTime: '6 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            The WonderBuild API controls AI agent orchestration, scene generation, and code compilation. All requests use strict JSON payloads.
          </p>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${densitySpacing.headingMargin}`}>Build Parameters</h3>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
                  <th className="p-3 font-semibold">Parameter</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Default</th>
                  <th className="p-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <td className="p-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">prompt</td>
                  <td className="p-3 font-mono text-xs text-rose-500">string</td>
                  <td className="p-3 font-mono text-xs text-gray-500">required</td>
                  <td className="p-3 text-xs">Natural language description of what to build.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">type</td>
                  <td className="p-3 font-mono text-xs text-rose-500">string</td>
                  <td className="p-3 font-mono text-xs text-gray-500">&quot;website&quot;</td>
                  <td className="p-3 text-xs">Valid: &quot;website&quot;, &quot;playcanvas-scene&quot;, &quot;threejs-scene&quot;, &quot;component&quot;.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">quality</td>
                  <td className="p-3 font-mono text-xs text-rose-500">string</td>
                  <td className="p-3 font-mono text-xs text-gray-500">&quot;standard&quot;</td>
                  <td className="p-3 text-xs">Quality tier: &quot;standard&quot;, &quot;high&quot;, &quot;ultra&quot;.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      category: 'Troubleshooting',
      title: 'Common Issues & Solutions',
      description: 'Solutions for common issues with WonderBuild, WonderPlay, and the Spirit Guide AI assistant.',
      readingTime: '5 min read',
      content: (
        <div className={densitySpacing.bodySpacing}>
          <p className="text-gray-600 dark:text-gray-300">
            If you encounter issues during AI builds, 3D scene rendering, or IDE session errors, refer to these common resolutions.
          </p>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Error 401: Invalid or Expired API Key
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                <strong>Cause:</strong> The API key is missing, expired, or incorrectly configured.<br />
                <strong>Fix:</strong> Verify <code>AI_WONDER_KEY</code> is set correctly in your environment variables. Generate a new key from the dashboard if needed.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Spirit Guide AI Assistant Timeout
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                <strong>Cause:</strong> Complex prompts with large 3D scene descriptions can exceed the response window.<br />
                <strong>Fix:</strong> Break your request into smaller steps. Start with core structure, then add details iteratively.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                PlayCanvas Scene Not Rendering on Mobile
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                <strong>Cause:</strong> Complex WebGL shaders or high polygon counts exceed mobile GPU limits.<br />
                <strong>Fix:</strong> Use Draco mesh compression, reduce texture resolutions, and enable mobile LOD in the PlayCanvas editor settings.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const categories = useMemo<Record<string, DocArticle[]>>(() => {
    const list: Record<string, DocArticle[]> = {};
    articles.forEach(art => {
      if (!list[art.category]) {
        list[art.category] = [];
      }
      list[art.category].push(art);
    });
    return list;
  }, [articles]);

  const currentArticle = useMemo(() => {
    return articles.find(art => art.id === activeArticle) || articles[0];
  }, [activeArticle, articles]);

  const filteredCategories = useMemo<Record<string, DocArticle[]>>(() => {
    if (!searchQuery) return categories;
    const filtered: Record<string, DocArticle[]> = {};
    (Object.entries(categories) as Array<[string, DocArticle[]]>).forEach(([catName, arts]) => {
      const matches = arts.filter(
        art => art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               art.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matches.length > 0) {
        filtered[catName] = matches;
      }
    });
    return filtered;
  }, [searchQuery, categories]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050508] text-slate-200">
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${accentClasses.bg} text-white`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-white font-sans tracking-tight">AI Wonderland Docs</span>
          <span className="text-xs px-2 py-0.5 rounded border border-white/5 bg-white/5 text-slate-400 font-mono">v2.4</span>
        </div>

        <div className="hidden md:flex items-center gap-2 max-w-xs w-full relative">
          <Search className="w-4.5 h-4.5 absolute left-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search API docs... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <kbd className="absolute right-2.5 px-1 py-0.5 text-[9px] font-mono border border-white/10 bg-white/5 text-slate-500 rounded shadow-sm">/</kbd>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded border border-white/10 hover:bg-white/5 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 relative">

        {/* Left Sidebar Menu (Desktop) */}
        <aside className="w-64 border-r border-white/5 bg-[#050508]/60 p-4 shrink-0 overflow-y-auto hidden md:block">
          <div className="space-y-6">
            {Object.keys(filteredCategories).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No matching topics found.
              </div>
            ) : (
              (Object.entries(filteredCategories) as Array<[string, DocArticle[]]>).map(([category, items]) => (
                <div key={category} className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3">
                    {category}
                  </h4>
                  <ul className="space-y-1">
                    {items.map((art) => (
                      <li key={art.id}>
                        <button
                          onClick={() => {
                            setActiveArticle(art.id);
                            setFeedbackGiven(null);
                          }}
                          className={`w-full text-left font-medium rounded-md transition-colors flex items-center justify-between ${densitySpacing.sidebarItem} ${
                            activeArticle === art.id
                              ? 'bg-violet-950/40 text-violet-400'
                              : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                          }`}
                        >
                          <span>{art.title}</span>
                          {activeArticle === art.id && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Left Sidebar Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-20 flex bg-black/40 backdrop-blur-sm md:hidden">
            <div className="w-64 max-w-[80vw] bg-zinc-950 border-r border-white/10 p-4 overflow-y-auto h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm text-white">Documentation Topics</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mb-5">
                <Search className="w-4 h-4 absolute left-2 text-gray-400 top-2" />
                <input
                  type="text"
                  placeholder="Search API..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded border border-white/10 bg-transparent text-white"
                />
              </div>

              <div className="space-y-6 flex-1">
                {(Object.entries(filteredCategories) as Array<[string, DocArticle[]]>).map(([category, items]) => (
                  <div key={category} className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-2">
                      {category}
                    </h4>
                    <ul className="space-y-0.5">
                      {items.map((art) => (
                        <li key={art.id}>
                          <button
                            onClick={() => {
                              setActiveArticle(art.id);
                              setFeedbackGiven(null);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left font-medium rounded-md py-1.5 px-2.5 text-xs flex items-center justify-between ${
                              activeArticle === art.id
                                ? 'bg-violet-950/40 text-violet-400'
                                : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                          >
                            <span>{art.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center Main Content & Right Table of Contents */}
        <main className="flex-1 flex overflow-y-auto max-h-[80vh]">

          {/* Main Article Container */}
          <article className="flex-1 px-4 md:px-8 max-w-3xl mx-auto overflow-y-auto">
            <div className={`flex flex-col ${densitySpacing.container}`}>

              {/* Category Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <span>Docs</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{currentArticle.category}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-500">{currentArticle.title}</span>
              </nav>

              {/* Title & Stats */}
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  {currentArticle.title}
                </h1>
                <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400 font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-violet-900/30 text-violet-300">{currentArticle.category}</span>
                  <span>{currentArticle.readingTime}</span>
                  <span>Updated 2 days ago</span>
                </div>
              </div>

              {/* Main Text Content */}
              <div className="border-t border-white/10 pt-6">
                {currentArticle.content}
              </div>

              {/* Helpfulness Feedback Widget */}
              <div className="border-t border-white/10 pt-8 mt-12 mb-6">
                <div className="rounded-xl border border-white/10 bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                  <div>
                    <h5 className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      Was this page helpful?
                    </h5>
                    <p className="text-xs text-gray-400 mt-0.5">Let us know what you think to improve the documentation experience.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {feedbackGiven === null ? (
                      <>
                        <button
                          onClick={() => setFeedbackGiven('yes')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 hover:border-gray-700 bg-zinc-950 text-gray-300 hover:bg-zinc-900 font-medium rounded-lg transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </button>
                        <button
                          onClick={() => setFeedbackGiven('no')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 hover:border-gray-700 bg-zinc-950 text-gray-300 hover:bg-zinc-900 font-medium rounded-lg transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>No</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-500 bg-emerald-950/20 border border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Thank you for your feedback!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Right Sidebar "On This Page" - Desktop */}
          <aside className="w-56 border-l border-white/10 p-4 shrink-0 overflow-y-auto hidden lg:block bg-zinc-900/5">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">On This Page</h5>
          <ul className="space-y-2 text-xs font-medium text-gray-500">
            <li>
              <a href="#intro" className={`block hover:text-white transition ${accentClasses.text}`}>Overview</a>
            </li>
            <li>
              <a href="#intro" className="block hover:text-white transition pl-2.5 border-l border-white/10">Core Products</a>
            </li>
            <li>
              <a href="#intro" className="block hover:text-white transition pl-2.5 border-l border-white/10">Platform Support</a>
            </li>
            <li>
              <a href="#install" className="block hover:text-white transition">Install CLI</a>
            </li>
            <li>
              <a href="#quickstart" className="block hover:text-white transition">Initialize WonderBuild</a>
            </li>
            <li>
              <a href="#webhooks" className="block hover:text-white transition">Webhooks Telemetry</a>
            </li>
          </ul>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-gray-400">
              <a href="#" className="flex items-center gap-1.5 hover:text-white">
                <span>Edit this page on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </aside>

        </main>
      </div>
    </div>
  );
}
