import React from 'react';
import { ContactSplit } from '../../components/composite/ContactSplit';
import { Heading } from '../../components/basics/Heading';

export const ContactPage: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <ContactSplit />
  </div>
);
