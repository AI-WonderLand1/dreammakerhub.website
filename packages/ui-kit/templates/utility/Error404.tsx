import React from 'react';
import { GlitchText } from '../../components/experimental/GlitchText';
import { Heading } from '../../components/basics/Heading';
import { Link } from '../../components/basics/Link';

export const Error404: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-6">
    <GlitchText content="404" />
    <Heading />
    <Link />
  </div>
);
