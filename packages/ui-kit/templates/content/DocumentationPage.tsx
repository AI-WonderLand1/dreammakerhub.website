import React from 'react';
import { TabbedContent } from '../../components/composite/TabbedContent';
import { BreadcrumbTrail } from '../../components/navigation/BreadcrumbTrail';
import { Heading } from '../../components/basics/Heading';

export const DocumentationPage: React.FC = () => (
  <div className="space-y-6">
    <BreadcrumbTrail />
    <Heading />
    <TabbedContent />
  </div>
);
