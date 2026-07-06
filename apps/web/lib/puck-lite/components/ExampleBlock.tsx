"use client";

type ExampleBlockProps = {
  body: string;
};

export type { ExampleBlockProps };

export default function ExampleBlock({ body }: ExampleBlockProps) {
  return <div className="prose prose-invert max-w-none text-sm leading-6">{body}</div>;
}
