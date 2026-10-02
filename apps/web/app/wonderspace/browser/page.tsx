import { redirect } from "next/navigation";
import {
  normalizeWonderSpaceProjectId,
  wonderSpaceProjectFiles,
  WONDERSPACE_CODE_HOME,
} from "@/lib/wonderspace/routes";

// Legacy browser-editor links now preserve the selected project instead of
// dropping users back at a generic dashboard route.
export default async function RetiredWonderSpaceBrowserPicker({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const params = await searchParams;
  const projectId = normalizeWonderSpaceProjectId(params.projectId);
  if (projectId) redirect(wonderSpaceProjectFiles(projectId));
  redirect(WONDERSPACE_CODE_HOME);
}
