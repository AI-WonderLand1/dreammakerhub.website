import React from 'react';
import { Typography } from '../../components/basics/Typography';
import { Heading } from '../../components/basics/Heading';
import { Blockquote } from '../../components/basics/Blockquote';

export const BlogPostDetail: React.FC = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <Heading />
    <Typography />
    <Blockquote />
    <Typography />
  </div>
);
