"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFeatureGate } from '@/lib/useSubscription';
import { CLIENT_PERSONAS } from '@/lib/ai/personas';
import { logger } from '@/lib/logger';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
  runner?: string;
};

type Agent = {
  id: string;
  name: string;
  type: 'builder' | 'designer' | 'debugger' | 'runner' | 'worker';
  description: string;
  available: boolean;
};

type UniversalAIProps = {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'dark' | 'light';
  enableAgents?: boolean;
  enableRunners?: boolean;
  defaultAgent?: string;
  dashboardUrl?: string;
};

const MODEL_OPTIONS = CLIENT_PERSONAS.map(p => ({ id: p.id, name: p.name, sub: p.tagline, tier: p.tier }));

export default function UniversalAIAssistant({
  position = 'bottom-right',
  theme = 'dark',
  enableAgents = true,
  enableRunners = true,
  defaultAgent = 'spirit-guide',
  dashboardUrl = '/dashboard'
}: UniversalAIProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState(defaultAgent);
  const [showAgents, setShowAgents] = useState(false);
  const [modelId, setModelId] = useState('alice');
  const [showModels, setShowModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { allowed: agentsAllowed, isPaid, plan, isLoading: subscriptionLoading } = useFeatureGate('agents');
  const { allowed: runnersAllowed } = useFeatureGate('runners');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadAgents = async () => {
      const baseAgents: Agent[] = [
        {
          id: 'spirit-guide',
          name: 'Spirit Guide',
          type: 'builder',
          description: 'General assistant for platform navigation and help',
          available: true
        },
        {
          id: 'egyptian_voice',
          name: 'Voice',
          type: 'builder',
          description: 'Ancient wisdom through hieroglyphic metaphors',
          available: true
        }
      ];

      if (agentsAllowed && enableAgents) {
        baseAgents.push(
          {
            id: 'builder',
            name: 'Builder',
            type: 'builder',
            description: 'Create React components and UI elements',
            available: true
          },
          {
            id: 'designer',
            name: 'Designer',
            type: 'designer',
            description: 'Design UI/UX and visual elements',
            available: true
          },
          {
            id: 'debugger',
            name: 'Debugger',
            type: 'debugger',
            description: 'Debug and fix code issues',
            available: true
          }
        );
      }

      if (runnersAllowed && enableRunners) {
        baseAgents.push(
          {
            id: 'project-runner',
            name: 'Project Runner',
            type: 'runner',
            description: 'Execute project builds and deployments',
            available: true
          },
          {
            id: 'data-processor',
            name: 'Data Processor',
            type: 'worker',
            description: 'Process and analyze data',
            available: true
          }
        );
      }

      setAgents(baseAgents);

      if (!agentsAllowed && selectedAgent !== 'spirit-guide') {
        setSelectedAgent('spirit-guide');
      }
    };

    if (!subscriptionLoading) {
      loadAgents();
    }
  }, [enableAgents, enableRunners, agentsAllowed, runnersAllowed, subscriptionLoading, selectedAgent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      agent: selectedAgent
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const useRealChat = selectedAgent === 'spirit-guide';

      if (useRealChat) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            message: input,
            history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();

        let content: string;
        if (res.status === 402 || data.upgrade) {
          content = `🔒 ${data.label || 'This model'} requires a paid plan. Upgrade in the Dashboard → Subscription to unlock premium AI.`;
        } else if (!res.ok || data.error) {
          content = `Error: ${data.error || 'AI request failed'}`;
        } else {
          content = data.text || '(empty response)';
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        }]);
        return;
      }

      const endpoint = '/api/unified-ai';
      const body: any = {
        action: 'chat',
        message: input,
        agent: selectedAgent,
        context: {
          page: pathname,
          timestamp: Date.now()
        },
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      };

      if (selectedAgent === 'builder' || selectedAgent === 'designer' || selectedAgent === 'debugger') {
        body.action = 'agent';
        body.agent = selectedAgent;
      } else if (selectedAgent.includes('runner') || selectedAgent.includes('worker')) {
        body.action = 'runner';
        body.runner = selectedAgent;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      let responseContent = "I've processed your request.";
      let showDashboardLink = false;

      if (data.success) {
        if (data.response) responseContent = data.response;
        else if (data.result) responseContent = data.result;
        else if (data.data) responseContent = JSON.stringify(data.data, null, 2);

        showDashboardLink = data.dashboard || data.suggestDashboard || false;
      } else if (data.error) {
        responseContent = `Error: ${data.error}`;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        agent: selectedAgent,
        runner: selectedAgent.includes('runner') ? selectedAgent : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (showDashboardLink) {
        const dashboardMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: `Tip: You can manage this from the [Dashboard](${dashboardUrl})`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, dashboardMessage]);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error. Please try again or switch agents.',
        timestamp: Date.now(),
        agent: selectedAgent
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, messages, pathname, dashboardUrl, modelId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left': return 'bottom-6 left-6';
      case 'top-right': return 'top-6 right-6';
      case 'top-left': return 'top-6 left-6';
      default: return 'bottom-6 right-6';
    }
  };

  const getPanelPosition = () => {
    switch (position) {
      case 'bottom-left': return 'bottom-24 left-6';
      case 'top-right': return 'top-24 right-6';
      case 'top-left': return 'top-24 left-6';
      default: return 'bottom-24 right-6';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${getPositionClasses()} w-12 h-12 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.1] hover:border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 z-50 flex items-center justify-center group`}
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        aria-label="Open AI Assistant"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white/20 border border-white/30" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed ${getPanelPosition()} w-[400px] h-[560px] bg-[#09090b] border border-white/[0.08] rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden`}
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between relative">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">AI Assistant</h3>
                  <p className="text-[11px] text-white/25">
                    {MODEL_OPTIONS.find(m => m.id === modelId)?.name || 'Alice'} ready
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 relative">
              {/* Model Picker */}
              <button
                onClick={() => setShowModels(!showModels)}
                className={`px-2 h-8 rounded-lg flex items-center gap-1 text-[11px] transition-colors ${showModels ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}`}
                title="Choose AI model"
              >
                {MODEL_OPTIONS.find(m => m.id === modelId)?.name || 'Alice'}
                {MODEL_OPTIONS.find(m => m.id === modelId)?.tier === 'premium' && <span className="text-amber-400">★</span>}
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModels && (
                <div className="absolute right-0 top-10 w-64 bg-[#101012] border border-white/[0.08] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden z-10">
                  {MODEL_OPTIONS.map(m => {
                    const locked = m.tier === 'premium' && !isPaid;
                    const active = m.id === modelId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (locked) {
                            setShowModels(false);
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: 'system',
                              content: `🔒 ${m.name} is a premium model — upgrade to Pro in Dashboard → Subscription to use it.`,
                              timestamp: Date.now()
                            }]);
                            return;
                          }
                          setModelId(m.id);
                          setShowModels(false);
                        }}
                        className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left transition-colors ${active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-white truncate">{m.name}</span>
                          <span className="block text-[10px] text-white/30 truncate">{m.sub}</span>
                        </span>
                        {m.tier === 'premium'
                          ? <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide ${locked ? 'text-white/25' : 'text-amber-400'}`}>{locked ? '🔒 Pro' : '★ Pro'}</span>
                          : <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-emerald-400">Free</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {enableAgents && (
                <button
                  onClick={() => {
                    if (isPaid) {
                      setShowAgents(!showAgents);
                    } else {
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'system',
                        content: 'Upgrade to Pro to access specialized AI agents (Builder, Designer, Debugger).',
                        timestamp: Date.now()
                      }]);
                    }
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors ${!isPaid ? 'opacity-50' : ''}`}
                  title={isPaid ? "Select Agent" : "Requires Pro plan"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Agent Selector Panel */}
          {showAgents && enableAgents && (
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex justify-between items-center mb-2.5">
                <p className="text-[11px] text-white/35 font-medium uppercase tracking-wider">Select Agent</p>
                {!isPaid && (
                  <Link href="/subscription" className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
                    Upgrade
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setShowAgents(false);
                    }}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                      selectedAgent === agent.id
                        ? 'bg-white/[0.1] text-white border border-white/[0.12]'
                        : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {agent.name}
                  </button>
                ))}

                {!isPaid && (
                  <div className="w-full mt-2 pt-2 border-t border-white/[0.06]">
                    <p className="text-[11px] text-white/25 mb-2">Pro agents:</p>
                    <div className="flex flex-wrap gap-1">
                      {["Builder", "Designer", "Debugger", "Runner"].map(name => (
                        <span key={name} className="text-[10px] text-white/20 px-2 py-1 rounded border border-white/[0.06]">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/50 mb-1">How can I help?</p>
                <p className="text-xs text-white/25">Ask me anything about the platform.</p>

                <div className="mt-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500/60' : 'bg-white/20'}`} />
                    <span className="text-[11px] text-white/30">
                      {isPaid ? `${plan || 'Pro'} Plan` : 'Free Plan'}
                    </span>
                  </div>
                  {!isPaid && (
                    <Link href="/subscription" className="block text-[11px] text-white/25 hover:text-white/40 transition-colors">
                      Upgrade for Builder, Designer, Debugger agents
                    </Link>
                  )}
                </div>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-white/[0.08] text-white/80 rounded-br-md border border-white/[0.06]'
                      : message.role === 'system'
                      ? 'bg-white/[0.03] text-white/35 border border-white/[0.04]'
                      : 'bg-white/[0.04] text-white/60 rounded-bl-md border border-white/[0.06]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.agent && message.agent !== 'spirit-guide' && (
                    <p className="text-[10px] text-white/20 mt-1.5 pt-1.5 border-t border-white/[0.06]">
                      via {agents.find(a => a.id === message.agent)?.name || message.agent}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${selectedAgent === 'spirit-guide' ? 'anything' : agents.find(a => a.id === selectedAgent)?.name || 'AI'}...`}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-white/[0.15] transition-colors"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.08] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
              >
                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {[
                { label: "Navigate", value: "Help me navigate" },
                { label: "Build", value: "What can I build?" },
                { label: "Dashboard", value: "Show me the dashboard" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.value)}
                  className="text-[11px] text-white/20 hover:text-white/40 px-2.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
                >
                  {action.label}
                </button>
              ))}
              <Link
                href={dashboardUrl}
                className="text-[11px] text-white/20 hover:text-white/40 px-2.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { UniversalAIAssistant };
