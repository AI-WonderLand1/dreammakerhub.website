import React from 'react';
import { Typography } from '../basics/Typography';

export const MaintenanceMode: React.FC = () => (
  <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center">
    <Typography variant="h1" className="text-4xl font-bold mb-4">We'll be back soon!</Typography>
    <p>We are currently performing scheduled maintenance.</p>
  </div>
);
