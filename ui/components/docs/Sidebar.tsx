"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

type MenuItem = {
  title: string;
  href?: string;
  children?: MenuItem[];
};

const menu: MenuItem[] = [
  {
    title: "Accessibility",
    href: "/docs#accessibility",
  },
  {
    title: "Announcements",
    href: "/docs#announcements",
  },
  {
    title: "AI & Copilot",
    children: [
      { title: "Alice and Rick discussions", href: "/docs#alice-rick-discussions" },
      { title: "Alice and Rick updates and announcements", href: "/docs#alice-rick-updates" },
    ],
  },
  {
    title: "Apps, APIs & Webhooks",
    children: [
      { title: "Apps, API and Webhooks", href: "/docs#apps-apis" },
      { title: "Mobile", href: "/docs#mobile" },
    ],
  },
  {
    title: "Automation & Developer tools",
    children: [
      { title: "Actions", href: "/docs#actions" },
      { title: "npm", href: "/docs#npm" },
      { title: "Packages", href: "/docs#packages" },
    ],
  },
  {
    title: "Code & Contributions",
    children: [
      { title: "WonderSpace", href: "/docs#wonderspace" },
      { title: "Pull Requests", href: "/docs#pull-requests" },
      { title: "Repositories", href: "/docs#repositories" },
    ],
  },
  {
    title: "Collaboration & Planning",
    children: [
      { title: "Discussions", href: "/docs#discussions" },
      { title: "Projects and Issues", href: "/docs#projects-issues" },
    ],
  },
  {
    title: "Community Hub",
    children: [
      { title: "Welcome to Ai-wonderland innovation", href: "/community" },
      { title: "New to wonderland", href: "/community#new" },
      { title: "Programming Help", href: "/community#help" },
      { title: "Education & Skilling", href: "/community#education" },
    ],
  },
  {
    title: "Discover: Best Practices",
    children: [
      { title: "Wonder Education", href: "/docs#wonder-education" },
      { title: "Wonder Learn", href: "/docs#wonder-learn" },
    ],
  },
  {
    title: "Enterprise & Security",
    children: [
      { title: "Code Security", href: "/docs#code-security" },
      { title: "Enterprise", href: "/docs#enterprise" },
    ],
  },
  {
    title: "Questions & Other Feedback",
    children: [
      { title: "Other Feature Feedback, Questions, & Ideas", href: "/docs#feedback" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-[#0d0d0f] text-white p-4 overflow-y-auto border-r border-white/10 shrink-0">
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

  const content = (
    <button
      onClick={() => {
        if (hasChildren) setOpen(!open);
        if (item.href && !hasChildren) window.location.href = item.href;
      }}
      className="flex items-center justify-between w-full px-2 py-2 hover:bg-white/10 rounded-md transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-2">
        {hasChildren && (
          <Sparkles className="w-4 h-4 text-pink-300 animate-pulse shrink-0" />
        )}
        <span className="text-sm">{item.title}</span>
      </div>
      {hasChildren &&
        (open ? (
          <ChevronDown className="w-4 h-4 transition-transform duration-200 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform duration-200 shrink-0" />
        ))}
    </button>
  );

  return (
    <li>
      {item.href && !hasChildren ? (
        <a href={item.href} className="block">
          {content}
        </a>
      ) : (
        content
      )}
      {hasChildren && (
        <ul
          className={`ml-4 mt-1 border-l border-white/10 pl-3 space-y-1 transition-all duration-300 overflow-hidden ${
            open ? "opacity-100 max-h-screen" : "opacity-0 max-h-0"
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
