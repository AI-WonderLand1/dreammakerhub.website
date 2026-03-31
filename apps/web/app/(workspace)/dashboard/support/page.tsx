"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@lib/supabase/client';

export default function AdminSupport() {
 const [tickets, setTickets] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (data) setTickets(data as any[]);
    };
    fetchTickets();
  }, []);

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Support Queue</h1>
      <div className="grid gap-4">
        {tickets.map((t: any) => (
          <div key={t.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
            <div>
              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${t.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`}>
                {t.priority}
              </span>
              <h3 className="text-xl font-bold mt-2">{t.subject}</h3>
              <p className="text-white/50 text-sm">{t.message}</p>
            </div>
            <button className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm">Resolve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
