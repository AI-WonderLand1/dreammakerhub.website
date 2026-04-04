import React from 'react';
import { AnalyticsDashboard } from '../../components/data/AnalyticsDashboard';
import { DatabaseTable } from '../../components/data/DatabaseTable';
import { StatsSection } from '../../components/composite/StatsSection';

export const AnalyticsDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <StatsSection />
    <AnalyticsDashboard />
    <DatabaseTable />
  </div>
);
