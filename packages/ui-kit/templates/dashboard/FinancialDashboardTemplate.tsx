import React from 'react';
import { AnalyticsDashboard } from '../../components/data/AnalyticsDashboard';
import { SimpleTable } from '../../components/composite/SimpleTable';
import { StatsSection } from '../../components/composite/StatsSection';

export const FinancialDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <StatsSection />
    <AnalyticsDashboard />
    <SimpleTable />
  </div>
);
