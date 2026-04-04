import React from 'react';
import { SplitHero } from '../../components/marketing/SplitHero';
import { FeatureGrid } from '../../components/marketing/FeatureGrid';
import { TestimonialGrid } from '../../components/composite/TestimonialGrid';

export const SaaSLanding: React.FC = () => (
  <div className="space-y-20">
    <SplitHero />
    <FeatureGrid />
    <TestimonialGrid />
  </div>
);
