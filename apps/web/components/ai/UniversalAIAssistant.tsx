"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFeatureGate } from '@/lib/useSubscription';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Check subscription status
  const { allowed: agentsAllowed, isPaid, plan, isLoading: subscriptionLoading } = useFeatureGate('agents');
  const { allowed: runnersAllowed } = useFeatureGate('runners');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available agents based on subscription
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Always include Spirit Guide and Egyptian Voice (free tier)
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
            name: '𓂀 Egyptian Voice',
            type: 'builder',
            description: 'Ancient wisdom through hieroglyphic metaphors',
            available: true
          }
        ];

        // Add premium agents only for paid users
        if (agentsAllowed && enableAgents) {
          const premiumAgents: Agent[] = [
            {
              id: 'builder',
              name: 'Builder Agent',
              type: 'builder',
              description: 'Create React components and UI elements',
              available: true
            },
            {
              id: 'designer',
              name: 'Designer Agent',
              type: 'designer',
              description: 'Design UI/UX and visual elements',
              available: true
            },
            {
              id: 'debugger',
              name: 'Debugger Agent',
              type: 'debugger',
              description: 'Debug and fix code issues',
              available: true
            }
          ];
          baseAgents.push(...premiumAgents);
        }

        // Add runners only for paid users
        if (runnersAllowed && enableRunners) {
          const runnerAgents: Agent[] = [
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
          ];
          baseAgents.push(...runnerAgents);
        }
        
        setAgents(baseAgents);
        
        // If current agent is premium but user is free, switch to spirit-guide
        if (!agentsAllowed && selectedAgent !== 'spirit-guide') {
          setSelectedAgent('spirit-guide');
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    };
    
    if (!subscriptionLoading) {
      loadAgents();
    }
  }, [enableAgents, enableRunners, agentsAllowed, runnersAllowed, subscriptionLoading, selectedAgent]);

  // Focus input when opened
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
      // Use unified AI endpoint
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

      // Set action based on agent type
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

      // Extract response based on action type
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

      // Show dashboard link if suggested
      if (showDashboardLink) {
        const dashboardMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: `💡 Tip: You can manage this from the [Dashboard](${dashboardUrl})`,
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
  }, [input, isLoading, selectedAgent, messages, pathname, dashboardUrl]);

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
        className={`fixed ${getPositionClasses()} w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 hover:scale-110 transition-all z-50 flex items-center justify-center`}
        aria-label="Open AI Assistant"
      >
        <span className="text-2xl">✦</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed ${getPanelPosition()} w-96 max-h-[600px] bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-white flex items-center gap-2">
                ✦ AI Assistant
                {selectedAgent !== 'spirit-guide' && (
                  <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">
                    {agents.find(a => a.id === selectedAgent)?.name || selectedAgent}
                  </span>
                )}
                {!isPaid && (
                  <span className="text-xs bg-yellow-600/50 text-yellow-200 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                )}
              </h3>
              <p className="text-xs text-purple-400">
                {pathname === dashboardUrl ? 'Dashboard Central' : `On: ${pathname}`}
                {!isPaid && (
                  <span className="text-yellow-400 ml-2">
                    (Upgrade for more features)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Dashboard Link */}
              <Link
                href={dashboardUrl}
                className="text-white/40 hover:text-white transition p-1"
                title="Go to Dashboard"
              >
                🏠
              </Link>
              
              {/* Agent Selector (only for paid users or show upgrade prompt) */}
              {enableAgents && (
                <button
                  onClick={() => {
                    if (isPaid) {
                      setShowAgents(!showAgents);
                    } else {
                      // Show upgrade prompt
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'system',
                        content: '🚀 Upgrade to Pro to access specialized AI agents (Builder, Designer, Debugger) and runners.',
                        timestamp: Date.now()
                      }]);
                    }
                  }}
                  className={`text-white/40 hover:text-white transition p-1 ${
                    !isPaid ? 'opacity-50' : ''
                  }`}
                  title={isPaid ? "Select Agent" : "Agents require Pro plan"}
                >
                  👥
                </button>
              )}
              
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Agent Selector Panel */}
          {showAgents && enableAgents && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-white/60">Select Agent/Runner:</p>
                {!isPaid && (
                  <Link
                    href="/subscription"
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setShowAgents(false);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      selectedAgent === agent.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {agent.name}
                    {agent.type !== 'builder' && (
                      <span className="ml-1 opacity-70">⚡</span>
                    )}
                  </button>
                ))}
                
                {/* Premium features placeholder for free users */}
                {!isPaid && (
                  <>
                    <div className="w-full mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-yellow-400/80 mb-2">
                        🚀 Pro features available with upgrade:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-yellow-600/20 text-yellow-200/70 px-2 py-1 rounded">
                          Builder Agent
                        </span>
                        <span className="text-xs bg-yellow-600/20 text-yellow-200/70 px-2 py-1 rounded">
                          Designer Agent
                        </span>
                        <span className="text-xs bg-yellow-600/20 text-yellow-200/70 px-2 py-1 rounded">
                          Debugger Agent
                        </span>
                        <span className="text-xs bg-yellow-600/20 text-yellow-200/70 px-2 py-1 rounded">
                          Project Runner
                        </span>
                        <span className="text-xs bg-yellow-600/20 text-yellow-200/70 px-2 py-1 rounded">
                          Data Processor
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/40 py-8">
                <p className="text-4xl mb-4">✦</p>
                <p className="text-sm">Hello! I'm your AI Assistant.</p>
                <p className="text-xs mt-2">
                  {selectedAgent === 'spirit-guide' 
                    ? 'Ask me anything about the platform.'
                    : `Using ${agents.find(a => a.id === selectedAgent)?.name || selectedAgent}`}
                </p>
                
                {/* Subscription status */}
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span className="text-xs text-white/60">
                      {isPaid ? `${plan || 'Pro'} Plan` : 'Free Plan'}
                    </span>
                  </div>
                  
                  {!isPaid && (
                    <div className="text-xs">
                      <p className="text-yellow-400/80 mb-2">
                        Upgrade to Pro for:
                      </p>
                      <ul className="text-left text-white/60 space-y-1">
                        <li>• Builder, Designer & Debugger agents</li>
                        <li>• Project & Data runners</li>
                        <li>• Unlimited AI assistance</li>
                        <li>• Advanced features</li>
                      </ul>
                      <Link 
                        href="/subscription"
                        className="inline-block mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-xs"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                </div>
                
                <p className="text-xs mt-4 text-purple-400/60">
                  💡 Tip: Visit the Dashboard to manage your AI features.
                </p>
              </div>
            )}
            
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : message.role === 'system'
                      ? 'bg-blue-900/50 text-blue-200 text-sm'
                      : 'bg-white/10 text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.agent && message.agent !== 'spirit-guide' && (
                    <p className="text-xs text-white/40 mt-1">
                      via {agents.find(a => a.id === message.agent)?.name || message.agent}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-2xl rounded-bl-none px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${selectedAgent === 'spirit-guide' ? 'anything' : agents.find(a => a.id === selectedAgent)?.name || 'AI'}...`}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 resize-none focus:outline-none focus:border-purple-500"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition"
              >
                Send
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setInput('Help me navigate')}
                className="text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1 rounded-full transition"
              >
                🧭 Navigate
              </button>
              <button
                onClick={() => setInput('What can I build?')}
                className="text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1 rounded-full transition"
              >
                🛠️ Build
              </button>
              <button
                onClick={() => setInput('Show me the dashboard')}
                className="text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1 rounded-full transition"
              >
                📊 Dashboard
              </button>
              <Link
                href={dashboardUrl}
                className="text-xs bg-purple-600/50 hover:bg-purple-600 text-white px-3 py-1 rounded-full transition"
              >
                🏠 Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export for use in layouts
export { UniversalAIAssistant };