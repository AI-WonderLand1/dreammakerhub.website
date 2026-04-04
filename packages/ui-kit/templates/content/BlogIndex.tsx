import React from 'react';
import { BlogPreviewGrid } from '../../components/composite/BlogPreviewGrid';
import { SearchBar } from '../../components/navigation/SearchBar';
import { Heading } from '../../components/basics/Heading';

export const BlogIndex: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <SearchBar />
    <BlogPreviewGrid />
  </div>
);
