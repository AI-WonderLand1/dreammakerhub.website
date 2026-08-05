import WebGLStudioHost from "../../../components/WebGLStudioHost";
import { logger } from '@/lib/logger';

export const metadata = {
  title: '3D Builder | AI Wonderland',
  description: 'Build immersive 3D experiences with the AI-powered builder.',
};

export default function Builder3DPage() {
  return (
    <div className="h-screen w-full">
      <WebGLStudioHost />
    </div>
  );
}
