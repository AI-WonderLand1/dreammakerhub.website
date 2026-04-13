'use client';

import { useState } from 'react';

interface Repo {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  lastUpdated: string;
  language: string;
}

interface RepoContent {
  name: string;
  type: 'file' | 'folder';
  message: string;
  time: string;
}

export default function GitHubStyleDashboard() {
  const [repos, setRepos] = useState<Repo[]>([
    { 
      id: '1', 
      name: 'awesome-project', 
      description: 'My awesome project description',
      isPrivate: false,
      lastUpdated: '2 hours ago',
      language: 'TypeScript'
    },
  ]);

  const [activeRepo, setActiveRepo] = useState<Repo | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'issues' | 'pulls' | 'actions' | 'projects' | 'wiki' | 'security' | 'insights' | 'settings'>('code');
  const [repoContents, setRepoContents] = useState<RepoContent[]>([
    { name: 'src', type: 'folder', message: 'Initial commit', time: '2 days ago' },
    { name: 'README.md', type: 'file', message: 'Add documentation', time: '1 day ago' },
  ]);

  const createRepo = () => {
    const name = prompt('Repository name:');
    if (name) {
      const newRepo: Repo = {
        id: Date.now().toString(),
        name,
        description: '',
        isPrivate: false,
        lastUpdated: 'Just now',
        language: 'Unknown',
      };
      setRepos([newRepo, ...repos]);
    }
  };

  const addFile = () => {
    const name = prompt('File name:');
    if (name) {
      setRepoContents([...repoContents, {
        name,
        type: 'file',
        message: 'Create new file',
        time: 'Just now',
      }]);
    }
  };

  const addFolder = () => {
    const name = prompt('Folder name:');
    if (name) {
      setRepoContents([...repoContents, {
        name,
        type: 'folder',
        message: 'Create new folder',
        time: 'Just now',
      }]);
    }
  };

  // Repo List View
  if (!activeRepo) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
        {/* Header */}
        <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-xl">☰</button>
              <span className="text-xl">🐙</span>
            </div>
            <input 
              type="text" 
              placeholder="Type / to search"
              className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-64"
            />
            <div className="flex items-center gap-3">
              <span>+</span>
              <span>👤</span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">Top repositories</h1>
            <button 
              onClick={createRepo}
              className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              + New
            </button>
          </div>

          {/* Repo List */}
          <div className="border border-[#30363d] rounded-md overflow-hidden">
            {repos.map((repo, index) => (
              <div 
                key={repo.id}
                onClick={() => setActiveRepo(repo)}
                className={`p-4 hover:bg-[#161b22] cursor-pointer flex items-center justify-between ${
                  index !== repos.length - 1 ? 'border-b border-[#30363d]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#8b949e]">📁</span>
                  <div>
                    <span className="text-[#58a6ff] font-semibold hover:underline">{repo.name}</span>
                    {repo.isPrivate && (
                      <span className="ml-2 text-xs border border-[#30363d] rounded-full px-2 py-0.5 text-[#8b949e]">
                        Private
                      </span>
                    )}
                    <p className="text-[#8b949e] text-sm mt-0.5">{repo.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#f1e05a]"></span>
                    {repo.language}
                  </span>
                  <span>Updated {repo.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>

          {repos.length === 0 && (
            <div className="text-center py-20 text-[#8b949e]">
              <p className="text-4xl mb-4">📭</p>
              <p>No repositories yet</p>
              <button 
                onClick={createRepo}
                className="mt-4 text-[#58a6ff] hover:underline"
              >
                Create a repository
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Repo Detail View
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveRepo(null)} className="text-[#8b949e] hover:text-white">
              ←
            </button>
            <span className="text-xl">🐙</span>
            <span className="text-[#58a6ff] font-semibold">{activeRepo.name}</span>
            {activeRepo.isPrivate && (
              <span className="text-xs border border-[#30363d] rounded-full px-2 py-0.5 text-[#8b949e]">
                Private
              </span>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Type / to search"
            className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-64"
          />
          <div className="flex items-center gap-3">
            <span>+</span>
            <span>👤</span>
          </div>
        </div>
      </header>

      {/* Repo Nav */}
      <nav className="border-b border-[#30363d] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'code', label: 'Code', icon: '📁' },
              { id: 'issues', label: 'Issues', icon: '⚠️', count: 0 },
              { id: 'pulls', label: 'Pull requests', icon: '🔀', count: 0 },
              { id: 'actions', label: 'Actions', icon: '▶️' },
              { id: 'projects', label: 'Projects', icon: '📊', count: 0 },
              { id: 'wiki', label: 'Wiki', icon: '📖' },
              { id: 'security', label: 'Security', icon: '🛡️' },
              { id: 'insights', label: 'Insights', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
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
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'code' && (
          <>
            {/* Branch & Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm flex items-center gap-2">
                  🌿 Main ▼
                </button>
                <span className="text-[#8b949e] text-sm">2 branches</span>
                <span className="text-[#8b949e] text-sm">0 tags</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={addFile}
                  className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm font-medium"
                >
                  + Add file
                </button>
                <button 
                  onClick={addFolder}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm"
                >
                  + Add folder
                </button>
                <button className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm font-medium">
                  Code ▼
                </button>
              </div>
            </div>

            {/* File Browser */}
            <div className="border border-[#30363d] rounded-md overflow-hidden">
              {/* Header */}
              <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
                <span className="font-semibold">📁 {activeRepo.name}</span>
                <span className="text-[#8b949e] text-sm">Public</span>
              </div>

              {/* Files */}
              {repoContents.map((item, index) => (
                <div 
                  key={item.name}
                  className={`px-4 py-3 hover:bg-[#161b22] flex items-center justify-between ${
                    index !== repoContents.length - 1 ? 'border-b border-[#21262d]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[#8b949e]">{item.type === 'folder' ? '📁' : '📄'}</span>
                    <span className="text-[#58a6ff] hover:underline cursor-pointer">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#8b949e] flex-1">
                    <span className="truncate">{item.message}</span>
                  </div>
                  <div className="w-32 text-right text-sm text-[#8b949e]">
                    {item.time}
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
                  {activeRepo.name}
                </h1>
                <p className="text-[#8b949e]">
                  {activeRepo.description || 'No description, website, or topics provided.'}
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab !== 'code' && (
          <div className="text-center py-20 text-[#8b949e]">
            <p className="text-4xl mb-4">🚧</p>
            <p>{activeTab} section coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}
