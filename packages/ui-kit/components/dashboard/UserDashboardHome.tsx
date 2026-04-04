import React from 'react';
import { Typography } from '../basics/Typography';

export const UserDashboardHome: React.FC = () => (
  <div className="p-6">
    <Typography variant="h1" className="text-3xl font-bold mb-6">Welcome back, User!</Typography>
    <div className="grid grid-cols-3 gap-6">
      <div className="border p-4 rounded shadow-sm">Card 1</div>
      <div className="border p-4 rounded shadow-sm">Card 2</div>
      <div className="border p-4 rounded shadow-sm">Card 3</div>
    </div>
  </div>
);
