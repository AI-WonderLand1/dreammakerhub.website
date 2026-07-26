"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  Folder, 
  Pencil, 
  Play, 
  Code2, 
  Settings,
  Zap,
  BarChart3,
  Users,
  HelpCircle
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  type: string;
  updated_at: string;
};

const PROJECT_ICONS: Record<string, React.ElementType> = {
  wonderbuild: Pencil,
  wonderbuild_ui: Pencil,
  game: Play,
  "3d_scene": Play,
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

      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, type, updated_at")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (!projects || projects.length === 0) {
        router.replace("/dashboard/projects");
      } else {
        setLoading(false);
      }
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <a href="/dashboard/projects" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Folder className="w-8 h-8 mb-2 text-blue-400" />
          <div className="font-medium">Projects</div>
          <div className="text-xs text-white/50">View & manage your projects</div>
        </a>
        
        <a href="/wonder-build/agent" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Pencil className="w-8 h-8 mb-2 text-purple-400" />
          <div className="font-medium">Wonderbuild</div>
          <div className="text-xs text-white/50">AI-powered builder</div>
        </a>
        
        <a href="/wonder-build/playcanvas" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <Play className="w-8 h-8 mb-2 text-pink-400" />
          <div className="font-medium">Wonderplay</div>
          <div className="text-xs text-white/50">3D game engine</div>
        </a>
        
        <a href="/wonderspace/ide" className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
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
