import { redirect } from "next/navigation";
import {
  normalizeWonderSpaceProjectId,
  wonderSpaceProjectIde,
  WONDERSPACE_CODE_HOME,
} from "@/lib/wonderspace/routes";

export default async function CustomerWorkspaceCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const params = await searchParams;
  const projectId = normalizeWonderSpaceProjectId(params.projectId);

  if (projectId) redirect(wonderSpaceProjectIde(projectId));

  // The old standalone creation form is retired. WonderSpace creation,
  // saved IDEs, resource editing, and deletion now live on the project IDE page.
  redirect(WONDERSPACE_CODE_HOME);
}
