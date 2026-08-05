import StudioClient from "./StudioClient";
import { logger } from '@/lib/logger';

async function getData() {
  return {
    content: [{ type: "HeadingBlock", props: { title: "AI Wonderland" } }],
    root: { type: "Fragment", props: {} },
  };
}

export const metadata = {
  title: 'WonderBuild Studio | AI Wonderland',
  description: 'Your AI-powered studio for 3D creation.',
};

export default async function WonderBuildStudioPage() {
  const initialData = await getData();
  return <StudioClient initialData={initialData} />;
}
