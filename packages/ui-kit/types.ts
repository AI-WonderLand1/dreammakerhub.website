import React from 'react';

export interface WonderProps {
  id: string;
  type: string;
  content?: string;
  style?: string;
  config?: any;
  children?: React.ReactNode;
  supabaseClient?: any;
}
