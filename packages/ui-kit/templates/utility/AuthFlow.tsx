import React from 'react';
import { AuthForm } from '../../components/data/AuthForm';
import { Heading } from '../../components/basics/Heading';

export const AuthFlow: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-6">
    <Heading />
    <AuthForm />
  </div>
);
