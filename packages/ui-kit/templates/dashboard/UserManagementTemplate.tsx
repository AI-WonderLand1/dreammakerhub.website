import React from 'react';
import { AuthForm } from '../../components/data/AuthForm';
import { UserPresence } from '../../components/data/UserPresence';
import { DatabaseTable } from '../../components/data/DatabaseTable';

export const UserManagementTemplate: React.FC = () => (
  <div className="space-y-6">
    <UserPresence />
    <DatabaseTable />
    <AuthForm />
  </div>
);
