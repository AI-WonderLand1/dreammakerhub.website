'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface GLTFUploaderProps {
  onUpload?: (url: string, name: string) => void;
}

export function GLTFUploader({ onUpload }: GLTFUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['glb', 'gltf'].includes(ext || '')) {
        setError('Only .glb and .gltf files allowed');
        return;
      }
      setError('');
      setFile(selected);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress('Uploading...');
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^.]+$/, ''));
      
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProgress('Done!');
        onUpload?.(data.url, data.name);
        setFile(null);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [file, onUpload]);

  return (
    <div className="bg-black text-white rounded-xl border border-white/20 p-4">
      <h3 className="text-lg font-semibold mb-3">📤 Upload 3D Model</h3>
      
      <div className="space-y-3">
        <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileChange}
            className="hidden"
            id="gltf-upload"
          />
          <label htmlFor="gltf-upload" className="cursor-pointer">
            {file ? (
              <p className="text-sm text-cyan-400">{file.name}</p>
            ) : (
              <>
                <p className="text-white/60 text-sm">Drop .glb or .gltf file here</p>
                <p className="text-white/40 text-xs mt-1">or click to browse</p>
              </>
            )}
          </label>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        
        {progress && !error && (
          <p className="text-green-400 text-sm">{progress}</p>
        )}
        
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2 bg-cyan-600 rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50 text-sm"
          >
            {uploading ? 'Uploading...' : 'Upload Model'}
          </button>
        )}
      </div>
    </div>
  );
}