import TemplateLibraryApp from "@/lib/wonder-build/template-library/App";
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'WonderBuild Template Library | AI Wonderland',
  description:
    'Batch prompt studio, template visualizer, AI generator, creator marketplace and deploy suite for WonderBuild website templates.',
};

export default function TemplateLibraryPage() {
  return <TemplateLibraryApp />;
}
