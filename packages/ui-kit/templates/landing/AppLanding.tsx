import React from 'react';
import { VideoHero } from '../../components/composite/VideoHero';
import { FeatureGrid } from '../../components/marketing/FeatureGrid';
import { UserReviewSummary } from '../../components/composite/UserReviewSummary';

export const AppLanding: React.FC = () => (
  <div className="space-y-20">
    <VideoHero />
    <FeatureGrid />
    <UserReviewSummary />
  </div>
);
