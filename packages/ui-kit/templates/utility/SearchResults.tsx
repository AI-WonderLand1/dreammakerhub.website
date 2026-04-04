import React from 'react';
import { SearchBar } from '../../components/navigation/SearchBar';
import { DatabaseTable } from '../../components/data/DatabaseTable';
import { Heading } from '../../components/basics/Heading';

export const SearchResults: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <SearchBar />
    <DatabaseTable />
  </div>
);
