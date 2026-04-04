import React from 'react';
import { DatabaseTable } from '../../components/data/DatabaseTable';
import { BucketGallery } from '../../components/data/BucketGallery';
import { StatsSection } from '../../components/composite/StatsSection';

export const InventoryDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <StatsSection />
    <DatabaseTable />
    <BucketGallery />
  </div>
);
