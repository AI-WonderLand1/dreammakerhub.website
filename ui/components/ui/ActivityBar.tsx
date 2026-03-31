"use client";

import { File, Search, GitPullRequest, Layers } from "lucide-react";

export default function ActivityBar() {
  return (
    <aside className="w-12 bg-[#060015] border-r border-fuchsia-900/40 flex flex-col items-center py-3 space-y-3">
      <button title="Explorer" className="p-2 rounded hover:bg-fuchsia-900/30">
        <File size={18} />
      </button>
      <button title="Search" className="p-2 rounded hover:bg-fuchsia-900/30">
        <Search size={18} />
      </button>
      <button title="Source Control" className="p-2 rounded hover:bg-fuchsia-900/30">
        <GitPullRequest size={18} />
      </button>
      <button title="Extensions" className="p-2 rounded hover:bg-fuchsia-900/30">
        <Layers size={18} />
      </button>
    </aside>
  );
}
