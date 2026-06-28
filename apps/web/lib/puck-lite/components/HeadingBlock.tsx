"use client";

export type HeadingBlockProps = {
  title: string;
};

export default function HeadingBlock({ title }: HeadingBlockProps) {
  return (
    <div className="p-6" data-block="heading">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
    </div>
  );
}
