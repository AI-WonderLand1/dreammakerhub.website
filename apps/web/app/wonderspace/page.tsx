import PodLauncher from '@/components/engines/PodLauncher';

export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private cloud development workspace.',
};

export default function WonderSpacePage() {
  return (
    <PodLauncher
      podType="ide"
      title="WonderSpace"
      icon="&#128187;"
      description="Your private cloud workspace with VS Code, terminal, Git, and AI coding tools."
      templateId="wonderspace-ide"
      accentColor="blue"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
