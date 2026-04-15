"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFeatureGate } from '@/lib/useSubscription';

type DashboardAIProps = {
  className?: string;
};

type DashboardAction = {
  id: string;
  label: string;
  description: string;
  href?: string;
  action?: () => void;
  requiresPro?: boolean;
  icon: string;
};

export default function DashboardAI({ className = '' }: DashboardAIProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { allowed: proFeaturesAllowed, isPaid, plan } = useFeatureGate('agents');

  // Dashboard-specific actions
  const dashboardActions: DashboardAction[] = [
    {
      id: 'agents',
      label: 'Manage Agents',
      description: 'View and configure AI agents',
      href: '/dashboard/agents',
      icon: '🤖',
      requiresPro: true
    },
    {
      id: 'projects',
      label: 'View Projects',
      description: 'Browse and manage your projects',
      href: '/dashboard/projects',
      icon: '📁'
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Check usage and performance metrics',
      href: '/dashboard/analytics',
      icon: '📊'
    },
    {
      id: 'collaboration',
      label: 'Collaborate',
      description: 'Invite team members and collaborate',
      href: '/dashboard/collaboration',
      icon: '👥'
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configure your workspace',
      href: '/dashboard/settings',
      icon: '⚙️'
    },
    {
      id: 'upgrade',
      label: 'Upgrade Plan',
      description: 'Unlock premium features',
      href: '/subscription',
      icon: '🚀',
      requiresPro: false // Show for free users
    }
  ];

  const handleQuickAction = (action: DashboardAction) => {
    if (action.requiresPro && !isPaid) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🚀 This feature requires Pro plan. You're currently on ${plan || 'Free'} plan.`,
        timestamp: Date.now()
      }]);
      return;
    }

    if (action.href) {
      window.location.href = action.href;
    } else if (action.action) {
      action.action();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call unified AI API with dashboard context
      const response = await fetch('/api/unified-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dashboard',
          message: input,
          context: {
            page: pathname,
            isPaid: isPaid,
            plan: plan
          }
        })
      });

      const data = await response.json();

      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || data.data || 'How can I help you with the dashboard?',
        timestamp: Date.now(),
        data: data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            🏠 Dashboard AI
            {!isPaid && (
              <span className="text-xs bg-yellow-600/50 text-yellow-200 px-2 py-0.5 rounded-full">
                Free
              </span>
            )}
          </h3>
          <p className="text-xs text-white/50">Your central command center</p>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white/60 hover:text-white transition"
        >
          {isOpen ? '▼' : '▶'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Quick Actions Grid */}
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-white/60 mb-3">Quick Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {dashboardActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={`p-3 rounded-lg border transition text-left ${
                    action.requiresPro && !isPaid
                      ? 'border-yellow-600/30 bg-yellow-600/10 opacity-75'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{action.icon}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{action.label}</p>
                      <p className="text-xs text-white/60">{action.description}</p>
                      {action.requiresPro && !isPaid && (
                        <p className="text-xs text-yellow-400 mt-1">Pro feature</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="p-4">
            <div className="h-48 overflow-y-auto mb-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  <p className="text-3xl mb-2">🏠</p>
                  <p className="text-sm">Ask me anything about the dashboard</p>
                  <p className="text-xs mt-1">Try: "Show me my projects" or "How do I upgrade?"</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white ml-4' 
                        : 'bg-white/10 text-white mr-4'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="bg-white/10 text-white rounded-lg p-3 mr-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about dashboard..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm transition"
              >
                Send
              </button>
            </div>

            {/* Subscription Status */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-white/60">
                    {isPaid ? `${plan || 'Pro'} Plan` : 'Free Plan'}
                  </span>
                </div>
                
                {!isPaid && (
                  <Link
                    href="/subscription"
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}