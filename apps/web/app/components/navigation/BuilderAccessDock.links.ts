import { Layout, Code, Terminal, Database } from "lucide-react";

export const builderLinks = [
  {
    name: "Wonder-Build",
    href: "/wonder-build",
    icon: Layout,
    description: "Visual 3D Canvas Editor"
  },
  {
    name: "Cloud IDE",
    href: "/ide",
    icon: Code,
    description: "Full cloud-based development environment (code-server)"
  },
  {
    name: "Playground",
    href: "/playground",
    icon: Terminal,
    description: "Isolated API and Logic Testing"
  },
  {
    name: "Data Vault",
    href: "/settings/cloud-storage",
    icon: Database,
    description: "Manage BYOC storage connections"
  }
];