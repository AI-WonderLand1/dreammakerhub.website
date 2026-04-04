import React from 'react';
import { MasonryGallery } from '../../components/composite/MasonryGallery';
import { ContactSplit } from '../../components/composite/ContactSplit';
import { CenterHero } from '../../components/marketing/CenterHero';

export const PortfolioLanding: React.FC = () => (
  <div className="space-y-20">
    <CenterHero />
    <MasonryGallery />
    <ContactSplit />
  </div>
);
