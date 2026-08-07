import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'AI Builder | AI Wonderland',
  description: 'Describe what you want and let AI build it for you.',
};

export default function BuilderAIPage() {
  redirect("/wonder-build");
}
