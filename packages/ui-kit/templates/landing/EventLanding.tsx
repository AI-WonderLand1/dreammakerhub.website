import React from 'react';
import { ParallaxSection } from '../../components/composite/ParallaxSection';
import { StatsSection } from '../../components/composite/StatsSection';
import { FAQSingleColumn } from '../../components/composite/FAQSingleColumn';

export const EventLanding: React.FC = () => (
  <div className="space-y-20">
    <ParallaxSection />
    <StatsSection />
    <FAQSingleColumn />
  </div>
);
