import React from 'react';
import { NewsletterStrip } from '../../components/composite/NewsletterStrip';
import { FeatureHighlightList } from '../../components/composite/FeatureHighlightList';
import { MicroHero } from '../../components/marketing/MicroHero';

export const NewsletterLanding: React.FC = () => (
  <div className="space-y-20">
    <MicroHero />
    <FeatureHighlightList />
    <NewsletterStrip />
  </div>
);
