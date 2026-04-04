import React from 'react';
import { AuthForm } from '../../components/data/AuthForm';
import { FloatingLabelInput } from '../../components/basics/FloatingLabelInput';
import { Avatar } from '../../components/basics/Avatar';

export const SettingsDashboardTemplate: React.FC = () => (
  <div className="space-y-6">
    <Avatar />
    <FloatingLabelInput />
    <AuthForm />
  </div>
);
