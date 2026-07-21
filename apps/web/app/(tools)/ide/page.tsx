import PodLauncher from '@/components/engines/PodLauncher';
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'WonderSpace IDE',
  description: 'Launch your private cloud IDE workspace.',
};

export default function WonderSpaceIDEPage() {
  return (
    <PodLauncher
      podType="ide"
      title="WonderSpace IDE"
      icon="&#128187;"
      description="Your private cloud workspace with VS Code, terminal, and git — just like GitHub Codespaces."
      templateId="wonderspace-ide"
      accentColor="blue"
      backHref="/wonderspace"
      backLabel="Back to WonderSpace"
    />
  );
}
