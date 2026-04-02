import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const SettingsModal = ({ isOpen, onClose, userId }: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setApiKey(docSnap.data().geminiApiKey || '');
      }
    };
    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    await setDoc(doc(db, 'users', userId), { geminiApiKey: apiKey }, { merge: true });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg border border-white/10 w-96">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        <label className="block text-sm font-medium text-white mb-2">Gemini API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-black border border-white/10 rounded p-2 text-white mb-4"
          placeholder="Enter your API key"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded text-white">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded text-white">Save</button>
        </div>
      </div>
    </div>
  );
};
