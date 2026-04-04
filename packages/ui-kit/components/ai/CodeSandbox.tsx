import React from 'react';
import { Button } from '../basics/Button';
import { Typography } from '../basics/Typography';

export const CodeSandbox: React.FC = () => (
  <div className="border rounded-lg p-4 bg-gray-900 text-white font-mono text-sm">
    <div className="flex justify-between mb-2">
      <span>Code</span>
      <Button variant="secondary" size="sm">Run</Button>
    </div>
    <pre className="overflow-x-auto"><code>// AI generated code here...</code></pre>
  </div>
);
