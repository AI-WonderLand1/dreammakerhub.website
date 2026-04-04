import React from 'react';
import { Heading } from '../../components/basics/Heading';
import { Typography } from '../../components/basics/Typography';
import { Badge } from '../../components/basics/Badge';

export const PressRelease: React.FC = () => (
  <div className="space-y-6 max-w-2xl mx-auto">
    <Badge />
    <Heading />
    <Typography />
  </div>
);
