'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  owner: string;
  description: string;
  isPrivate: boolean;
  lastUpdated: string;
  commits: number;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  message: string;
  time: string;
}

export default function WonderSpaceWorkspace() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  
  const [project] = useState<Project>({
    id: '1',
    name: 'my-awesome-project',
    owner: 'wonderingtribe',
    description: '',
    isPrivate: true,
    lastUpdated: '28 minutes ago',
    commits: 236
  });

  const [files] = useState<FileItem[]>([
    { name: 'src', type: 'folder', message: 'Initial setup', time: '12 hours ago' },
    { name: 'assets', type: 'folder', message: 'Add assets', time: '1 day ago' },
    { name: 'config', type: 'folder', message: 'Update config', time: '2 days ago' },
    { name: 'scene.json', type: 'file', message: 'Update scene', time: '3 hours ago' },
    { name: 'README.md', type: 'file', message: 'Update docs', time: '5 days ago' },
  ]);

  const [activeTab, setActiveTab] = useState('code');

  const openFile = (fileName: string) => {
    router.push(`/editor?project=${project.name}&file=${fileName}`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      
      {/* ===== BROWSER SHELL ===== */}
      {/* Browser Tabs */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-2 pt-2 flex items-end gap-1">
        <div className="px-4 py-2 bg-[#0d1117] rounded-t-lg text-sm flex items-center gap-2 min-w-[150px]">
          <span>⚡</span>
          <span className="truncate">{project.name}</span>
          <span className="ml-auto text-gray-500">×</span>
        </div>
        <div className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg cursor-pointer">
          Wonder IDE
        </div>
        <div className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg cursor-pointer">
          AI Playground
        </div>
        <div className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg cursor-pointer ml-auto">
          +
        </div>
      </div>

      {/* Address Bar */}
      <div className="bg-[#161b22] px-4 py-2 flex items-center gap-3 border-b border-[#30363d]">
        <div className="flex gap-2 text-gray-500">
          <span>←</span>
          <span>→</span>
          <span>↻</span>
        </div>
        <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-full px-4 py-1.5 text-sm text-center">
          wonderspace.dev/{project.owner}/{project.name}
        </div>
        <span>👤</span>
      </div>

      {/* ===== GLOBAL HEADER ===== */}
      <header className="bg-[#161b22] px-4 py-3 border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* YOUR LOGO */}
            <span className="text-2xl">🌟</span>
            <span className="font-bold text-white">WonderSpace</span>
            <input 
              type="text" 
              placeholder="Type / to search"
              className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-64"
            />
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="cursor-pointer hover:text-white">➕</span>
            <span className="cursor-pointer hover:text-white">🔔</span>
            <span className="cursor-pointer hover:text-white">🔀</span>
            
            {/* User Avatar */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold"
              >
                W
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-2 w-64 z-50">
                  <div className="px-4 py-3 border-b border-[#30363d]">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="font-semibold text-white">{project.owner}</p>
                  </div>
                  
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">👤 Profile</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">📁 Projects</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">🏢 Organizations</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">🎨 Appearance</button>
                  </div>
                  
                  <hr className="border-[#30363d]" />
                  
                  <div className="py-1">
                    <button 
                      onClick={() => {setShowBilling(true); setShowUserMenu(false);}}
                      className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm"
                    >
                      💳 Billing & Plans
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">⚙️ Settings</button>
                  </div>
                  
                  <hr className="border-[#30363d]" />
                  
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">🚪 Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== PROJECT HEADER ===== */}
      <div className="border-b border-[#30363d] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400">📁</span>
            <span className="text-[#58a6ff] hover:underline cursor-pointer">{project.owner}</span>
            <span className="text-gray-500">/</span>
            <span className="text-[#58a6ff] font-semibold text-xl hover:underline cursor-pointer">{project.name}</span>
            <span className="ml-2 text-xs border border-[#30363d] rounded-full px-2 py-0.5 text-gray-500">
              {project.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'code', label: 'Code', icon: '📁' },
              { id: 'issues', label: 'Issues', icon: '⚠️', count: 7 },
              { id: 'pulls', label: 'Merge Requests', icon: '🔀', count: 0 },
              { id: 'actions', label: 'Actions', icon: '▶️' },
              { id: 'projects', label: 'Projects', icon: '📊', count: 0 },
              { id: 'wiki', label: 'Wiki', icon: '📖' },
              { id: 'security', label: 'Security', icon: '🛡️' },
              { id: 'insights', label: 'Insights', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-[#f78166] text-[#c9d1d9]'
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {'count' in tab && tab.count > 0 && (
                  <span className="bg-[#30363d] rounded-full px-2 py-0.5 text-xs">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="flex gap-6">
          {/* Left: File Browser */}
          <div className="flex-1">
            
            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm flex items-center gap-2">
                  🌿 Main <span className="text-gray-500">▼</span>
                </button>
                <span className="text-sm text-gray-500">2 branches</span>
                <span className="text-sm text-gray-500">0 tags</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Go to file"
                  className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-40"
                />
                <button className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm">
                  + Add file ▼
                </button>
                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium text-white">
                  ↓ Download
                </button>
              </div>
            </div>

            {/* Commit Ribbon */}
            <div className="bg-[#161b22] px-4 py-2 border border-[#30363d] rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">👤</span>
                <span className="font-semibold">{project.owner}</span>
                <span className="text-gray-500">Update project files</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-mono">176c36e</span>
                <span>•</span>
                <span>{project.commits} commits</span>
              </div>
            </div>

            {/* File List */}
            <div className="border border-t-0 border-[#30363d] rounded-b-md">
              {files.map((file, index) => (
                <div 
                  key={file.name}
                  onClick={() => file.type === 'file' ? openFile(file.name) : null}
                  className={`px-4 py-3 hover:bg-[#161b22] flex items-center justify-between cursor-pointer ${
                    index !== files.length - 1 ? 'border-b border-[#21262d]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400">{file.type === 'folder' ? '📁' : '📄'}</span>
                    <span className={file.type === 'file' ? 'text-[#58a6ff] hover:underline' : 'text-white'}>
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-1">
                    <span className="truncate">{file.message}</span>
                  </div>
                  <div className="w-32 text-right text-sm text-gray-500">
                    {file.time}
                  </div>
                </div>
              ))}
            </div>

            {/* README */}
            <div className="mt-6 border border-[#30363d] rounded-md overflow-hidden">
              <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
                <span>📄</span>
                <span className="font-semibold">README.md</span>
              </div>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4 pb-2 border-b border-[#30363d]">
                  {project.name}
                </h1>
                <p className="text-gray-300">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-4">
            {/* About */}
            <div className="border-b border-[#30363d] pb-4">
              <h3 className="font-semibold text-white mb-2">About</h3>
              <p className="text-gray-400 text-sm">{project.description || 'No description, website, or topics provided.'}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-gray-400">📄 Readme</p>
                <p className="text-gray-400">📝 License</p>
              </div>
            </div>

            {/* Stats */}
            <div className="border-b border-[#30363d] pb-4">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span> 0 stars
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-blue-400">👁️</span> 0 watching
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-400">🍴</span> 0 forks
                </span>
              </div>
            </div>

            {/* Releases */}
            <div className="border-b border-[#30363d] pb-4">
              <h3 className="font-semibold text-white mb-2">Releases</h3>
              <p className="text-gray-400 text-sm">No releases published</p>
              <button className="text-[#58a6ff] text-sm hover:underline mt-1">
                Create a new release
              </button>
            </div>

            {/* Deployments */}
            <div className="border-b border-[#30363d] pb-4">
              <h3 className="font-semibold text-white mb-2">Deployments</h3>
              <p className="text-gray-400 text-sm">3 deployments</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-400">● Preview – dev</p>
                <p className="text-xs text-green-400">● Production – live</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== BOTTOM TASKBAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#161b22]/95 backdrop-blur border-t border-[#30363d] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Workspace 1</span>
          <div className="flex gap-3 text-xl">
            <span>📅</span>
            <span>🌐</span>
            <span>📧</span>
            <span>📁</span>
            <span>💬</span>
            <span>🤖</span>
            <span>⚙️</span>
            <span>💻</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>🔔</span>
          <span>Apr 13</span>
          <span>4:20 PM</span>
        </div>
      </div>

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">Billing & Plans</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-lg font-semibold">Pro</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Payment Methods</p>
                <div className="flex items-center justify-between">
                  <p>💳 ****4242</p>
                  <button className="text-red-400 text-sm hover:underline">Remove</button>
                </div>
                <button className="text-blue-400 text-sm hover:underline mt-2">+ Add payment method</button>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-lg">$0.00</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">
                Upgrade to Enterprise
              </button>
              <button onClick={() => setShowBilling(false)} className="w-full py-2 border border-[#30363d] hover:bg-[#21262d] rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
