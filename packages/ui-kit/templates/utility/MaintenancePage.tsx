import React from 'react';
import { Heading } from '../../components/basics/Heading';
import { Typography } from '../../components/basics/Typography';
import { LoadingSpinner } from '../../components/overlays/LoadingSpinner';

export const MaintenancePage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-6">
    <LoadingSpinner />
    <Heading />
    <Typography />
  </div>
);
