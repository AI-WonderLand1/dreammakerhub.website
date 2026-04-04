import React from 'react';
import { FormWizard } from '../../components/interactive/FormWizard';
import { Heading } from '../../components/basics/Heading';

export const OnboardingWizard: React.FC = () => (
  <div className="space-y-10 max-w-2xl mx-auto">
    <Heading />
    <FormWizard />
  </div>
);
