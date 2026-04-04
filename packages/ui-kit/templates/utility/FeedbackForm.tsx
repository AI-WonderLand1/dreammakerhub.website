import React from 'react';
import { FloatingLabelInput } from '../../components/basics/FloatingLabelInput';
import { Heading } from '../../components/basics/Heading';
import { Button } from '../../components/basics/Button';

export const FeedbackForm: React.FC = () => (
  <div className="space-y-6 max-w-lg mx-auto">
    <Heading />
    <FloatingLabelInput />
    <Button />
  </div>
);
