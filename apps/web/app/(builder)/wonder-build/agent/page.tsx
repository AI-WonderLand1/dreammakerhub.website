import { redirect } from 'next/navigation';

export default function WonderBuildAgentRedirect() {
  redirect('/wonder-build?mode=ai#ai-start');
}
