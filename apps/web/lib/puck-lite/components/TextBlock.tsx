import * as React from 'react';

export default function TextBlock({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}
