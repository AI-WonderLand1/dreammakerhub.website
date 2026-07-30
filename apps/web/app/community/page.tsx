'use client';

import { useState, useMemo } from 'react';
import {
  Users, MessageSquare, Flame, Filter, Search, PlusCircle,
  ThumbsUp, MessageCircle, Share2, Tag, User, X,
  GitFork, Play
} from 'lucide-react';

interface ForumPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge?: string;
    badgeColor?: string;
  };
  title: string;
  category: string;
  preview: string;
  tags: string[];
  upvotes: number;
  commentsCount: number;
  timeAgo: string;
  hasUpvoted?: boolean;
}

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: '1',
      author: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        badge: 'Staff',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
      },
      title: 'Announcing WonderBuild v2.4 — Multi-Agent Wonderbuild Now Live!',
      category: 'announcements',
      preview: 'We are thrilled to launch the latest update to WonderBuild featuring three new AI agents (Architect, Builder, Reviewer) that collaborate in real-time, GPU-accelerated PlayCanvas shaders, and a revamped drag-and-drop editor with 200+ blocks.',
      tags: ['WonderBuild', 'Release', 'AI Agents'],
      upvotes: 142,
      commentsCount: 38,
      timeAgo: '2 hours ago',
      hasUpvoted: false
    },
    {
      id: '2',
      author: {
        name: 'Marcus Brody',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        badge: 'Pro Maker',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
      },
      title: 'Built a 3D sci-fi scene in PlayCanvas using only AI prompts',
      category: 'showcase',
      preview: 'I used WonderBuild to describe a cyberpunk cityscape and the three agents generated a full PlayCanvas scene with physics, materials, and lighting. Check out the results and the prompts I used.',
      tags: ['PlayCanvas', '3D', 'Wonderbuild'],
      upvotes: 94,
      commentsCount: 14,
      timeAgo: '5 hours ago',
      hasUpvoted: false
    },
    {
      id: '3',
      author: {
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
      title: 'Spirit Guide keeps crashing when I ask it to generate complex Three.js code',
      category: 'q&a',
      preview: 'The AI assistant works great for simple components, but when I request advanced Three.js scenes with custom shaders, the Spirit Guide times out. Has anyone found a workaround or prompt pattern that works better?',
      tags: ['Spirit Guide', 'Three.js', 'Shaders'],
      upvotes: 21,
      commentsCount: 19,
      timeAgo: '1 day ago',
      hasUpvoted: false
    },
    {
      id: '4',
      author: {
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        badge: 'Pro Maker',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
      },
      title: 'WonderSpace IDE + WebContainer = game changer for mobile dev',
      category: 'showcase',
      preview: 'I was able to spin up a full Node.js dev environment on my iPad using WonderSpace IDE with WebContainer runtime, Monaco editor, and integrated terminal. This changes everything for on-the-go coding.',
      tags: ['WonderSpace', 'IDE', 'WebContainer', 'Mobile'],
      upvotes: 78,
      commentsCount: 8,
      timeAgo: '2 days ago',
      hasUpvoted: false
    },
    {
      id: '5',
      author: {
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        badge: 'New Maker',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
      },
      title: 'PlayCanvas scene export to glTF failing for complex meshes',
      category: 'help',
      preview: 'I created a detailed 3D scene in PlayCanvas with optimized materials and Draco compression, but when I try to export as glTF for use in another engine, it fails with a mesh index error. Anyone seen this?',
      tags: ['PlayCanvas', 'glTF', 'Export', '3D'],
      upvotes: 18,
      commentsCount: 6,
      timeAgo: '3 hours ago',
      hasUpvoted: false
    }
  ]);

  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newTags, setNewTags] = useState('');
  const [newContent, setNewContent] = useState('');

  const accentClasses = {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-500 dark:border-violet-400',
    outline: 'border-violet-200 dark:border-violet-800 focus:ring-violet-500',
    accentBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  };

  const densitySpacing = {
    gap: 'gap-6',
    postPadding: 'p-5.5',
    postGap: 'gap-4',
    headerPadding: 'py-6 px-6',
    composerPadding: 'p-6',
  };

  const handleUpvote = (postId: string) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          upvotes: post.hasUpvoted ? post.upvotes - 1 : post.upvotes + 1,
          hasUpvoted: !post.hasUpvoted
        };
      }
      return post;
    }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const tagsArray = newTags
      ? newTags.split(',').map(t => t.trim()).filter(Boolean)
      : ['General'];

    const newPost: ForumPost = {
      id: String(Date.now()),
      author: {
        name: 'You (Sandbox Maker)',
        avatar: '',
        badge: 'Sandbox Creator',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
      },
      title: newTitle,
      category: newCategory,
      preview: newContent,
      tags: tagsArray,
      upvotes: 1,
      commentsCount: 0,
      timeAgo: 'Just now',
      hasUpvoted: true
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewCategory('general');
    setNewTags('');
    setNewContent('');
    setShowComposer(false);
  };

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    return posts.filter(post => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200">
      <div className="flex flex-col min-h-screen border-x border-white/10 max-w-7xl mx-auto bg-[#050508] overflow-hidden relative">
        {/* Community Header Banner */}
        <div className={`border-b border-white/5 bg-black/40 backdrop-blur-md ${densitySpacing.headerPadding}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Users className={`w-6 h-6 ${accentClasses.text}`} />
                AI Wonderland Community
              </h2>
              <p className="text-gray-400 text-xs mt-1">Connect with builders, share WonderBuild patterns, troubleshoot 3D scenes, and showcase your AI-powered creations.</p>
            </div>

            <button
              onClick={() => setShowComposer(true)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition shadow-sm ${accentClasses.bg}`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Discussion
            </button>
          </div>

          {/* Global Hub Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5 text-center">
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-white">24,582</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">Total Members</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-xl md:text-2xl font-extrabold text-white">1,240</p>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">Online Now</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-white">453</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">New This Week</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-white">99.8%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">Help Rate</p>
            </div>
          </div>
        </div>

        {/* Workspace Area: Forums Columns */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 flex-1 p-4 md:p-6 ${densitySpacing.gap}`}>

          {/* Left Side Filters (lg:span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border border-white/10 p-4 bg-zinc-900/10">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Forums Spaces
              </h4>
              <div className="flex flex-row lg:flex-col overflow-x-auto gap-1 pb-2 lg:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Discussions' },
                  { id: 'announcements', label: '📢 Announcements' },
                  { id: 'showcase', label: '✨ Ideas Showcase' },
                  { id: 'q&a', label: '❓ Questions & Answers' },
                  { id: 'help', label: '🆘 Community Help Desk' },
                  { id: 'general', label: '💭 General Feedback' }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-left text-xs font-medium transition whitespace-nowrap lg:w-full ${selectedCategory === category.id
                        ? `${accentClasses.bgLight} ${accentClasses.text}`
                        : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
                      }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tag Cloud Widget */}
            <div className="rounded-lg border border-white/10 p-4 bg-zinc-900/10">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Popular tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['SDK', 'Webhooks', 'Express', 'Performance', 'React', 'Canvas', 'Bento', 'Tones', 'Deploy', 'Vite'].map((tag) => (
                  <span key={tag} className="px-2 py-1 text-[10px] font-medium border border-white/10 rounded bg-zinc-900 text-gray-400 cursor-pointer hover:border-gray-400 transition">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Connect Socially Card */}
            <div className="rounded-lg border border-white/10 p-4 bg-zinc-900/10">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                Connect Socially
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                <a href="https://discord.gg/ai-wonderland" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Discord</span>
                </a>
                <a href="https://x.com/aiwonderland" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-300">
                  <Share2 className="w-3.5 h-3.5 text-[#1DA1F2]" />
                  <span>Twitter / X</span>
                </a>
                <a href="https://github.com/AI-WonderLand1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-300">
                  <GitFork className="w-3.5 h-3.5 text-white" />
                  <span>GitHub</span>
                </a>
                <a href="https://youtube.com/@aiwonderland" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-300">
                  <Play className="w-3.5 h-3.5 text-[#FF0000]" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>

          {/* Center Main Forum Feed (lg:span-6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Filter topics by keyword..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-white/10 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 text-white"
              />
            </div>

            <div className="space-y-3.5">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-gray-400">
                  No conversations in this space yet. Click "Create Discussion" to start!
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className={`rounded-xl border border-white/10 bg-zinc-900/40 hover:border-gray-700 transition duration-200 flex flex-col sm:flex-row ${densitySpacing.postGap} ${densitySpacing.postPadding}`}
                  >
                    {/* Upvote column */}
                    <div className="flex sm:flex-col items-center justify-center gap-1 bg-zinc-900/30 border border-white/10 rounded-lg p-1.5 sm:w-11 sm:h-16 self-start">
                      <button
                        onClick={() => handleUpvote(post.id)}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${post.hasUpvoted ? accentClasses.text : 'text-gray-400'
                          }`}
                        aria-label="Upvote"
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.hasUpvoted ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs font-bold font-mono text-gray-300 px-1">{post.upvotes}</span>
                    </div>

                    {/* Body Column */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            referrerPolicy="no-referrer"
                            className="w-6.5 h-6.5 rounded-full object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 border border-gray-700">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="font-semibold text-white mr-1.5">{post.author.name}</span>
                          {post.author.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold mr-1.5 ${post.author.badgeColor}`}>
                              {post.author.badge}
                            </span>
                          )}
                          <span className="text-gray-400 text-[10px]">{post.timeAgo}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-sm hover:text-gray-300 cursor-pointer leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {post.preview}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-1.5">
                          {post.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800 text-gray-400 text-[9px] border border-zinc-800/80 font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {post.commentsCount} comments
                          </span>
                          <span className="cursor-pointer hover:text-white transition flex items-center gap-0.5">
                            <Share2 className="w-3 h-3" />
                            Share
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar: Active Members & Trending */}
          <div className="lg:col-span-3 space-y-4">

            {/* Active Members Card */}
            <div className="rounded-lg border border-white/10 p-4 bg-zinc-900/10">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Online Mentors
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Sarah Chen (Staff)', status: 'Reviewing SDK PRs', color: 'bg-emerald-500', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80' },
                  { name: 'Liam Sterling', status: 'Writing Canvas Guide', color: 'bg-emerald-500', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' },
                  { name: 'Niko Bellic', status: 'Idle', color: 'bg-amber-500', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80' }
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="relative">
                      <img src={member.url} alt={member.name} className="w-8 h-8 rounded-full border border-gray-800" referrerPolicy="no-referrer" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-zinc-950 ${member.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-tight">{member.name}</p>
                      <p className="text-[10px] text-gray-400">{member.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Conversations Card */}
            <div className="rounded-lg border border-white/10 p-4 bg-zinc-900/10">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Hot Conversations
              </h4>
              <div className="space-y-3 text-xs">
                {[
                  { title: 'Best strategies for canvas dynamic redraw handling on high refresh-rate monitors?', posts: '21 replies' },
                  { title: 'Has anyone integrated custom SVG filter grids with theme tokens?', posts: '15 replies' },
                  { title: 'Request: Docker templates for express proxy setup', posts: '9 replies' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1 hover:bg-zinc-900/30 p-1.5 rounded cursor-pointer transition">
                    <p className="font-semibold text-white line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{item.posts}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Composer Modal */}
        {showComposer && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/30">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <PlusCircle className="w-4.5 h-4.5 text-emerald-500" />
                  Compose New Discussion
                </span>
                <button onClick={() => setShowComposer(false)} className="p-1 rounded text-gray-400 hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className={`space-y-4 ${densitySpacing.composerPadding}`}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Discussion Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tips on managing vector scale matrices on mobile viewports"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-white/10 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Space</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-white/10 rounded-lg bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-gray-400 text-white"
                    >
                      <option value="general">💭 General Feedback</option>
                      <option value="showcase">✨ Ideas Showcase</option>
                      <option value="q&a">❓ Questions & Answers</option>
                      <option value="help">🆘 Community Help Desk</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Vector, SVG"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-white/10 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Post Body (Markdown supported)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your thoughts or question. Include as much detail as possible..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-white/10 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowComposer(false)}
                    className="px-3.5 py-2 text-xs border border-white/10 rounded-lg hover:bg-zinc-900 text-gray-400 hover:text-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition shadow-sm ${accentClasses.bg}`}
                  >
                    Publish Discussion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
