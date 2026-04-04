import React from 'react';
import { AccordionFAQ } from '../../components/composite/AccordionFAQ';
import { DatabaseTable } from '../../components/data/DatabaseTable';
import { ErrorBanner } from '../../components/overlays/ErrorBanner';

export const SupportDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <ErrorBanner />
    <DatabaseTable />
    <AccordionFAQ />
  </div>
);
