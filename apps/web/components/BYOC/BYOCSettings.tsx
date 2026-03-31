'use client';

/**
 * BYOC Settings Module
 * Allows users to configure Bring Your Own Cloud storage
 */

import { useState, useEffect } from 'react';
import { BYOCConfig, BYOCCredentials, CustomEndpoints } from '@/lib/storage/types';

export function BYOCSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<'aws-s3' | 'google-cloud' | 'custom'>('aws-s3');
  const [isEnabled, setIsEnabled] = useState(false);
  const [credentials, setCredentials] = useState<BYOCCredentials>({});
  const [endpoints, setEndpoints] = useState<CustomEndpoints>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load saved BYOC config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('byoc_config');
    if (saved) {
      try {
        const config = JSON.parse(saved) as BYOCConfig;
        setProvider(config.provider);
        setIsEnabled(config.enabled);
        setCredentials(config.credentials || {});
        setEndpoints(config.endpoints || {});
      } catch (e) {
        console.error('Failed to load BYOC config:', e);
      }
    }
  }, []);

  const handleSaveConfig = async () => {
    setIsValidating(true);
    try {
      // Validate credentials format
      if (provider === 'aws-s3') {
        if (!credentials.accessKey || !credentials.secretKey || !credentials.bucketName) {
          throw new Error('AWS S3 requires Access Key, Secret Key, and Bucket Name');
        }
      } else if (provider === 'google-cloud') {
        if (!credentials.projectId || !credentials.apiKey || !credentials.bucketName) {
          throw new Error('Google Cloud requires Project ID, API Key, and Bucket Name');
        }
      } else if (provider === 'custom') {
        if (!endpoints.saveProject || !endpoints.loadProject) {
          throw new Error('Custom provider requires Save and Load endpoints');
        }
      }

      const config: BYOCConfig = {
        provider,
        credentials,
        endpoints,
        enabled: isEnabled,
        validatedAt: Date.now(),
      };

      // Test connection
      if (endpoints.saveProject) {
        const testResponse = await fetch(endpoints.saveProject, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
          body: JSON.stringify({ test: true }),
        }).catch(() => null);

        if (!testResponse?.ok && testResponse) {
          throw new Error('Failed to connect to custom endpoint');
        }
      }

      // Save to localStorage
      localStorage.setItem('byoc_config', JSON.stringify(config));
      setValidationStatus('success');
      setTimeout(() => setValidationStatus('idle'), 3000);
    } catch (error) {
      setValidationStatus('error');
      console.error('BYOC validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
      >
        <span className="font-semibold text-sm">Bring Your Own Cloud (BYOC)</span>
        <div className={`w-2 h-2 rounded-full transition-all ${isEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="mt-4 p-6 rounded-lg border border-white/10 bg-black/50 backdrop-blur space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-white/80">Enable BYOC</label>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>

          {isEnabled && (
            <>
              {/* Provider Selection */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm font-semibold">Cloud Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="aws-s3">Amazon AWS S3</option>
                  <option value="google-cloud">Google Cloud Storage</option>
                  <option value="custom">Custom (Vercel/Firebase)</option>
                </select>
              </div>

              {/* AWS S3 Credentials */}
              {provider === 'aws-s3' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Access Key"
                    value={credentials.accessKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, accessKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                  <input
                    type="password"
                    placeholder="Secret Key"
                    value={credentials.secretKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Bucket Name"
                    value={credentials.bucketName || ''}
                    onChange={(e) => setCredentials({ ...credentials, bucketName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Region (us-east-1)"
                    value={credentials.region || ''}
                    onChange={(e) => setCredentials({ ...credentials, region: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                </div>
              )}

              {/* GCP Credentials */}
              {provider === 'google-cloud' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Project ID"
                    value={credentials.projectId || ''}
                    onChange={(e) => setCredentials({ ...credentials, projectId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                  <input
                    type="password"
                    placeholder="API Key"
                    value={credentials.apiKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Bucket Name"
                    value={credentials.bucketName || ''}
                    onChange={(e) => setCredentials({ ...credentials, bucketName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                </div>
              )}

              {/* Custom Endpoints */}
              {provider === 'custom' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="Save Project Endpoint"
                    value={endpoints.saveProject || ''}
                    onChange={(e) => setEndpoints({ ...endpoints, saveProject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs"
                  />
                  <input
                    type="url"
                    placeholder="Load Project Endpoint"
                    value={endpoints.loadProject || ''}
                    onChange={(e) => setEndpoints({ ...endpoints, loadProject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs"
                  />
                  <input
                    type="url"
                    placeholder="Delete Project Endpoint"
                    value={endpoints.deleteProject || ''}
                    onChange={(e) => setEndpoints({ ...endpoints, deleteProject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="API Key"
                    value={credentials.apiKey || ''}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
                  />
                </div>
              )}

              {/* Validation Status */}
              {validationStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    validationStatus === 'success'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                      : 'bg-red-500/10 border border-red-500/20 text-red-300'
                  }`}
                >
                  {validationStatus === 'success' ? '✓ Configuration saved successfully' : '✗ Validation failed'}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveConfig}
                disabled={isValidating}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isValidating ? 'Validating...' : 'Save Configuration'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
