import React from 'react';
import { AnalyticsDashboard } from '../../components/data/AnalyticsDashboard';
import { NewsletterStrip } from '../../components/composite/NewsletterStrip';
import { FeatureHighlightList } from '../../components/composite/FeatureHighlightList';

export const MarketingDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <AnalyticsDashboard />
    <FeatureHighlightList />
    <NewsletterStrip />
  </div>
);
