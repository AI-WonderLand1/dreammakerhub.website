'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  owner: string;
  description: string;
  isPrivate: boolean;
  lastUpdated: string;
  commits: number;
  language: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  message: string;
  time: string;
  content?: string;
}

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
}

export default function WiredDashboard() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  
  // User state
  const [user] = useState({
    name: 'wonderingtribe',
    email: 'user@wonderspace.dev',
    plan: 'pro' as const,
    avatar: '/images/logo.png'
  });

  // UI state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showNewFileMenu, setShowNewFileMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('code');
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'psychic-octo-fishstick', owner: 'wonderingtribe', description: 'AI Wonderland monorepo', isPrivate: true, lastUpdated: '28 minutes ago', commits: 236, language: 'TypeScript' },
    { id: '2', name: 'my-3d-game', owner: 'wonderingtribe', description: '3D game project', isPrivate: false, lastUpdated: '2 hours ago', commits: 45, language: 'JavaScript' },
    { id: '3', name: 'website-portfolio', owner: 'wonderingtribe', description: 'Personal website', isPrivate: false, lastUpdated: '1 day ago', commits: 12, language: 'React' },
  ]);

  const [activeProject, setActiveProject] = useState<Project>(projects[0]);

  // Files state
  const [files, setFiles] = useState<FileItem[]>([
    { name: '.devcontainer', type: 'folder', message: 'ok', time: '12 hours ago' },
    { name: '.github', type: 'folder', message: "Merge branch 'Master' into master", time: '3 days ago' },
    { name: 'apps', type: 'folder', message: 'todo list', time: '42 minutes ago' },
    { name: 'deploy', type: 'folder', message: 'ok good', time: '2 days ago' },
    { name: 'Docker-image', type: 'folder', message: 'Update Docker registry submodule', time: '28 minutes ago' },
    { name: 'README.md', type: 'file', message: 'updated and moved play', time: '5 days ago', content: '# AI Wonderland\n\nAI-powered development environment.' },
  ]);

  // Billing state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', last4: '4242', brand: 'Visa' }
  ]);
  const [balance, setBalance] = useState(0);

  // Keyboard shortcut: / to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowBilling(false);
        setShowNewFileMenu(false);
        setShowBranchMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const results = files
        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(f => f.name);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, files]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu') && !target.closest('.user-button')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Actions
  const openFile = (fileName: string) => {
    router.push(`/editor?project=${activeProject.name}&file=${fileName}`);
  };

  const openFolder = (folderName: string) => {
    console.log('Opening folder:', folderName);
    // In real app: navigate into folder
  };

  const createNewProject = () => {
    const name = prompt('Project name:');
    if (name) {
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        owner: user.name,
        description: '',
        isPrivate: true,
        lastUpdated: 'Just now',
        commits: 0,
        language: 'Unknown'
      };
      setProjects([newProject, ...projects]);
      router.push(`/editor?project=${name}&new=true`);
    }
  };

  const createNewFile = () => {
    const name = prompt('File name:');
    if (name) {
      setFiles([...files, {
        name,
        type: 'file',
        message: 'Create file',
        time: 'Just now'
      }]);
      openFile(name);
    }
    setShowNewFileMenu(false);
  };

  const createNewFolder = () => {
    const name = prompt('Folder name:');
    if (name) {
      setFiles([...files, {
        name,
        type: 'folder',
        message: 'Create folder',
        time: 'Just now'
      }]);
    }
    setShowNewFileMenu(false);
  };

  const uploadFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: any) => {
      const uploaded = Array.from(e.target.files).map((file: any) => ({
        name: file.name,
        type: 'file' as const,
        message: 'Upload file',
        time: 'Just now'
      }));
      setFiles([...files, ...uploaded]);
    };
    input.click();
    setShowNewFileMenu(false);
  };

  const deleteFile = (fileName: string) => {
    if (confirm(`Delete ${fileName}?`)) {
      setFiles(files.filter(f => f.name !== fileName));
    }
  };

  const renameFile = (oldName: string) => {
    const newName = prompt('New name:', oldName);
    if (newName) {
      setFiles(files.map(f => 
        f.name === oldName ? {...f, name: newName} : f
      ));
    }
  };

  const addPaymentMethod = () => {
    const last4 = prompt('Card last 4 digits:');
    if (last4 && last4.length === 4) {
      setPaymentMethods([...paymentMethods, {
        id: Date.now().toString(),
        last4,
        brand: 'Card'
      }]);
    }
  };

  const removePaymentMethod = (id: string) => {
    if (confirm('Remove this payment method?')) {
      setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    }
  };

  const upgradePlan = (plan: string) => {
    alert(`Upgrading to ${plan} plan... (In real app: Stripe checkout)`);
  };

  const switchProject = (project: Project) => {
    setActiveProject(project);
    // In real app: load project files from Supabase
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'file') {
      openFile(file.name);
    } else {
      openFolder(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      
      {/* ===== BROWSER SHELL ===== */}
      {/* Tabs */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-2 pt-2 flex items-end gap-1">
        <div className="px-4 py-2 bg-[#0d1117] rounded-t-lg text-sm flex items-center gap-2 min-w-[180px]">
          <img src="/images/logo.png" className="w-4 h-4" alt="" />
          <span className="truncate">{activeProject.name}</span>
          <button 
            onClick={() => router.push('/dashboard')}
            className="ml-auto text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>
        <button 
          onClick={() => router.push('/ide')}
          className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg"
        >
          Wonder IDE
        </button>
        <button 
          onClick={() => router.push('/ai-playground')}
          className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg"
        >
          AI Playground
        </button>
        <button className="px-4 py-2 text-gray-500 text-sm hover:bg-[#21262d] rounded-t-lg ml-auto">
          +
        </button>
      </div>

      {/* Address Bar */}
      <div className="bg-[#161b22] px-4 py-2 flex items-center gap-3 border-b border-[#30363d]">
        <div className="flex gap-2 text-gray-500">
          <button onClick={() => router.back()} className="hover:text-white">←</button>
          <button onClick={() => router.forward()} className="hover:text-white">→</button>
          <button onClick={() => window.location.reload()} className="hover:text-white">↻</button>
        </div>
        <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-full px-4 py-1.5 text-sm text-center flex items-center justify-center gap-2">
          <span className="text-green-500">🔒</span>
          <span>wonderspace.dev/{activeProject.owner}/{activeProject.name}</span>
        </div>
        <button className="user-button w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          W
        </button>
      </div>

      {/* ===== GLOBAL HEADER ===== */}
      <header className="bg-[#161b22] px-4 py-3 border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/images/logo.png" alt="WonderSpace" className="h-8 w-auto cursor-pointer" />
            </Link>
            <div className="relative">
              <input 
                ref={searchRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type / to search"
                className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-64 focus:border-blue-500 focus:outline-none"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg w-full z-50">
                  {searchResults.map((result) => (
                    <button
                      key={result}
                      onClick={() => { openFile(result); setSearchQuery(''); }}
                      className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm"
                    >
                      📄 {result}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button 
              onClick={createNewProject}
              className="hover:text-white text-xl"
              title="Create new project"
            >
              +
            </button>
            <button className="hover:text-white relative">
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            <button className="hover:text-white">🔀</button>
            
            {/* User Menu */}
            <div className="relative user-menu">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                className="user-button w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-blue-500"
              >
                {user.name[0].toUpperCase()}
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-2 w-64 z-50">
                  <div className="px-4 py-3 border-b border-[#30363d]">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="font-semibold text-white">{user.name}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link href="/profile">
                      <span className="block px-4 py-2 hover:bg-[#21262d] text-sm cursor-pointer">👤 Your Profile</span>
                    </Link>
                    <Link href="/projects">
                      <span className="block px-4 py-2 hover:bg-[#21262d] text-sm cursor-pointer">📁 Your Projects</span>
                    </Link>
                    <span className="block px-4 py-2 hover:bg-[#21262d] text-sm cursor-pointer">🤖 Copilot</span>
                    <span className="block px-4 py-2 hover:bg-[#21262d] text-sm cursor-pointer">🎨 Appearance</span>
                  </div>
                  
                  <hr className="border-[#30363d]" />
                  
                  <div className="py-1">
                    <button 
                      onClick={() => {setShowBilling(true); setShowUserMenu(false);}}
                      className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm flex items-center justify-between"
                    >
                      <span>💳 Billing & Plans</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded capitalize">{user.plan}</span>
                    </button>
                    <Link href="/settings">
                      <span className="block px-4 py-2 hover:bg-[#21262d] text-sm cursor-pointer">⚙️ Settings</span>
                    </Link>
                  </div>
                  
                  <hr className="border-[#30363d]" />
                  
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm text-red-400">
                      🚪 Sign out
                    </button>
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
          {/* Breadcrumbs with Project Switcher */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <button 
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="text-[#58a6ff] hover:underline cursor-pointer flex items-center gap-1"
              >
                {activeProject.owner}
              </button>
            </div>
            <span className="text-gray-500">/</span>
            <div className="relative">
              <button 
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="text-[#58a6ff] font-semibold text-xl hover:underline cursor-pointer flex items-center gap-1"
              >
                {activeProject.name}
                <span className="text-sm">▼</span>
              </button>
              
              {showBranchMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg py-2 w-64 z-50">
                  <p className="px-4 py-2 text-sm text-gray-500 border-b border-[#30363d]">Your Projects</p>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => { switchProject(proj); setShowBranchMenu(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm flex items-center justify-between ${
                        proj.id === activeProject.id ? 'bg-[#21262d]' : ''
                      }`}
                    >
                      <span>{proj.name}</span>
                      {proj.id === activeProject.id && <span className="text-blue-400">✓</span>}
                    </button>
                  ))}
                  <hr className="border-[#30363d]" />
                  <button 
                    onClick={createNewProject}
                    className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm text-blue-400"
                  >
                    + Create new project
                  </button>
                </div>
              )}
            </div>
            <span className="ml-2 text-xs border border-[#30363d] rounded-full px-2 py-0.5 text-gray-500">
              {activeProject.isPrivate ? 'Private' : 'Public'}
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
                <button 
                  onClick={() => setShowBranchMenu(!showBranchMenu)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm flex items-center gap-2"
                >
                  🌿 Main <span className="text-gray-500">▼</span>
                </button>
                <span className="text-sm text-gray-500">2 branches</span>
                <span className="text-sm text-gray-500">0 tags</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Go to file"
                    className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-40 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                {/* Add File Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNewFileMenu(!showNewFileMenu)}
                    className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm"
                  >
                    + Add file ▼
                  </button>
                  
                  {showNewFileMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg py-2 w-48 z-50">
                      <button onClick={createNewFile} className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">
                        📄 Create new file
                      </button>
                      <button onClick={uploadFiles} className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">
                        ⬆️ Upload files
                      </button>
                      <hr className="border-[#30363d]" />
                      <button onClick={createNewFolder} className="w-full text-left px-4 py-2 hover:bg-[#21262d] text-sm">
                        📁 Create new folder
                      </button>
                    </div>
                  )}
                </div>
                
                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium text-white flex items-center gap-1">
                  ↓ Code
                </button>
              </div>
            </div>

            {/* Commit Ribbon */}
            <div className="bg-[#161b22] px-4 py-2 border border-[#30363d] rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">👤</span>
                <span className="font-semibold">{activeProject.owner}</span>
                <span className="text-gray-500">Update project files</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-mono">176c36e</span>
                <span>•</span>
                <span>{activeProject.commits} commits</span>
              </div>
            </div>

            {/* File List */}
            <div className="border border-t-0 border-[#30363d] rounded-b-md">
              {files.map((file, index) => (
                <div 
                  key={file.name}
                  onClick={() => handleFileClick(file)}
                  onMouseEnter={() => setHoveredFile(file.name)}
                  onMouseLeave={() => setHoveredFile(null)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition ${
                    index !== files.length - 1 ? 'border-b border-[#21262d]' : ''
                  } ${hoveredFile === file.name ? 'bg-[#161b22]' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 text-lg">{file.type === 'folder' ? '📁' : '📄'}</span>
                    <span className={`${file.type === 'file' ? 'text-[#58a6ff] hover:underline' : 'text-white'}`}>
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-1">
                    <span className="truncate hover:text-gray-300 cursor-pointer">{file.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-32 text-right text-sm text-gray-500">{file.time}</span>
                    {hoveredFile === file.name && (
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); renameFile(file.name); }}
                          className="text-gray-500 hover:text-white px-1"
                          title="Rename"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }}
                          className="text-gray-500 hover:text-red-400 px-1"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
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
                  {activeProject.name}
                </h1>
                <p className="text-gray-300">
                  {activeProject.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-4">
            {/* About */}
            <div className="border-b border-[#30363d] pb-4">
              <h3 className="font-semibold text-white mb-2">About</h3>
              <p className="text-gray-400 text-sm">{activeProject.description || 'No description, website, or topics provided.'}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-gray-400 flex items-center gap-2">
                  <span>📄</span> Readme
                </p>
                <p className="text-gray-400 flex items-center gap-2">
                  <span>📝</span> License
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="border-b border-[#30363d] pb-4">
              <div className="flex gap-4 text-sm">
                <button className="flex items-center gap-1 hover:text-white">
                  <span className="text-yellow-400">⭐</span> 0 stars
                </button>
                <button className="flex items-center gap-1 hover:text-white">
                  <span className="text-blue-400">👁️</span> 0 watching
                </button>
                <button className="flex items-center gap-1 hover:text-white">
                  <span className="text-green-400">🍴</span> 0 forks
                </button>
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
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Preview – dev
                </p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Production – live
                </p>
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
            <button className="hover:scale-110 transition">📅</button>
            <button className="hover:scale-110 transition">🌐</button>
            <button className="hover:scale-110 transition">📧</button>
            <button className="hover:scale-110 transition">📁</button>
            <button className="hover:scale-110 transition">💬</button>
            <button className="hover:scale-110 transition">🤖</button>
            <button className="hover:scale-110 transition">⚙️</button>
            <button className="hover:scale-110 transition">💻</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <button className="hover:text-white relative">
            🔔
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <span>Apr 13</span>
          <span>4:20 PM</span>
        </div>
      </div>

      {/* Billing Modal */}
      {showBilling && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBilling(false); }}
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Billing & Plans</h2>
            
            {/* Current Plan */}
            <div className="mb-6 p-4 bg-[#21262d] rounded-lg">
              <p className="text-sm text-gray-400">Current Plan</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-semibold capitalize">{user.plan}</span>
                <span className="text-yellow-400">⭐</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Payment Methods</p>
              {paymentMethods.length === 0 ? (
                <p className="text-gray-500 text-sm">No payment methods</p>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between bg-[#21262d] p-3 rounded">
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        <span>{method.brand} ****{method.last4}</span>
                      </div>
                      <button 
                        onClick={() => removePaymentMethod(method.id)}
                        className="text-red-400 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={addPaymentMethod}
                className="mt-2 text-blue-400 text-sm hover:underline"
              >
                + Add payment method
              </button>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-semibold">${balance.toFixed(2)}</p>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-400">Upgrade</p>
              {user.plan !== 'pro' && (
                <button 
                  onClick={() => upgradePlan('pro')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-left px-4 flex items-center justify-between"
                >
                  <span>Upgrade to Pro</span>
                  <span className="text-sm">$9/mo</span>
                </button>
              )}
              {user.plan !== 'enterprise' && (
                <button 
                  onClick={() => upgradePlan('enterprise')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-left px-4 flex items-center justify-between"
                >
                  <span>Upgrade to Enterprise</span>
                  <span className="text-sm">$29/mo</span>
                </button>
              )}
            </div>

            <button 
              onClick={() => setShowBilling(false)} 
              className="w-full py-2 border border-[#30363d] hover:bg-[#21262d] rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
