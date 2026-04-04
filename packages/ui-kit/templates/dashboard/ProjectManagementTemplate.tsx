import React from 'react';
import { DatabaseTable } from '../../components/data/DatabaseTable';
import { StepProcess } from '../../components/marketing/StepProcess';
import { Progress } from '../../components/basics/Progress';

export const ProjectManagementTemplate: React.FC = () => (
  <div className="space-y-6">
    <Progress />
    <StepProcess />
    <DatabaseTable />
  </div>
);
