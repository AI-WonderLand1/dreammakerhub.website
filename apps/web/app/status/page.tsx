'use client';

import { useState, useEffect } from 'react';
import { logger } from '@lib/logger';

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">System Status</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleString()}</p>
      </div>

      <div className={`status-overall ${overallStatus}`}>
        <div className="status-indicator">
          <span className={`status-dot ${overallStatus}`}></span>
          <span className="status-text">Overall Status: {overallStatus.toUpperCase().replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {services.map(service => (
          <div key={service.name} className={`service-card ${service.status}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{service.name}</h3>
              <span className={`status-badge ${service.status}`}>
                {service.status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
            <p className="text-xs text-gray-400">
              Updated: {new Date(service.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
