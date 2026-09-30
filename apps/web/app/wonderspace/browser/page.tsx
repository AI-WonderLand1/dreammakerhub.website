import { redirect } from 'next/navigation';

// The old WonderSpace browser-editor project picker duplicated the dashboard.
// Customers now choose a project once from the dashboard, then open its native
// project file manager/editor directly.
export default function RetiredWonderSpaceBrowserPicker() {
  redirect('/dashboard#projects');
}
