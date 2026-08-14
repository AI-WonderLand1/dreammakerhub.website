"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Folder,
  Code2,
  Settings,
  Zap,
  BarChart3,
  Users,
  HelpCircle,
  Boxes,
  Sparkles,
  ArrowRight
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  type: string;
  updated_at: string;
};

const PROJECT_ICONS: Record<string, React.ElementType> = {
  wonderbuild: Folder,
  wonderbuild_ui: Folder,
  game: Boxes,
  "3d_scene": Boxes,
  web_app: Code2,
  workspace: Code2,
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/dashboard/projects");
      return;
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/public-pages/auth");
        return;
      }
      setUserEmail(user?.email || null);
      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {loading ? (
          <p className="text-sm text-white/50 animate-pulse">Loading your workspace...</p>
        ) : (
          <p className="text-sm text-white/50">
            Welcome back{userEmail ? `, ${userEmail}` : ""}! Choose an action below to get started.
          </p>
        )}
      </div>

      <a
        href="/templates"
        className="group mb-6 block rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 via-transparent to-cyan-500/10 p-6 transition hover:border-violet-400/60 hover:bg-violet-600/10"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-white">Start from a template</div>
            <div className="text-sm text-white/60">Pick a template, then build and publish in one canvas — no hub needed.</div>
          </div>
          <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
        </div>
      </a>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <a href="/dashboard/projects" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Folder className="w-8 h-8 mb-2 text-blue-400" />
          <div className="font-medium">Projects</div>
          <div className="text-xs text-white/50">View & manage your projects</div>
        </a>
        
        <a href="/dashboard/3dhub" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Boxes className="w-8 h-8 mb-2 text-cyan-400" />
          <div className="font-medium">3DHub Studio</div>
          <div className="text-xs text-white/50">AI 3D factory, 360 view & more</div>
        </a>
        
        <a href="/ide" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Code2 className="w-8 h-8 mb-2 text-cyan-400" />
          <div className="font-medium">WonderSpace IDE</div>
          <div className="text-xs text-white/50">Cloud workspace</div>
        </a>
        
        <a href="/dashboard/usage" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <BarChart3 className="w-8 h-8 mb-2 text-green-400" />
          <div className="font-medium">Usage</div>
          <div className="text-xs text-white/50">Token limits & billing</div>
        </a>
      </div>
    </div>
  );
}
