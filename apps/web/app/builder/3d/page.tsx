import WebGLStudioHost from "../../../components/WebGLStudioHost";
import { logger } from '@/lib/logger';

export default function Builder3DPage() {
  return (
    <div className="h-screen w-full">
      <WebGLStudioHost />
    </div>
  );
}
