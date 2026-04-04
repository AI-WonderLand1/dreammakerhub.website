import React from 'react';
import { RealtimeStream } from '../../components/data/RealtimeStream';
import { JsonTree } from '../../components/data/JsonTree';
import { ModelStatus } from '../../components/ai/ModelStatus';

export const MonitoringDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <ModelStatus />
    <RealtimeStream />
    <JsonTree />
  </div>
);
