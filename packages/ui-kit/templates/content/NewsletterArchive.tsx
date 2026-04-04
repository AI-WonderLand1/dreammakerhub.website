import React from 'react';
import { BlogPreviewGrid } from '../../components/composite/BlogPreviewGrid';
import { NewsletterStrip } from '../../components/composite/NewsletterStrip';
import { Heading } from '../../components/basics/Heading';

export const NewsletterArchive: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <BlogPreviewGrid />
    <NewsletterStrip />
  </div>
);
