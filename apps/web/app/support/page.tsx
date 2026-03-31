// app/support/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@lib/supabase/auth-context';

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support Center</h1>
        <button
          onClick={() => setIsCreatingTicket(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Tickets</h2>
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-lg cursor-pointer border-2 ${
                  selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{ticket.category}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
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
            <div className="bg-white rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTicket.title}</h2>
                  <p className="text-gray-600 mt-2">{selectedTicket.description}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-6">
                <span>Priority: {selectedTicket.priority}</span>
                <span>Category: {selectedTicket.category}</span>
                <span>Created: {new Date(selectedTicket.created_at).toLocaleString()}</span>
              </div>

              {/* Comments */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                <div className="space-y-4 mb-6">
                  {selectedTicket.comments?.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Support Team</span>
                        <span>{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <form onSubmit={addComment} className="border-t pt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">You can add additional information to this ticket</span>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 text-center text-gray-500">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold mb-2">Select a Ticket</h3>
              <p>Click on a ticket from the list to view details and add comments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreatingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Support Ticket</h2>
            <form onSubmit={createTicket}>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="Ticket title"
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Describe your issue..."
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  required
                />
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  className="w-full p-3 border rounded-lg"
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
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
