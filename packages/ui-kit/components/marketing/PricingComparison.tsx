import React from 'react';
import { Button } from '../basics/Button';

export const PricingComparison: React.FC = () => (
  <div className="grid grid-cols-3 gap-4 p-4">
    {['Basic', 'Pro', 'Enterprise'].map(tier => (
      <div key={tier} className="border rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-2">{tier}</h3>
        <p className="text-3xl font-bold mb-4">$XX</p>
        <ul className="mb-6">
          <li>Feature 1</li>
          <li>Feature 2</li>
        </ul>
        <Button variant="primary" className="w-full">Select</Button>
      </div>
    ))}
  </div>
);
