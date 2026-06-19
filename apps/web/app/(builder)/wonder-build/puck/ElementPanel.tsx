"use client";

import { useState, useMemo } from "react";
import {
  Search, LayoutPanelTop, Image, Puzzle, Sparkles, Type,
  MousePointerClick, Heading1, Quote, CheckSquare, ToggleLeft,
  SlidersHorizontal, UserCircle, Link, Minus, PanelTop, PanelBottom,
  Columns2, GlassWater, Layers, SplitSquareHorizontal, TextSelect,
  Video, LayoutGrid, Cloud, ScrollText, Grid3x3, LogIn, Mail,
  MessageSquare, Newspaper, Map, Code, FileJson, Table, Radio,
  BookOpen, Monitor, Wand2, Menu, CircleDot, Command, Keyboard,
  BadgeCheck, Percent, Star, Wrench, Bell, Globe, Share2,
  MoveVertical, Navigation, AlertTriangle, Activity, GitBranch,
  Cookie, List, Users, PanelRight, AppWindow, Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconComponents: Record<string, React.ElementType> = {
  LayoutPanelTop, Image, Puzzle, Sparkles,
  Type, MousePointerClick, Heading1, Quote, CheckSquare,
  ToggleLeft, SlidersHorizontal, UserCircle, Link, Minus,
  PanelTop, PanelBottom, Columns2, GlassWater, Layers,
  SplitSquareHorizontal, TextSelect, Video, LayoutGrid,
  Cloud, ScrollText, Grid3x3, LogIn, Mail, MessageSquare,
  Newspaper, Map, Code, FileJson, Table, Radio,
  BookOpen, Monitor, Wand2, Menu,
  CircleDot, Command, Keyboard, BadgeCheck,
  Percent, Star, Search, Wrench, Bell, Globe, Share2,
  MoveVertical, Navigation, AlertTriangle, Activity, GitBranch,
  Cookie, List, Users, PanelRight, AppWindow, Loader,
};

export const componentIcons: Record<string, string> = {
  button: "MousePointerClick",
  input: "Keyboard",
  typography: "Type",
  badge: "BadgeCheck",
  heading: "Heading1",
  blockquote: "Quote",
  checkbox: "CheckSquare",
  radioGroup: "Radio",
  switch: "ToggleLeft",
  slider: "SlidersHorizontal",
  floatingLabelInput: "Keyboard",
  skeleton: "Loader",
  progress: "Percent",
  tooltip: "MessageSquare",
  avatar: "UserCircle",
  dotIndicator: "CircleDot",
  kbd: "Command",
  divider: "Minus",
  iconWrapper: "Star",
  link: "Link",
  stickyHeader: "PanelTop",
  multiColumnFooter: "PanelBottom",
  contactSplit: "Columns2",
  glassmorphicHero: "GlassWater",
  parallaxSection: "Layers",
  beforeAfterSlider: "SplitSquareHorizontal",
  floatingCTA: "Navigation",
  splitHero: "Columns2",
  centerHero: "TextSelect",
  microHero: "TextSelect",
  videoHero: "Video",
  productShowcaseHero: "Monitor",
  storyHero: "BookOpen",
  videoPlayer: "Video",
  imageLightbox: "Image",
  masonryGallery: "LayoutGrid",
  logoCloud: "Cloud",
  logoMarquee: "ScrollText",
  logoGridStatic: "Grid3x3",
  formWizard: "Wand2",
  authForm: "LogIn",
  cloudConnectorForm: "Cloud",
  contactPage: "Mail",
  feedbackForm: "MessageSquare",
  newsletterStrip: "Newspaper",
  interactiveMap: "Map",
  codeSandbox: "Code",
  jsonTree: "FileJson",
  databaseTable: "Table",
  realtimeStream: "Radio",
  pricingTable: "LayoutPanelTop",
  featureGrid: "LayoutGrid",
  testimonialCard: "MessageSquare",
  stepProcess: "Layers",
  ctaBox: "Sparkles",
  accordionFAQ: "Menu",
  teamGrid: "Users",
  statsSection: "LayoutPanelTop",
  glassAccordion: "Menu",
  hoverCard: "Star",
  tabsSystem: "LayoutGrid",
  confettiExplosion: "Sparkles",
  glitchText: "Sparkles",
  typewriterHero: "TextSelect",
  particleCanvas: "LayoutPanelTop",
  cardHover: "Star",
  loadingSpinner: "Loader",
  successMessage: "BadgeCheck",
  errorBanner: "AlertTriangle",
  thoughtBubble: "MessageSquare",
  agentTerminal: "Monitor",
  logicFlow: "GitBranch",
  modelStatus: "Activity",
  promptInput: "Keyboard",
  contextChip: "BadgeCheck",
  megaMenu: "Menu",
  breadcrumbTrail: "List",
  paginationControls: "List",
  sideCommandPalette: "Command",
  languageSwitcher: "Globe",
  mobileDrawer: "Menu",
  searchBar: "Search",
  progressBar: "Percent",
  scrollIndicator: "MoveVertical",
  socialLinks: "Share2",
  parallaxScrollContainer: "Layers",
  customCursor: "MousePointerClick",
  draggableCard: "Star",
  glassModal: "AppWindow",
  slideOverPanel: "PanelRight",
  notificationToast: "Bell",
  confettiTrigger: "Sparkles",
  floatingDock: "Navigation",
  tooltipOverlay: "MessageSquare",
  contextMenu: "Menu",
  analyticsDashboard: "LayoutPanelTop",
  userDashboardHome: "LayoutPanelTop",
  voiceVisualizer: "Activity",
  spotlightEffect: "Search",
  maintenanceMode: "Wrench",
  cookieBanner: "Cookie",
  pricingComparison: "LayoutPanelTop",
  comparisonTable: "Table",
  featureHighlightList: "Star",
  testimonialCarousel: "MessageSquare",
  userReviewSummary: "MessageSquare",
  faqSingleColumn: "Menu",
  callToActionBox: "Sparkles",
  videoBackgroundSection: "Video",
  timelineLayout: "Layers",
  tabbedContent: "LayoutGrid",
  simpleTable: "Table",
  featureList: "List",
  iconGrid: "Grid3x3",
  blogPreviewGrid: "LayoutGrid",
};

export const componentDescriptions: Record<string, string> = {
  button: "Clickable action button with variants",
  input: "Text input field with label",
  typography: "Paragraph text block",
  badge: "Small status indicator badge",
  heading: "Section heading with size options",
  blockquote: "Quoted text block",
  checkbox: "Checkbox input with label",
  radioGroup: "Radio button group",
  switch: "Toggle switch control",
  slider: "Range slider input",
  floatingLabelInput: "Input with animated floating label",
  skeleton: "Loading placeholder animation",
  progress: "Progress bar indicator",
  tooltip: "Hover tooltip popover",
  avatar: "User avatar with initials",
  dotIndicator: "Status dot indicator",
  kbd: "Keyboard shortcut display",
  divider: "Horizontal divider line",
  iconWrapper: "Icon container wrapper",
  link: "Hyperlink anchor element",
  stickyHeader: "Sticky navigation header bar",
  multiColumnFooter: "Multi-column page footer",
  contactSplit: "Split contact form layout",
  glassmorphicHero: "Glassmorphism hero section",
  parallaxSection: "Parallax scrolling section",
  beforeAfterSlider: "Before/after comparison slider",
  floatingCTA: "Floating call-to-action button",
  splitHero: "Two-column hero layout",
  centerHero: "Centered hero section",
  microHero: "Compact hero banner",
  videoHero: "Hero with video background",
  productShowcaseHero: "Product showcase hero",
  storyHero: "Storytelling hero section",
  videoPlayer: "Video player component",
  imageLightbox: "Image lightbox viewer",
  masonryGallery: "Masonry image gallery",
  logoCloud: "Logo cloud display",
  logoMarquee: "Scrolling logo marquee",
  logoGridStatic: "Static logo grid",
  formWizard: "Multi-step form wizard",
  authForm: "Authentication form",
  cloudConnectorForm: "Cloud integration form",
  contactPage: "Contact page layout",
  feedbackForm: "User feedback form",
  newsletterStrip: "Newsletter signup strip",
  interactiveMap: "Interactive map embed",
  codeSandbox: "Code sandbox embed",
  jsonTree: "JSON data tree viewer",
  databaseTable: "Database table display",
  realtimeStream: "Realtime data stream",
  pricingTable: "Pricing plan comparison",
  featureGrid: "Feature grid display",
  testimonialCard: "Customer testimonial card",
  stepProcess: "Step-by-step process",
  ctaBox: "Call-to-action banner",
  accordionFAQ: "Accordion FAQ section",
  blogPreviewGrid: "Blog post preview grid",
  teamGrid: "Team member grid",
  statsSection: "Statistics display section",
  glassAccordion: "Glass-style accordion",
  hoverCard: "Hover preview card",
  tabsSystem: "Tabbed content system",
  confettiExplosion: "Celebration confetti effect",
  glitchText: "Glitch text animation",
  typewriterHero: "Typewriter text effect",
  particleCanvas: "Particle animation canvas",
  iconGrid: "Icon feature grid",
  cardHover: "Hover-animated card",
  loadingSpinner: "Loading spinner",
  successMessage: "Success status message",
  errorBanner: "Error alert banner",
  thoughtBubble: "AI thought bubble",
  agentTerminal: "AI agent terminal",
  logicFlow: "Logic flow diagram",
  modelStatus: "AI model status indicator",
  promptInput: "AI prompt input",
  contextChip: "Context chip badge",
  megaMenu: "Mega navigation menu",
  breadcrumbTrail: "Breadcrumb navigation",
  paginationControls: "Page pagination controls",
  sideCommandPalette: "Command palette sidebar",
  languageSwitcher: "Language selector",
  mobileDrawer: "Mobile navigation drawer",
  searchBar: "Search bar with input",
  progressBar: "Progress bar indicator",
  scrollIndicator: "Scroll progress indicator",
  socialLinks: "Social media links",
  cookieBanner: "Cookie consent banner",
  pricingComparison: "Detailed pricing comparison",
  comparisonTable: "Feature comparison table",
  featureHighlightList: "Feature highlight list",
  testimonialCarousel: "Testimonial carousel",
  userReviewSummary: "User review summary",
  faqSingleColumn: "Single column FAQ",
  callToActionBox: "CTA action box",
  videoBackgroundSection: "Section with video background",
  timelineLayout: "Timeline layout",
  tabbedContent: "Tabbed content view",
  simpleTable: "Simple data table",
};

export const categories = {
  layout: { title: "Layout", icon: "LayoutPanelTop", components: ["stickyHeader", "multiColumnFooter", "contactSplit", "glassmorphicHero", "parallaxSection", "beforeAfterSlider", "floatingCTA", "splitHero", "centerHero", "microHero", "timelineLayout", "tabbedContent"] },
  media: { title: "Media", icon: "Image", components: ["videoPlayer", "imageLightbox", "masonryGallery", "logoCloud", "logoMarquee", "logoGridStatic", "videoHero", "videoBackgroundSection", "iconGrid"] },
  forms: { title: "Forms", icon: "Keyboard", components: ["input", "floatingLabelInput", "checkbox", "radioGroup", "switch", "slider", "formWizard", "authForm", "cloudConnectorForm", "contactPage", "feedbackForm", "newsletterStrip", "searchBar"] },
  embeds: { title: "Embeds", icon: "Puzzle", components: ["interactiveMap", "codeSandbox", "jsonTree", "databaseTable", "realtimeStream"] },
  advanced: { title: "Advanced", icon: "Sparkles", components: ["glassModal", "slideOverPanel", "notificationToast", "confettiTrigger", "floatingDock", "tooltipOverlay", "contextMenu", "confettiExplosion", "glitchText", "typewriterHero", "particleCanvas", "spotlightEffect", "voiceVisualizer", "parallaxScrollContainer", "customCursor", "loadingSpinner", "successMessage", "errorBanner"] },
  basics: { title: "Basic", icon: "Type", components: ["button", "heading", "typography", "badge", "blockquote", "divider", "link", "avatar", "dotIndicator", "kbd", "iconWrapper", "tooltip", "skeleton", "progress"] },
  marketing: { title: "Marketing", icon: "Star", components: ["pricingTable", "featureGrid", "testimonialCard", "stepProcess", "statsSection", "ctaBox", "pricingComparison", "comparisonTable", "featureHighlightList", "testimonialCarousel", "userReviewSummary", "faqSingleColumn", "callToActionBox", "productShowcaseHero", "storyHero", "cookieBanner"] },
  interactive: { title: "Interactive", icon: "MousePointerClick", components: ["glassAccordion", "hoverCard", "tabsSystem", "accordionFAQ", "cardHover", "draggableCard"] },
  content: { title: "Content", icon: "BookOpen", components: ["blogPreviewGrid", "teamGrid", "masonryGallery", "timelineLayout", "accordionFAQ", "blogPostDetail", "blogIndex", "documentationPage", "caseStudy", "pressRelease", "newsletterArchive", "tutorialPage", "authorProfile"] },
  navigation: { title: "Navigation", icon: "Menu", components: ["megaMenu", "breadcrumbTrail", "paginationControls", "sideCommandPalette", "languageSwitcher", "mobileDrawer", "scrollIndicator", "socialLinks"] },
  ai: { title: "AI Components", icon: "Sparkles", components: ["thoughtBubble", "agentTerminal", "logicFlow", "modelStatus", "promptInput", "contextChip"] },
};

export type CategoryKey = keyof typeof categories;

function getIcon(name: string): React.ElementType {
  return iconComponents[name] || Sparkles;
}

function fmt(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

interface ElementPanelProps {
  onAddComponent?: (type: string) => void;
}

export function ElementPanel({ onAddComponent }: ElementPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return Object.entries(categories).map(([k, v]) => ({ key: k, ...v }));
    const s = search.toLowerCase();
    return Object.entries(categories)
      .map(([k, v]) => ({
        key: k,
        ...v,
        components: v.components.filter((n) => {
          const desc = componentDescriptions[n] || fmt(n);
          return n.toLowerCase().includes(s) || desc.toLowerCase().includes(s);
        }),
      }))
      .filter((c) => c.components.length > 0);
  }, [search]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements..."
            className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-xs text-white/30">No elements found</div>
        )}
        {filtered.map((cat) => {
          const CatIcon = getIcon(cat.icon);
          return (
            <div key={cat.key} className="border-b border-white/5">
              <div className="flex items-center gap-2 px-3 py-2">
                <CatIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-xs font-medium text-white/80 flex-1">{cat.title}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-white/30 border-white/10">
                  {cat.components.length}
                </Badge>
              </div>
              <div className="px-2 pb-2 grid grid-cols-1 gap-0.5">
                {cat.components.map((name) => {
                  const IconComp = getIcon(componentIcons[name] || "Sparkles");
                  const desc = componentDescriptions[name] || fmt(name);
                  return (
                    <button
                      key={name}
                      onClick={() => onAddComponent?.(name)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-left group"
                      title={desc}
                    >
                      <div className="w-7 h-7 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-violet-500/10 group-hover:border-violet-500/30">
                        <IconComp className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-white/70 group-hover:text-white truncate">
                          {fmt(name)}
                        </div>
                        <div className="text-[10px] text-white/30 truncate">{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
