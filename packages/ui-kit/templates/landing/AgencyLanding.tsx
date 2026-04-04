import React from 'react';
import { GlassmorphicHero } from '../../components/composite/GlassmorphicHero';
import { FeatureList } from '../../components/composite/FeatureList';
import { TestimonialCarousel } from '../../components/composite/TestimonialCarousel';

export const AgencyLanding: React.FC = () => (
  <div className="space-y-20">
    <GlassmorphicHero />
    <FeatureList />
    <TestimonialCarousel />
  </div>
);
