import { redirect } from "next/navigation";

export const metadata = {
  title: "3D Assets | AI WONDERLAND",
  description: "Generate and preview GLB assets inside WonderPlay.",
};

export default async function AIGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const query = await searchParams;
  const projectId = typeof query.projectId === "string" ? query.projectId.trim() : "";
  const destination = new URLSearchParams({ tab: "assets", tool: "3d" });
  if (projectId) destination.set("projectId", projectId);
  redirect("/dashboard/3dhub?" + destination.toString());
}
