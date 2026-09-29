"use client";

import { useParams } from "next/navigation";
import WonderSpaceWorkItemsPanel from "@/components/dashboard/WonderSpaceWorkItemsPanel";

export default function ProjectDiscussionsPage() {
  const params = useParams();
  return <WonderSpaceWorkItemsPanel projectId={params.id as string} kind="discussion" />;
}
