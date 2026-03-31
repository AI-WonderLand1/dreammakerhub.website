import Link from "next/link";

import { Breadcrumbs } from "@/app/components/navigation/Breadcrumbs";
import { PageHeader } from "@/app/components/layout/PageHeader";
import Topbar from "../components/Topbar";
import { PuckEditorClient } from "./PuckEditorClient";

async function getData() {
  return {
    content: [{ type: "HeadingBlock", props: { title: "AI Wonderland" } }],
  };
}

export default async function WonderBuildPuckPage() {
  const initialData = await getData();

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        lead={<Breadcrumbs items={[{ href: "/wonder-build", label: "Wonder Build" }, { label: "Puck" }]} />}
        title="Puck Layout Studio"
        subtitle="Create and iterate on reusable page sections with real-time block previews."
        action={
          <Link
            href="/wonder-build"
            className="inline-flex h-10 items-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-black"
          >
            Back to Wonder Build
          </Link>
        }
      />
      <Topbar />
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <PuckEditorClient initialData={initialData} />
      </div>
    </div>
  );
}
