import TemplateLibraryApp from "@/lib/wonder-build/template-library/App";

export const metadata = {
  title: 'Templates | AI Wonderland',
  description:
    'Pick a template, then open it in the WonderBuild canvas to edit and publish. Template library, AI generator, and visual renderer in one place.',
};

export default function TemplatesPage() {
  return <TemplateLibraryApp />;
}