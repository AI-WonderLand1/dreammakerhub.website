import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'WonderBuild Mobile | AI Wonderland',
  description: 'Create and manage projects on the go with WonderBuild Mobile.',
};

export default function WonderBuildMobilePage() {
  redirect("/wonder-build/playcanvas");
}
