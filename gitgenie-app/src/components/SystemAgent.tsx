import { useState } from 'react';
import { Send, Loader2, Paperclip, BookOpen, Zap, Code2, Download, Trash2, ChevronDown } from 'lucide-react';
import { PersonaAvatar, PersonaType } from './PersonaAvatar';

interface SystemAgentProps {
  messages: any[];
  loading: boolean;
  forensicReport: any;
  onSendMessage: (message: string, file?: { data: string; mimeType: string; name: string }) => void;
  selectedRepo: string;
  trainingBoxOpen: boolean;
  setTrainingBoxOpen: (open: boolean) => void;
  onMemoryAdd: (content: string) => void;
  onClearChat: () => void;
  persona: PersonaType;
  setPersona: (persona: PersonaType) => void;
}

export const SystemAgent = ({ 
  messages, 
  loading, 
  forensicReport,
  onSendMessage, 
  selectedRepo,
  trainingBoxOpen,
  setTrainingBoxOpen,
  onMemoryAdd,
  onClearChat,
  persona,
  setPersona
}: SystemAgentProps) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      const sound = persona === 'rick' ? '*burp*' : persona === 'morty' ? '*aw geez*' : persona === 'rick_and_morty' ? '*burp* *aw geez*' : '*beep boop*';
      alert(`File too large. Max 10MB. ${sound}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const data = base64.split(',')[1];
      setSelectedFile({
        data,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input && !selectedFile) || !selectedRepo || loading) return;
    
    let finalInput = input;
    if (forensicReport) {
      finalInput = `[Forensic Architect Report]: ${JSON.stringify(forensicReport)}\n\nUser Message: ${input}`;
    }
    
    onSendMessage(finalInput, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  const handleSaveChat = () => {
    const chatText = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitgenie-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/20 via-green-900/20 to-yellow-900/20 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl relative">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">System Agent</h2>
          <button 
            onClick={() => setTrainingBoxOpen(!trainingBoxOpen)} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${
              trainingBoxOpen 
                ? 'bg-green-600/20 border-green-600 text-green-400' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Train AI
          </button>
          
          <div className="relative group">
            <select 
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaType)}
              className="appearance-none bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="alice" className="bg-gray-900 text-white">Alice</option>
              <option value="rick" className="bg-gray-900 text-white">Rick</option>
              <option value="morty" className="bg-gray-900 text-white">Morty</option>
              <option value="rick_and_morty" className="bg-gray-900 text-white">Rick & Morty</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSaveChat} 
            disabled={messages.length === 0}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors" 
            title="Save Chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={onClearChat} 
            disabled={messages.length === 0}
            className="text-white/40 hover:text-red-400 disabled:opacity-30 transition-colors" 
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
            <PersonaAvatar persona={persona} message={persona === 'rick' ? "Select a repo and ask me something. I don't have all day. *burp*" : persona === 'morty' ? "A-aw geez, pick a repo and ask a question, okay?" : persona === 'rick_and_morty' ? "Select a repo, Morty! We gotta-- *burp* we gotta code!" : "Select a repo and ask me something. I don't have all day."} />
            <p className="text-sm font-bold uppercase tracking-widest">System Agent Ready</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-2xl max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-white/10 ml-auto border border-white/5' 
                : 'bg-green-900/20 border border-green-900/50 mr-auto'
            } transition-all hover:scale-[1.01]`}
          >
            {msg.file && (
              <div className="mb-2 p-2 bg-black/20 rounded-lg border border-white/5 flex items-center gap-2">
                <Paperclip className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-bold truncate">{msg.file.name}</span>
              </div>
            )}
            <p className="text-sm leading-relaxed">{msg.content}</p>
            {msg.type === 'code_change' && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-green-400/60">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                Code Changes Proposed
              </div>
            )}
            {msg.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                <img src={msg.imageUrl} alt="Generated by AI" className="w-full h-auto" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-center justify-center mt-8 mb-4">
            <PersonaAvatar persona={persona} isWorking={true} />
            <p className="text-xs font-medium text-cyan-400/70 italic mt-4 animate-pulse">
              {persona === 'rick' ? "Rick is thinking... *burp*" : persona === 'morty' ? "Morty is trying his best..." : persona === 'rick_and_morty' ? "Rick and Morty are figuring it out... *burp*" : "Alice is processing your request..."}
            </p>
          </div>
        )}
      </div>

      {/* Training Box (Integrated) */}
      {trainingBoxOpen && (
        <div className="bg-black/40 p-4 rounded-xl mb-4 border border-green-500/20 backdrop-blur-xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-green-500/60">
            <BookOpen className="w-3 h-3" />
            Memory Injection
          </div>
          <textarea
            placeholder="Teach me something new about your code..."
            className="w-full bg-transparent text-sm focus:outline-none text-white/80 placeholder:text-white/20 resize-none"
            rows={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const val = (e.target as HTMLTextAreaElement).value;
                if (val) {
                  onMemoryAdd(val);
                  setTrainingBoxOpen(false);
                }
              }
            }}
          />
          <p className="text-[9px] text-white/20 mt-1">Press Enter to save memory</p>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Paperclip className="w-4 h-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white/80 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{selectedFile.mimeType}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="text-white/20 hover:text-white/60 transition-colors p-1"
          >
            <Zap className="w-3 h-3 rotate-45" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-4 pt-4 border-t border-white/10">
        <label className={`p-3 backdrop-blur-md border rounded-xl cursor-pointer transition-all flex-shrink-0 hover:scale-105 active:scale-95 ${selectedFile ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/20 border-white/10 text-white/40 hover:text-white/60'}`}>
          <Paperclip className="w-4 h-4" />
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        <button
          type="button"
          onClick={() => {
            const sound = persona === 'rick' ? '*burp*' : persona === 'morty' ? '*aw geez*' : persona === 'rick_and_morty' ? '*burp* *aw geez*' : '*beep boop*';
            const name = persona === 'rick' ? 'Rick' : persona === 'morty' ? 'Morty' : persona === 'rick_and_morty' ? 'Rick and Morty' : 'Alice';
            onSendMessage(`${name}, review this repository and propose some improvements. Be precise. ${sound}`);
          }}
          disabled={!selectedRepo || loading}
          className="p-3 rounded-xl border border-white/10 bg-black/20 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
          title="Review Repo"
        >
          <Code2 className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedRepo ? `Ask ${persona === 'rick' ? 'Rick' : persona === 'morty' ? 'Morty' : persona === 'rick_and_morty' ? 'Rick & Morty' : 'Alice'} anything...` : "Select a repo first..."}
          disabled={!selectedRepo || loading}
          className="flex-1 min-w-0 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/50 transition-all disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={loading || !selectedRepo || !input}
          className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-green-500 disabled:opacity-50 transition-all flex-shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-green-900/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
