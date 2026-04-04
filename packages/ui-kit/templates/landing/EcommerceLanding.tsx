import React from 'react';
import { ProductShowcaseHero } from '../../components/composite/ProductShowcaseHero';
import { SimpleTable } from '../../components/composite/SimpleTable';
import { PricingTable } from '../../components/marketing/PricingTable';

export const EcommerceLanding: React.FC = () => (
  <div className="space-y-20">
    <ProductShowcaseHero />
    <SimpleTable />
    <PricingTable />
  </div>
);
