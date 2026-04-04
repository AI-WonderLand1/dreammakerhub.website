import React from 'react';
import { ProductShowcaseHero } from '../../components/composite/ProductShowcaseHero';
import { FeatureGrid } from '../../components/marketing/FeatureGrid';
import { PricingTable } from '../../components/marketing/PricingTable';

export const ProductLaunchLanding: React.FC = () => (
  <div className="space-y-20">
    <ProductShowcaseHero />
    <FeatureGrid />
    <PricingTable />
  </div>
);
