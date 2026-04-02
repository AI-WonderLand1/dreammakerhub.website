import React, { useEffect, useState } from 'react';
import { confessionService, Confession } from '../services/ConfessionService';
import { auth } from '../firebase';

export const ConfessionList = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        confessionService.subscribeToUser(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = confessionService.onChange((newConfessions) => {
      setConfessions(newConfessions);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 bg-black/20 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Real-time Confessions</h2>
      {confessions.length > 0 ? (
        confessions.map((confession) => (
          <div key={confession.id} className="mb-2 p-2 bg-black/30 rounded border border-white/10">
            <p className="font-bold text-white">{confession.type}: {confession.title}</p>
            <p className="text-white/80">{confession.detail}</p>
            <p className="text-xs text-white/50">{new Date(confession.timestamp).toLocaleString()}</p>
          </div>
        ))
      ) : (
        <p className="text-white/40 text-sm italic">No confessions yet.</p>
      )}
    </div>
  );
};
