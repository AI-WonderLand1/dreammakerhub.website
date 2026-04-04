import React from 'react';
import { BeforeAfterSlider } from '../../components/composite/BeforeAfterSlider';
import { StatsSection } from '../../components/composite/StatsSection';
import { Heading } from '../../components/basics/Heading';

export const CaseStudy: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <BeforeAfterSlider />
    <StatsSection />
  </div>
);
