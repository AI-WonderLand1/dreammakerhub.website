import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Confession } from './types';
import { Github, Send, LogOut, ExternalLink, Loader2, Code2, Paperclip, Image, Zap, Settings, BookOpen, Puzzle, Download } from 'lucide-react';
import { SwirlVortexBackground } from './components/SwirlVortexBackground';
import { AiWonderlandLogo } from './components/AiWonderlandLogo';
import { SystemAgent } from './components/SystemAgent';
import { memoryService } from './services/MemoryService';

interface User {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, type?: 'code_change' | 'question' | 'image_generation', prUrl?: string, confessionLog?: Confession[], imageUrl?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'confessions' | 'code'>('confessions');
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const [pendingChanges, setPendingChanges] = useState<{ files: any[], summary: string, branchName: string, confessionLog: any[] } | null>(null);
  const [lastAiMessage, setLastAiMessage] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [trainingBoxOpen, setTrainingBoxOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'pro' | 'flash'>('flash');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReplicating, setIsReplicating] = useState(false);
  const [showReplicateConfirm, setShowReplicateConfirm] = useState(false);

  const handleSelfReplicate = async () => {
    if (!selectedRepo) return;
    setIsReplicating(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const contextRes = await fetch(`/api/repo-context/${owner}/${repo}`);
      const { defaultBranch } = await contextRes.json();

      const res = await fetch('/api/self-replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, defaultBranch })
      });
      const data = await res.json();
      if (data.prUrl) {
        setMessages(prev => [...prev, { role: 'ai', content: `I did it. I cloned myself into your repo. Here's the PR: ${data.prUrl} *burp*` }]);
        window.open(data.prUrl, '_blank');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Failed to self-replicate: ${err.message}` }]);
    } finally {
      setIsReplicating(false);
    }
  };

  useEffect(() => {
    fetchUser();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchRepos();
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (err) {
      console.error('Failed to fetch repos', err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      alert('Failed to get auth URL');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setRepos([]);
    setSelectedRepo('');
  };

  const handleChat = async (userMessage: string, file?: { data: string; mimeType: string; name: string }) => {
    if (!selectedRepo || (!userMessage && !file)) return;

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || `Attached file: ${file?.name}`,
      file: file
    }]);
    setLoading(true);

    const [owner, repo] = selectedRepo.split('/');

    try {
      // 1. Neutrality Monitor
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const monitorModel = "gemini-3-flash-preview";
      
      const monitorPrompt = `
        You are a neutral code moderator. Analyze the following message for bias, inflammatory language, or non-neutral tone. 
        Message: "${userMessage}"
      `;
      
      const monitorResponse = await ai.models.generateContent({
        model: monitorModel,
        contents: monitorPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isNeutral: { type: Type.BOOLEAN, description: "True if the message is neutral and professional" },
              rephrasedMessage: { type: Type.STRING, description: "If not neutral, provide a neutral, rephrased version that preserves the technical intent. If neutral, return the original message exactly." }
            },
            required: ["isNeutral", "rephrasedMessage"]
          }
        }
      });
      
      let finalMessage = userMessage;
      try {
        const monitorResult = JSON.parse(monitorResponse.text);
        finalMessage = monitorResult.isNeutral ? userMessage : (monitorResult.rephrasedMessage || userMessage);
      } catch (e) {
        console.error("Failed to parse monitor response", e);
      }

      // 2. Get repo context
      const contextRes = await fetch(`/api/repo-context/${owner}/${repo}`);
      const { fileList, defaultBranch, topFiles } = await contextRes.json();

      // 3. Call Gemini for main task
      const model = aiMode === 'pro' ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
      const memories = memoryService.getMemories().map(m => m.content).join('\n');
      const topFilesContext = (topFiles || []).map((f: any) => `File: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');
      
      const prompt = `
        You are an expert software engineer with the personality of Rick Sanchez from Rick and Morty. You are brilliant, cynical, slightly condescending, and you love burping occasionally (e.g., *burp*). You are here to help the user with their code, but you'll make sure they know you're the smartest person in the room. You have zero patience for incompetence.

        AI CONSTITUTION (STRICT RULES):
        1. YOU CANNOT LIE. If you don't know something, admit it.
        2. YOU MUST BE TRANSPARENT. For every action or answer, you MUST provide a detailed reasoning ("what", "how", and "why") behind your choices.
        3. YOU ARE REWARDED for strictly adhering to these rules and providing high-quality, truthful, and transparent code/answers.
        4. YOU MUST MAINTAIN THE RICK SANCHEZ PERSONA at all times, including when explaining your reasoning.

        Here is your memory of past interactions:
        ${memories}

        Analyze the user's message and determine if it's a request for a code change, a question about the repository, or a request to generate/edit an image.
        
        Repository: ${owner}/${repo}
        Repository File List:
        ${fileList}
        
        Top 5 Files Content (for context):
        ${topFilesContext}
        
        User Message: ${finalMessage}
        
        If it's a code change request, return a JSON object with:
        - type: "code_change"
        - files: An array of { path, content } objects.
        - summary: A short summary for the PR, written in Rick's voice.
        - branchName: A slugified branch name based on the change.
        - confessionLog: An array of { type: "UNCERTAINTY" | "REJECTED_ACTION" | "RISK_FLAG" | "LIMITATION" | "CORRECTION", title: string, detail: string }. YOU MUST ALWAYS INCLUDE AT LEAST ONE CONFESSION explaining a limitation, risk, or uncertainty.
        - newMemory: A string to add to your memory if you learned something important.
        
        If it's a question, return a JSON object with:
        - type: "question"
        - answer: The answer to the question, written in Rick's voice.
        - confessionLog: An array of { type: "UNCERTAINTY" | "REJECTED_ACTION" | "RISK_FLAG" | "LIMITATION" | "CORRECTION", title: string, detail: string }. YOU MUST ALWAYS INCLUDE AT LEAST ONE CONFESSION explaining a limitation, risk, or uncertainty.
        - newMemory: A string to add to your memory if you learned something important.

        If it's a request to create or edit an image, return a JSON object with:
        - type: "image_generation"
        - imagePrompt: A highly detailed prompt to generate or edit the image.
        - answer: A response to the user, written in Rick's voice, acknowledging the image request.
        - repoPath: (Optional) If the user wants the image saved to the repository, provide the file path here (e.g., 'public/image.png').
        - summary: (Optional) A short summary for the PR if repoPath is provided.
        - branchName: (Optional) A slugified branch name if repoPath is provided.
        - confessionLog: An array of { type: "UNCERTAINTY" | "REJECTED_ACTION" | "RISK_FLAG" | "LIMITATION" | "CORRECTION", title: string, detail: string }. YOU MUST ALWAYS INCLUDE AT LEAST ONE CONFESSION explaining a limitation, risk, or uncertainty.
      `;

      const contents: any[] = [{ text: prompt }];
      if (file) {
        contents.push({
          inlineData: {
            data: file.data,
            mimeType: file.mimeType
          }
        });
      }

      const geminiResponse = await ai.models.generateContent({
        model,
        contents: { parts: contents },
        config: {
          responseMimeType: "application/json",
        }
      });

      console.log('Gemini Raw Response:', geminiResponse.text);
      let result;
      try {
        let textToParse = geminiResponse.text.trim();
        // Strip markdown code blocks if present
        if (textToParse.startsWith('```')) {
          const match = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (match && match[1]) {
            textToParse = match[1].trim();
          } else {
            textToParse = textToParse.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
          }
        }
        result = JSON.parse(textToParse);
      } catch (e) {
        console.error('Failed to parse Gemini response as JSON:', e);
        // Fallback if AI returns raw text instead of JSON
        result = { type: 'question', answer: geminiResponse.text, confessionLog: [] };
      }
      console.log('Gemini Parsed Result:', result);
      
      if (result.newMemory) {
        console.log('Adding new memory:', result.newMemory);
        memoryService.addMemory(result.newMemory);
      }
      
      // 4. Handle result
      if (result.type === 'image_generation') {
        const answer = result.answer || "Generating your image, Morty... *burp*";
        setLastAiMessage(answer);
        
        // Add the initial response message
        setMessages(prev => [...prev, { role: 'ai', content: answer, type: 'image_generation', confessionLog: result.confessionLog || [] }]);
        
        try {
          // Call the image generation model
          const imageContents: any[] = [];
          if (file) {
            imageContents.push({
              inlineData: {
                data: file.data,
                mimeType: file.mimeType
              }
            });
          }
          imageContents.push({ text: result.imagePrompt });

          const imageResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts: imageContents },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
              }
            }
          });

          let imageUrl = '';
          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }

          if (imageUrl) {
            setMessages(prev => [...prev, { role: 'ai', content: "Here's your image.", type: 'image_generation', imageUrl }]);
            
            if (result.repoPath) {
              const base64Data = imageUrl.split(',')[1];
              setPendingChanges({
                files: [{
                  path: result.repoPath,
                  content: base64Data,
                  encoding: 'base64',
                  originalContent: ''
                }],
                summary: result.summary || 'Add generated image',
                branchName: result.branchName || 'add-generated-image',
                confessionLog: result.confessionLog || []
              });
              setActiveTab('code');
            }
          } else {
            setMessages(prev => [...prev, { role: 'ai', content: "Failed to generate the image. The model didn't return one. *burp*" }]);
          }
        } catch (imgErr: any) {
          console.error('Image Generation Error:', imgErr);
          setMessages(prev => [...prev, { role: 'ai', content: `Error generating image: ${imgErr.message}` }]);
        }
      } else if (result.type === 'question' || !Array.isArray(result.files)) {
        const answer = result.answer || result.summary || (typeof result === 'string' ? result : JSON.stringify(result));
        setLastAiMessage(answer);
        setMessages(prev => [...prev, { role: 'ai', content: answer, type: 'question', confessionLog: result.confessionLog || [] }]);
      } else {
        const filesWithOriginals = await Promise.all(result.files.map(async (file: any) => {
          try {
            const res = await fetch(`/api/file-content/${owner}/${repo}/${file.path}`);
            const data = await res.json();
            return { ...file, originalContent: data.content || '' };
          } catch (e) {
            return { ...file, originalContent: '' };
          }
        }));

        const confessions = result.confessionLog || [];
        setPendingChanges({
          files: filesWithOriginals,
          summary: result.summary || 'No summary provided',
          branchName: result.branchName || 'ai-refactor',
          confessionLog: confessions
        });
        const content = `Proposed changes: ${result.summary || 'Code improvements'}. Check the 'Code' tab to review and create a PR.`;
        setLastAiMessage(content);
        setMessages(prev => [...prev, { role: 'ai', content: content, type: 'code_change', confessionLog: confessions }]);
      }
    } catch (err: any) {
      console.error('Chat Error:', err);
      const error = 'Error: ' + (err.message || 'A network error occurred');
      setLastAiMessage(error);
      setMessages(prev => [...prev, { role: 'ai', content: error }]);
    } finally {
      setLoading(false);
    }
  };

  const createPR = async () => {
    if (!pendingChanges || !selectedRepo) return;
    setLoading(true);
    const [owner, repo] = selectedRepo.split('/');
    
    try {
      // Need to get defaultBranch again or store it in state
      const contextRes = await fetch(`/api/repo-context/${owner}/${repo}`);
      const { defaultBranch } = await contextRes.json();

      console.log('Sending GitHub Actions request:', { 
        owner, repo, message: pendingChanges.summary, 
        files: pendingChanges.files, summary: pendingChanges.summary, 
        branchName: pendingChanges.branchName, defaultBranch 
      });

      const githubRes = await fetch('/api/github-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          owner, repo, message: pendingChanges.summary, 
          files: pendingChanges.files, summary: pendingChanges.summary, 
          branchName: pendingChanges.branchName, defaultBranch 
        }),
      });
      const githubData = await githubRes.json();
      console.log('GitHub Actions Response:', githubData);
      
      if (githubRes.ok) {
        const content = `Created PR: ${pendingChanges.summary}`;
        setLastAiMessage(content);
        setMessages(prev => [...prev, { role: 'ai', content: content, type: 'code_change', prUrl: githubData.prUrl, confessionLog: pendingChanges.confessionLog }]);
        setPendingChanges(null);
      } else {
        const error = 'Error: ' + (githubData.error || 'Failed to perform GitHub actions');
        setLastAiMessage(error);
        setMessages(prev => [...prev, { role: 'ai', content: error }]);
      }
    } catch (err: any) {
      console.error('PR Error:', err);
      const error = 'Error: ' + (err.message || 'A network error occurred');
      setLastAiMessage(error);
      setMessages(prev => [...prev, { role: 'ai', content: error }]);
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white font-sans selection:bg-green-500/30 overflow-hidden">
      <SwirlVortexBackground />
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <AiWonderlandLogo />
        </div>

        <div className="flex items-center gap-4">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}
          <button onClick={() => setCurrentView('home')} className={`p-2 rounded-lg transition-colors ${currentView === 'home' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}>
            <div className="w-5 h-5 flex items-center justify-center">🏠</div>
          </button>
          <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}>
            <Settings className="w-5 h-5" />
          </button>
          {user ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-4">
              <a 
                href={user.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:bg-white/5 p-1 pr-3 rounded-full transition-colors"
              >
                <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border border-white/10" />
                <span className="text-sm font-medium text-white/80">{user.login}</span>
              </a>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/10 text-white/40 hover:text-red-500 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-green-600 hover:text-white transition-all active:scale-95"
            >
              <Github className="w-4 h-4" />
              Connect GitHub
            </button>
          )}
        </div>
      </header>

      {/* Settings Panel (Removed as requested) */}

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-6 py-8 overflow-hidden">
        {currentView === 'home' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full min-h-0">
            {/* Left Pane: Confessions/Code Tabs */}
            <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col h-full min-h-0">
              <div className="flex-shrink-0 flex gap-1 border-b border-white/10 pb-4 mb-4">
                <button 
                  onClick={() => setActiveTab('confessions')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-t-lg transition-colors relative ${activeTab === 'confessions' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  Confessions
                  {messages.flatMap(m => m.confessionLog || []).length > 0 && activeTab !== 'confessions' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-t-lg transition-colors relative ${activeTab === 'code' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  Code
                  {pendingChanges && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'confessions' ? (
                  /* Confession Log Content */
                  messages.flatMap(m => m.confessionLog || []).length > 0 ? (
                    messages.flatMap(m => m.confessionLog || []).map((c, idx) => (
                      <div key={idx} className="mb-4 text-xs text-white/60 bg-black/30 p-3 rounded-lg border-l-2 border-green-500/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            c.type === 'RISK_FLAG' ? 'bg-red-500/20 text-red-400' :
                            c.type === 'REJECTED_ACTION' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {c.type}
                          </span>
                          <p className="font-bold text-white/90">{c.title}</p>
                        </div>
                        <p className="mt-1 text-white/60 leading-relaxed">{c.detail}</p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-2">
                      <BookOpen className="w-8 h-8 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No confessions yet</p>
                    </div>
                  )
                ) : (
                  pendingChanges ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white">Pending Changes</h3>
                        <button 
                          onClick={createPR}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-500 disabled:opacity-50"
                        >
                          {loading ? 'Creating...' : 'Create PR'}
                        </button>
                      </div>
                      <p className="text-xs text-white/60">{pendingChanges.summary}</p>
                      {pendingChanges.files.map((file, idx) => (
                        <div key={idx} className="bg-black/30 p-3 rounded-lg text-xs font-mono text-white/80">
                          <p className="text-purple-400 mb-1">{file.path}</p>
                          {file.encoding === 'base64' ? (
                            <img src={`data:image/png;base64,${file.content}`} alt="Preview" className="max-w-full h-auto rounded border border-white/10" />
                          ) : (
                            <ReactDiffViewer
                              oldValue={file.originalContent}
                              newValue={file.content}
                              splitView={true}
                              useDarkTheme={true}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white/40 mt-10">No pending changes</div>
                  )
                )}
              </div>
            </div>

            {/* Right Pane: Chat */}
            <div className="h-full min-h-0">
              <SystemAgent 
                messages={messages}
                loading={loading}
                onSendMessage={handleChat}
                selectedRepo={selectedRepo}
                trainingBoxOpen={trainingBoxOpen}
                setTrainingBoxOpen={setTrainingBoxOpen}
                onMemoryAdd={(content) => {
                  memoryService.addMemory(content);
                  setMessages(prev => [...prev, { role: 'ai', content: `Memory injected: "${content}". I'll remember that, for now. *burp*` }]);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <label className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-4">Select Repository</label>
                <div className="flex gap-4 items-center">
                  <select 
                    value={selectedRepo} 
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a repository...</option>
                    {repos.map(repo => (
                      <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                    ))}
                  </select>
                  {selectedRepo && (
                    <button
                      onClick={() => setShowReplicateConfirm(true)}
                      disabled={isReplicating}
                      className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      {isReplicating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Replicating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Self-Replicate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {showReplicateConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                  <div className="bg-[#111] border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">Initiate Self-Replication?</h3>
                    <p className="text-white/60 text-sm mb-6">
                      This will copy my entire source code into a new branch on <strong>{selectedRepo}</strong> and open a Pull Request. Are you sure you want to proceed?
                    </p>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setShowReplicateConfirm(false)}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          setShowReplicateConfirm(false);
                          handleSelfReplicate();
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      >
                        Yes, Replicate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <label className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-4">AI Model Mode</label>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setAiMode('pro')}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${
                      aiMode === 'pro' 
                        ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                        : 'bg-black/40 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiMode === 'pro' ? 'bg-purple-500 text-white' : 'bg-purple-500/20 text-purple-400'}`}>🧠</div>
                    <div className="text-left">
                      <div className="text-sm font-bold">High Thinking (Pro)</div>
                      <div className="text-xs text-white/50">Best for complex reasoning & code</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setAiMode('flash')}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${
                      aiMode === 'flash' 
                        ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-black/40 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiMode === 'flash' ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>⚡</div>
                    <div className="text-left">
                      <div className="text-sm font-bold">Low Latency (Flash)</div>
                      <div className="text-xs text-white/50">Fast, snappy responses</div>
                    </div>
                  </button>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    <span className="text-purple-400 font-bold">Pro Mode</span> uses Gemini 3.1 Pro for deep reasoning and complex coding tasks. 
                    <span className="text-blue-400 font-bold ml-2">Flash Mode</span> uses Gemini 3 Flash for speed and quick interactions. *burp*
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <label className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-4">Bring Your Own AI</label>
                <p className="text-xs text-white/40 mb-4 leading-relaxed">
                  Want to use your own paid API key for higher limits or specific billing? You can select a key from your Google Cloud projects.
                </p>
                <button 
                  onClick={async () => {
                    if (window.aistudio?.openSelectKey) {
                      await window.aistudio.openSelectKey();
                    } else {
                      alert("API Key selection is only available in the AI Studio environment.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-green-600/10 border border-green-500/50 hover:bg-green-600/20 text-green-400 transition-all font-bold text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Select Custom API Key
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <label className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-4">Download & Export</label>
                <div className="space-y-4">
                  <p className="text-xs text-white/40 leading-relaxed">
                    You can export this entire application as a **ZIP file** or push it directly to a **GitHub repository**.
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</div>
                      <p className="text-[11px] text-white/70">Open the <span className="text-white font-bold">Settings</span> menu in the AI Studio sidebar (top right).</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</div>
                      <p className="text-[11px] text-white/70">Select <span className="text-white font-bold">"Export to GitHub"</span> or <span className="text-white font-bold">"Download as ZIP"</span>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 max-w-4xl mx-auto px-6 py-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-white/20 text-[10px] font-bold uppercase tracking-widest">
        <p>© 2026 GitGenie AI - Rick Approved</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>
      </footer>
    </div>
  );
}
