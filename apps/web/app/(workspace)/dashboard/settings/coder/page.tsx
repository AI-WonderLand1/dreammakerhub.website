import { redirect } from "next/navigation";
import {
  normalizeWonderSpaceProjectId,
  wonderSpaceProjectIde,
  WONDERSPACE_CODE_HOME,
} from "@/lib/wonderspace/routes";

export default async function RetiredIdeRoute({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const params = await searchParams;
  const projectId = normalizeWonderSpaceProjectId(params.projectId);
  if (projectId) redirect(wonderSpaceProjectIde(projectId));
  redirect(WONDERSPACE_CODE_HOME);
}
