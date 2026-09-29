"use client";

import { useParams } from "next/navigation";
import WonderSpaceWorkItemsPanel from "@/components/dashboard/WonderSpaceWorkItemsPanel";

export default function ProjectIssuesPage() {
  const params = useParams();
  return <WonderSpaceWorkItemsPanel projectId={params.id as string} kind="issue" />;
}
