import React from 'react';
import { CallToActionBox } from '../../components/composite/CallToActionBox';
import { StatsSection } from '../../components/composite/StatsSection';
import { CenterHero } from '../../components/marketing/CenterHero';

export const WaitlistLanding: React.FC = () => (
  <div className="space-y-20">
    <CenterHero />
    <StatsSection />
    <CallToActionBox />
  </div>
);
