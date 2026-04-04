import React from 'react';
import { TypewriterHero } from '../../components/experimental/TypewriterHero';
import { NewsletterStrip } from '../../components/composite/NewsletterStrip';

export const ComingSoon: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-10">
    <TypewriterHero content="Coming Soon..." />
    <NewsletterStrip />
  </div>
);
