import React from 'react';
import { Button } from '../basics/Button';

export const CloudConnectorForm: React.FC = () => (
  <form className="border rounded-lg p-6 shadow-sm">
    <h2 className="text-2xl font-bold mb-4">Connect Your Cloud</h2>
    <input type="text" placeholder="API Key" className="w-full border p-2 mb-4 rounded" />
    <input type="text" placeholder="Region" className="w-full border p-2 mb-4 rounded" />
    <Button variant="primary" className="w-full">Connect</Button>
  </form>
);
