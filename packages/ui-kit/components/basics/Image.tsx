import React from 'react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const Image: React.FC<WonderProps & { src: string; alt: string }> = ({ src, alt, style }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("rounded-lg object-cover", style)}
      referrerPolicy="no-referrer"
    />
  );
};
