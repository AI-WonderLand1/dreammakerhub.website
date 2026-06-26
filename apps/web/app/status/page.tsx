'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  description: string;
  lastUpdated: string;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    
    try {
      const checks = await Promise.allSettled([
        fetch('/api/health/db').then(r => r.json()),
        fetch('/api/health/ai').then(r => r.json()),
        fetch('/api/health/storage').then(r => r.json()),
        fetch('/api/health/auth').then(r => r.json())
      ]);

      const statusData: ServiceStatus[] = checks.map((result, index) => {
        const serviceNames = ['Database', 'AI Services', 'Storage', 'Authentication'];
        const baseName = serviceNames[index];
        
        if (result.status === 'fulfilled') {
          return {
            name: baseName,
            status: result.value.status,
            description: result.value.message || 'Service operational',
            lastUpdated: new Date().toISOString()
          };
        } else {
          return {
            name: baseName,
            status: 'major_outage',
            description: 'Service unavailable',
            lastUpdated: new Date().toISOString()
          };
        }
      });

      setServices(statusData);
    } catch (error) {
      logger.error('Status check failed', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallStatus = () => {
    const hasMajorOutage = services.some(s => s.status === 'major_outage');
    const hasPartialOutage = services.some(s => s.status === 'partial_outage');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    if (hasMajorOutage) return 'major_outage';
    if (hasPartialOutage) return 'partial_outage';
    if (hasDegraded) return 'degraded';
    return 'operational';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Wonderland Status</h1>
          <p className="text-slate-400">Last updated: {new Date().toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <span className={`w-3 h-3 rounded-full ${overallStatus === 'operational' ? 'bg-green-400' : overallStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
            <span className="text-lg font-semibold text-white">Overall Status: {overallStatus.toUpperCase().replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(service => (
            <div key={service.name} className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{service.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  service.status === 'operational' ? 'bg-green-900/50 text-green-300' :
                  service.status === 'degraded' ? 'bg-yellow-900/50 text-yellow-300' :
                  service.status === 'partial_outage' ? 'bg-orange-900/50 text-orange-300' :
                  'bg-red-900/50 text-red-300'
                }`}>
                  {service.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">{service.description}</p>
              <p className="text-xs text-slate-500">
                Updated: {new Date(service.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
