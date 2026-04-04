import React from 'react';
import { Avatar } from '../../components/basics/Avatar';
import { Heading } from '../../components/basics/Heading';
import { Typography } from '../../components/basics/Typography';

export const AuthorProfile: React.FC = () => (
  <div className="flex flex-col items-center space-y-6">
    <Avatar />
    <Heading />
    <Typography />
  </div>
);
