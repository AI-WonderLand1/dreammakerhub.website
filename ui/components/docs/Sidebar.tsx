"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

type MenuItem = {
  title: string;
  children?: MenuItem[];
};

const menu: MenuItem[] = [
  {
    title: "WonderAgent",
    children: [
      {
        title: "Agent Overview",
        children: [
          { title: "What is WonderAgent?" },
          { title: "Core Components" },
          { title: "How WonderAgent Thinks" },
          { title: "Multi-Step Reasoning Flow" },
        ],
      },
      {
        title: "Models",
        children: [
          { title: "Available Reasoning Models" },
          { title: "Model Behavior" },
          { title: "Model Switching Rules" },
        ],
      },
      {
        title: "Agent Modes & Settings",
        children: [
          { title: "Planning Mode" },
          { title: "Fast Mode" },
          { title: "Review Policies" },
          { title: "Terminal Execution Rules" },
          { title: "File Access Permissions" },
        ],
      },
      {
        title: "Rules & Workflows",
        children: [
          { title: "Rules Overview" },
          { title: "Global Rules" },
          { title: "Workspace Rules" },
          { title: "Rule Activation Types" },
          { title: "@ Mentions" },
          { title: "Workflows Overview" },
          { title: "Creating Workflows" },
          { title: "Executing Workflows" },
        ],
      },
    ],
  },

  {
    title: "WonderBuild",
    children: [
      {
        title: "Builder Overview",
        children: [
          { title: "What is WonderBuild?" },
          { title: "Multi-Platform Support" },
          { title: "How the Builder Works" },
        ],
      },
      {
        title: "Components",
        children: [
          { title: "Box" },
          { title: "Text" },
          { title: "Image" },
          { title: "Button" },
          { title: "Row (HStack)" },
          { title: "Column (VStack)" },
        ],
      },
      {
        title: "Canvases",
        children: [
          { title: "WebCanvas" },
          { title: "AndroidCanvas" },
          { title: "IOSCanvas" },
          { title: "MultiCanvas" },
        ],
      },
      {
        title: "Builder Engine",
        children: [
          { title: "LayoutTree" },
          { title: "DragEngine" },
          { title: "Node Metadata" },
          { title: "Selection Logic" },
        ],
      },
    ],
  },

  {
    title: "WonderSpace",
    children: [
      {
        title: "Workspace Overview",
        children: [
          { title: "AI Assistant Panel" },
          { title: "Project Navigation" },
        ],
      },
      {
        title: "Terminal",
        children: [
          { title: "Command History" },
          { title: "Autocomplete" },
          { title: "Safety Rules" },
        ],
      },
      {
        title: "Files & Source Control",
        children: [
          { title: "File Explorer" },
          { title: "Review Changes" },
          { title: "Source Control Integration" },
        ],
      },
      {
        title: "Editor",
        children: [
          { title: "Tabs" },
          { title: "Commands" },
          { title: "Agent Side Panel" },
          { title: "Changes Sidebar" },
        ],
      },
    ],
  },

  {
    title: "Utilities",
    children: [
      {
        title: "Scripts",
        children: [
          { title: "find_dupes.py" },
          { title: "Backup & Restore" },
          { title: "Performance Tips" },
        ],
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-[#0d0d0f] text-white p-4 overflow-y-auto border-r border-white/10">
      <h1 className="text-xl font-bold mb-4 text-pink-400 tracking-wide">
        WONDERLAND DOCS
      </h1>
      <MenuList items={menu} />
    </aside>
  );
}

function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <MenuNode key={i} item={item} />
      ))}
    </ul>
  );
}

function MenuNode({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className="flex items-center justify-between w-full px-2 py-2 hover:bg-white/10 rounded-md transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
          )}
          <span>{item.title}</span>
        </div>

        {hasChildren &&
          (open ? (
            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform duration-200" />
          ))}
      </button>

      {hasChildren && (
        <ul
          className={`ml-4 mt-1 border-l border-white/10 pl-3 space-y-1 transition-all duration-300 ${
            open ? "opacity-100 max-h-screen" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          {item.children!.map((child, i) => (
            <MenuNode key={i} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
