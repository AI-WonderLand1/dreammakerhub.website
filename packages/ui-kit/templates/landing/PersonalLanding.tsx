import React from 'react';
import { StoryHero } from '../../components/composite/StoryHero';
import { TimelineLayout } from '../../components/composite/TimelineLayout';
import { ContactSplit } from '../../components/composite/ContactSplit';

export const PersonalLanding: React.FC = () => (
  <div className="space-y-20">
    <StoryHero />
    <TimelineLayout />
    <ContactSplit />
  </div>
);
