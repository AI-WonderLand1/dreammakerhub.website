import { redirect } from 'next/navigation';

// Retired customer-facing entrypoint. The old Railway Sandbox pilot has no
// deployed controller and must not compete with the Coder-backed IDE path.
// Keep its disabled APIs and infrastructure source intact for audit/rollback;
// direct bookmarks return to the canonical WonderSpace page.
export default function RetiredOnDemandIde() {
  redirect('/wonderspace');
}
