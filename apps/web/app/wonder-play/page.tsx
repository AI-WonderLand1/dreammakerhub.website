import PodLauncher from '@/components/engines/PodLauncher';
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'WonderPlay - 3D Editor',
  description: 'Launch your private PlayCanvas 3D editor pod.',
};

export default function WonderPlayPage() {
  return (
    <PodLauncher
      podType="playcanvas"
      title="WonderPlay"
      icon="&#127918;"
      description="Your private PlayCanvas 3D editor. Create scenes, build games, and ship immersive experiences — all in your own isolated pod."
      templateId="playcanvas-3d"
      accentColor="purple"
      backHref="/wonder-build"
      backLabel="Back to WonderBuild"
    />
  );
}
