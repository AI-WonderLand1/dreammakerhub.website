import React from 'react';
import { Button } from '../basics/Button';

export const CookieBanner: React.FC = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center">
    <p>We use cookies to improve your experience.</p>
    <Button variant="primary" size="sm">Accept</Button>
  </div>
);
