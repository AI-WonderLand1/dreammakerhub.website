// app/support/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/auth-context';
import { logger } from '@/lib/logger';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export const metadata = {
  title: 'Support Center | AI Wonderland',
  description: 'Get help with AI Wonderland.',
};

export default function SupportPage() {
  const { user } = useSupabase();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    const response = await fetch('/api/support/tickets');
    const data = await response.json();
    setTickets(data.tickets || []);
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket)
    });
    
    const result = await response.json();
    
    if (result.success) {
      setTickets([result.ticket, ...tickets]);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
      setIsCreatingTicket(false);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/support/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: selectedTicket?.id,
        content: newComment
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setNewComment('');
      // Refresh ticket comments
      if (selectedTicket) {
        const ticketResponse = await fetch(`/api/support/tickets/${selectedTicket.id}`);
        const ticketData = await ticketResponse.json();
        setSelectedTicket(ticketData.ticket);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-1">AI WONDERLAND</p>
            <h1 className="text-3xl font-bold">Support Center</h1>
          </div>
          <button
            onClick={() => setIsCreatingTicket(true)}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition text-sm"
          >
            Create Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Your Tickets</h2>
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedTicket?.id === ticket.id ? 'border-violet-500/50 bg-violet-900/20' : 'border-white/10 bg-slate-900/70 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm text-white">{ticket.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ticket.status === 'open' ? 'bg-yellow-900/50 text-yellow-300' :
                      ticket.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                      ticket.status === 'resolved' ? 'bg-green-900/50 text-green-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      ticket.priority === 'urgent' ? 'bg-red-900/50 text-red-300' :
                      ticket.priority === 'high' ? 'bg-orange-900/50 text-orange-300' :
                      ticket.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-green-900/50 text-green-300'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedTicket.title}</h2>
                    <p className="text-slate-400 mt-2 text-sm">{selectedTicket.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      selectedTicket.status === 'open' ? 'bg-yellow-900/50 text-yellow-300' :
                      selectedTicket.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                      selectedTicket.status === 'resolved' ? 'bg-green-900/50 text-green-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-slate-500 mb-6">
                  <span>Priority: {selectedTicket.priority}</span>
                  <span>Category: {selectedTicket.category}</span>
                  <span>Created: {new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>

                {/* Comments */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold mb-4 text-slate-200">Conversation</h3>
                  <div className="space-y-4 mb-6">
                    {selectedTicket.comments?.map(comment => (
                      <div key={comment.id} className="bg-slate-950 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                          <span>Support Team</span>
                          <span>{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <form onSubmit={addComment} className="border-t border-white/10 pt-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl resize-none text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                      rows={4}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">You can add additional information to this ticket</span>
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition text-sm"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 text-center text-slate-500">
                <div className="text-5xl mb-4">🎫</div>
                <h3 className="text-lg font-semibold mb-2 text-slate-300">Select a Ticket</h3>
                <p className="text-sm">Click on a ticket from the list to view details and add comments.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Modal */}
        {isCreatingTicket && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-white">Create Support Ticket</h2>
              <form onSubmit={createTicket}>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                    placeholder="Ticket title"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                    required
                  />
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    placeholder="Describe your issue..."
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                    rows={4}
                    required
                  />
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="general">General Question</option>
                    <option value="billing">Billing Issue</option>
                    <option value="technical">Technical Problem</option>
                    <option value="feature">Feature Request</option>
                    <option value="security">Security Concern</option>
                  </select>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTicket(false)}
                    className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                  >
                    Create Ticket
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
