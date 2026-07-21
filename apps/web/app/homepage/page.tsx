export const metadata = {
  title: "AI Wonderland - Build Anything with AI",
  description: "Build websites, 3D games, and interactive experiences from natural language prompts. No coding required.",
  openGraph: {
    title: "AI Wonderland - Build Anything with AI",
    description: "Build websites, 3D games, and interactive experiences from natural language prompts.",
    url: "https://ai-wonderland.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Wonderland - Build Anything with AI",
    description: "Build websites, 3D games, and interactive experiences from natural language prompts.",
  },
};

import Homepage from "./Homepage";
import { logger } from '@/lib/logger';

export default function HomepagePage() {
  return <Homepage />;
}
