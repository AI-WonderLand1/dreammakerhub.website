"use client";

import { useState, useMemo } from "react";
import {
  Search, ChevronRight, Type, MousePointerClick, Heading1, Quote,
  CheckSquare, ToggleLeft, SlidersHorizontal, UserCircle, Link, Minus,
  PanelTop, PanelBottom, Columns2, GlassWater, Layers, SplitSquareHorizontal,
  TextSelect, Video, LayoutGrid, Cloud, ScrollText, Grid3x3, Mail,
  MessageSquare, Newspaper, Map, Code, FileJson, Table, Radio,
  BookOpen, Monitor, Wand2, Menu, CircleDot, Command, Keyboard,
  BadgeCheck, Percent, Star, Wrench, Bell, Globe, Share2,
  MoveVertical, Navigation, AlertTriangle, Activity, GitBranch,
  Cookie, List, Users, PanelRight, AppWindow, Loader, Square,
  Image, Puzzle, Sparkles, LayoutPanelTop, CreditCard, Tag,
  ShoppingBag, ShoppingCart, Briefcase, Calendar, FileText,
  AlertCircle, Info, HelpCircle, XCircle, CheckCircle,
  Eye, EyeOff, Copy, Trash2, Plus, Settings, Lock,
  Unlock, Download, Upload, RefreshCw, Zap, Heart, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { logger } from '@/lib/logger';

const iconMap: Record<string, React.ElementType> = {
  Accordion: Menu, Alert: AlertCircle, AlertDialog: AlertTriangle,
  AspectRatio: Square, Avatar: UserCircle, Badge: Tag, Breadcrumb: List,
  Button: MousePointerClick, ButtonGroup: Layers, Calendar: Calendar,
  Card: CreditCard, Carousel: LayoutGrid, Chart: BarChart3,
  Checkbox: CheckSquare, Collapsible: ChevronRight, Combobox: Search,
  Command: Command, ContextMenu: Menu, DataTable: Table,
  DatePicker: Calendar, Dialog: AppWindow, Drawer: PanelRight,
  DropdownMenu: ChevronRight, Empty: Square, Field: Settings,
  Form: FileText, HoverCard: Eye, Input: Keyboard, InputGroup: Layers,
  InputOTP: Lock, Item: List, Kbd: Command, Label: Type,
  Menubar: Menu, NavigationMenu: Navigation, Pagination: List,
  Popover: EyeOff, Progress: Percent, RadioGroup: Radio,
  Resizable: Columns2, ScrollArea: MoveVertical, Select: ChevronRight,
  Separator: Minus, Sheet: PanelRight, Sidebar: LayoutPanelTop,
  Skeleton: Loader, Slider: SlidersHorizontal, Sonner: Bell,
  Spinner: RefreshCw, Switch: ToggleLeft, Table: Table, Tabs: LayoutGrid,
  Textarea: FileText, Toggle: ToggleLeft, ToggleGroup: Layers,
  Tooltip: MessageSquare, Typography: Type,
  HeroSections: Sparkles, FeatureSections: Star, CTASections: Zap,
  PricingSections: Tag, TestimonialsSections: MessageSquare,
  FAQSections: HelpCircle, BentoGrids: Grid3x3, LogoSections: Globe,
  StatsSections: BarChart3, TeamSections: Users, FooterSections: PanelBottom,
  HeaderSections: PanelTop, GallerySections: Image, BlogSections: BookOpen,
  ContactSections: Mail, ComparisonSections: Eye, BannerSections: Bell,
  LPNavbars: Navigation, Patterns: LayoutGrid, RichTextSections: FileText,
  EmptyLPSections: Square, LandingPageExamples: Monitor,
  AppShells: LayoutPanelTop, Navbars: Menu, PageHeaders: Heading1,
  SectionHeaders: Type, SectionFooters: PanelBottom, Sections: Layers,
  Settings: Settings, SignIn: Lock, SignUp: Unlock, TableHeaders: Table,
  AppExamples: Monitor, DescriptionLists: List, EmptySections: Square,
  Checkouts: ShoppingCart, EcommerceExamples: ShoppingBag,
  Incentives: Zap, OrderSummarySections: FileText,
  ProductCategorySections: Tag, ProductHeaders: CreditCard,
  ProductListFilters: SlidersHorizontal, ProductListSections: LayoutGrid,
  SaleSections: Percent, ShoppingCarts: ShoppingCart, StoreNavbars: Menu,
  HeroSection: Sparkles, SplitHero: Columns2, CenterHero: TextSelect,
  MicroHero: TextSelect, GlassmorphicHero: GlassWater, VideoHero: Video,
  TypewriterHero: Type, StoryHero: BookOpen, ProductShowcaseHero: Monitor,
  StickyHeader: PanelTop, MultiColumnFooter: PanelBottom,
  ContactSplit: Columns2, ParallaxSection: Layers,
  BeforeAfterSlider: SplitSquareHorizontal, FloatingCTA: Navigation,
  TimelineLayout: Layers, TabbedContent: LayoutGrid,
  VideoPlayer: Video, ImageLightbox: Image, MasonryGallery: LayoutGrid,
  LogoCloud: Cloud, LogoMarquee: ScrollText, LogoGridStatic: Grid3x3,
  IconGrid: Grid3x3, PricingTable: Tag, FeatureGrid: LayoutGrid,
  TestimonialCard: MessageSquare, StepProcess: Layers, CTABox: Zap,
  AccordionFAQ: Menu, TeamGrid: Users, StatsSection: BarChart3,
  GlassAccordion: Menu, HoverCard: Eye, TabsSystem: LayoutGrid,
  BlogPreviewGrid: LayoutGrid, NewsletterStrip: Newspaper,
  ConfettiExplosion: Sparkles, GlitchText: Sparkles, ParticleCanvas: LayoutGrid,
  CardHover: CreditCard, FeatureList: List,
};

export const componentIcons: Record<string, string> = {};

export const componentDescriptions: Record<string, string> = {
  Accordion: "Collapsible content sections", Alert: "Alert message banner",
  AlertDialog: "Modal confirmation dialog", AspectRatio: "Fixed ratio container",
  Avatar: "User avatar with image or initials", Badge: "Status indicator badge",
  Breadcrumb: "Page navigation trail", Button: "Clickable action button",
  ButtonGroup: "Grouped button set", Calendar: "Date picker calendar",
  Card: "Content card container", Carousel: "Image/content carousel",
  Chart: "Data visualization chart", Checkbox: "Checkbox input",
  Collapsible: "Expandable content area", Combobox: "Searchable dropdown",
  Command: "Command palette interface", ContextMenu: "Right-click menu",
  DataTable: "Data table with sorting", DatePicker: "Date selection input",
  Dialog: "Modal dialog overlay", Drawer: "Slide-in panel",
  DropdownMenu: "Dropdown action menu", Empty: "Empty state placeholder",
  Field: "Form field wrapper", Form: "Form container with validation",
  HoverCard: "Hover preview popover", Input: "Text input field",
  InputGroup: "Grouped input fields", InputOTP: "One-time password input",
  Item: "List item component", Kbd: "Keyboard shortcut display",
  Label: "Form field label", Menubar: "Application menu bar",
  NavigationMenu: "Main navigation menu", Pagination: "Page navigation",
  Popover: "Floating content panel", Progress: "Progress bar indicator",
  RadioGroup: "Radio button group", Resizable: "Resizable panels",
  ScrollArea: "Custom scrollbar container", Select: "Dropdown select input",
  Separator: "Visual divider line", Sheet: "Slide-over panel",
  Sidebar: "Side navigation panel", Skeleton: "Loading placeholder",
  Slider: "Range slider input", Sonner: "Toast notification",
  Spinner: "Loading spinner", Switch: "Toggle switch",
  Table: "Data table", Tabs: "Tabbed content switcher",
  Textarea: "Multi-line text input", Toggle: "Toggle button",
  ToggleGroup: "Grouped toggle buttons", Tooltip: "Hover tooltip",
  Typography: "Text display component",
  HeroSections: "Hero banner sections", FeatureSections: "Feature showcase grids",
  CTASections: "Call-to-action blocks", PricingSections: "Pricing plan tables",
  TestimonialsSections: "Customer testimonial layouts",
  FAQSections: "FAQ accordion sections", BentoGrids: "Bento box layouts",
  LogoSections: "Logo cloud displays", StatsSections: "Statistics counters",
  TeamSections: "Team member grids", FooterSections: "Page footer layouts",
  HeaderSections: "Page header layouts", GallerySections: "Image gallery grids",
  BlogSections: "Blog post layouts", ContactSections: "Contact form layouts",
  ComparisonSections: "Feature comparison tables", BannerSections: "Promotional banners",
  LPNavbars: "Landing page navigation", Patterns: "Visual pattern blocks",
  RichTextSections: "Rich text content areas", EmptyLPSections: "Empty landing page states",
  LandingPageExamples: "Complete landing page templates",
  AppShells: "Application shell layouts", Navbars: "Navigation bars",
  PageHeaders: "Page header sections", SectionHeaders: "Section title areas",
  SectionFooters: "Section footer areas", Sections: "Generic content sections",
  Settings: "Settings panel layouts", SignIn: "Sign in form layouts",
  SignUp: "Sign up form layouts", TableHeaders: "Table header layouts",
  AppExamples: "Complete application templates", DescriptionLists: "Definition list layouts",
  EmptySections: "Empty state sections",
  Checkouts: "Checkout flow layouts", EcommerceExamples: "Complete store templates",
  Incentives: "Promotional incentive blocks", OrderSummarySections: "Order summary layouts",
  ProductCategorySections: "Product category grids", ProductHeaders: "Product page headers",
  ProductListFilters: "Product filter sidebars", ProductListSections: "Product listing grids",
  SaleSections: "Sale promotional layouts", ShoppingCarts: "Shopping cart layouts",
  StoreNavbars: "E-commerce navigation bars",
  HeroSection: "Main hero banner", SplitHero: "Two-column hero layout",
  CenterHero: "Centered hero section", MicroHero: "Compact hero banner",
  GlassmorphicHero: "Glassmorphism hero", VideoHero: "Video background hero",
  TypewriterHero: "Typewriter text hero", StoryHero: "Storytelling hero",
  ProductShowcaseHero: "Product showcase hero",
  StickyHeader: "Sticky navigation bar", MultiColumnFooter: "Multi-column footer",
  ContactSplit: "Split contact layout", ParallaxSection: "Parallax scrolling section",
  BeforeAfterSlider: "Before/after comparison", FloatingCTA: "Floating CTA button",
  TimelineLayout: "Timeline content layout", TabbedContent: "Tabbed content panels",
  VideoPlayer: "Video player embed", ImageLightbox: "Image lightbox viewer",
  MasonryGallery: "Masonry image grid", LogoCloud: "Logo cloud display",
  LogoMarquee: "Scrolling logo ticker", LogoGridStatic: "Static logo grid",
  IconGrid: "Icon feature grid", PricingTable: "Pricing plan comparison",
  FeatureGrid: "Feature showcase grid", TestimonialCard: "Customer testimonial",
  StepProcess: "Step-by-step process", CTABox: "Call-to-action banner",
  AccordionFAQ: "FAQ accordion", TeamGrid: "Team member grid",
  StatsSection: "Statistics display", GlassAccordion: "Glass-style accordion",
  HoverCard: "Hover preview card", TabsSystem: "Tabbed content system",
  BlogPreviewGrid: "Blog post preview grid", NewsletterStrip: "Newsletter signup strip",
  ConfettiExplosion: "Celebration confetti effect", GlitchText: "Glitch text animation",
  ParticleCanvas: "Particle animation canvas", CardHover: "Hover-animated card",
  FeatureList: "Feature highlight list",
};

export const categories = {
  components: {
    title: "Components", icon: "Puzzle", order: 1,
    sections: [
      { name: "Accordion", items: ["Accordion"] },
      { name: "Alert", items: ["Alert", "AlertDialog"] },
      { name: "Avatar", items: ["Avatar"] },
      { name: "Badge", items: ["Badge"] },
      { name: "Button", items: ["Button", "ButtonGroup"] },
      { name: "Calendar", items: ["Calendar"] },
      { name: "Card", items: ["Card"] },
      { name: "Carousel", items: ["Carousel"] },
      { name: "Chart", items: ["Chart"] },
      { name: "Checkbox", items: ["Checkbox"] },
      { name: "Collapsible", items: ["Collapsible"] },
      { name: "Combobox", items: ["Combobox"] },
      { name: "Command", items: ["Command"] },
      { name: "Context Menu", items: ["ContextMenu"] },
      { name: "Data Table", items: ["DataTable"] },
      { name: "Date Picker", items: ["DatePicker"] },
      { name: "Dialog", items: ["Dialog"] },
      { name: "Drawer", items: ["Drawer"] },
      { name: "Dropdown Menu", items: ["DropdownMenu"] },
      { name: "Form", items: ["Form", "Field", "Label"] },
      { name: "Hover Card", items: ["HoverCard"] },
      { name: "Input", items: ["Input", "InputGroup", "InputOTP", "Textarea"] },
      { name: "Kbd", items: ["Kbd"] },
      { name: "Menubar", items: ["Menubar"] },
      { name: "Navigation Menu", items: ["NavigationMenu"] },
      { name: "Pagination", items: ["Pagination"] },
      { name: "Popover", items: ["Popover"] },
      { name: "Progress", items: ["Progress"] },
      { name: "Radio Group", items: ["RadioGroup"] },
      { name: "Resizable", items: ["Resizable"] },
      { name: "Scroll Area", items: ["ScrollArea"] },
      { name: "Select", items: ["Select"] },
      { name: "Separator", items: ["Separator"] },
      { name: "Sheet", items: ["Sheet"] },
      { name: "Sidebar", items: ["Sidebar"] },
      { name: "Skeleton", items: ["Skeleton"] },
      { name: "Slider", items: ["Slider"] },
      { name: "Sonner", items: ["Sonner"] },
      { name: "Spinner", items: ["Spinner"] },
      { name: "Switch", items: ["Switch"] },
      { name: "Table", items: ["Table"] },
      { name: "Tabs", items: ["Tabs"] },
      { name: "Toggle", items: ["Toggle", "ToggleGroup"] },
      { name: "Tooltip", items: ["Tooltip"] },
      { name: "Typography", items: ["Typography"] },
    ],
  },
  landingPage: {
    title: "Landing Page Blocks", icon: "Sparkles", order: 2,
    sections: [
      { name: "Hero Sections", items: ["HeroSection", "SplitHero", "CenterHero", "MicroHero", "GlassmorphicHero", "VideoHero", "TypewriterHero", "StoryHero", "ProductShowcaseHero"] },
      { name: "Feature Sections", items: ["FeatureSections", "FeatureGrid", "FeatureList", "IconGrid"] },
      { name: "CTA Sections", items: ["CTASections", "CTABox", "FloatingCTA"] },
      { name: "Pricing Sections", items: ["PricingSections", "PricingTable"] },
      { name: "Testimonials", items: ["TestimonialsSections", "TestimonialCard"] },
      { name: "FAQ Sections", items: ["FAQSections", "AccordionFAQ"] },
      { name: "Bento Grids", items: ["BentoGrids"] },
      { name: "Stats Sections", items: ["StatsSections", "StatsSection"] },
      { name: "Team Sections", items: ["TeamSections", "TeamGrid"] },
      { name: "Logo Sections", items: ["LogoSections", "LogoCloud", "LogoMarquee", "LogoGridStatic"] },
      { name: "Blog Sections", items: ["BlogSections", "BlogPreviewGrid"] },
      { name: "Gallery Sections", items: ["GallerySections", "MasonryGallery"] },
      { name: "Contact Sections", items: ["ContactSections", "ContactSplit"] },
      { name: "Comparison", items: ["ComparisonSections"] },
      { name: "Banners", items: ["BannerSections", "NewsletterStrip"] },
      { name: "Footers", items: ["FooterSections", "MultiColumnFooter"] },
      { name: "Headers", items: ["HeaderSections", "StickyHeader"] },
      { name: "Navigation", items: ["LPNavbars"] },
      { name: "Rich Text", items: ["RichTextSections"] },
      { name: "Patterns", items: ["Patterns", "ParallaxSection", "BeforeAfterSlider", "TimelineLayout", "TabbedContent"] },
      { name: "Media", items: ["VideoPlayer", "ImageLightbox"] },
    ],
  },
  appBlocks: {
    title: "Application Blocks", icon: "LayoutPanelTop", order: 3,
    sections: [
      { name: "App Shells", items: ["AppShells"] },
      { name: "Navbars", items: ["Navbars"] },
      { name: "Page Headers", items: ["PageHeaders"] },
      { name: "Section Headers", items: ["SectionHeaders"] },
      { name: "Section Footers", items: ["SectionFooters"] },
      { name: "Sign in", items: ["SignIn"] },
      { name: "Sign up", items: ["SignUp"] },
      { name: "Settings", items: ["Settings"] },
      { name: "Table Headers", items: ["TableHeaders"] },
      { name: "Description Lists", items: ["DescriptionLists"] },
      { name: "Sections", items: ["Sections"] },
    ],
  },
  ecommerce: {
    title: "E-commerce Blocks", icon: "ShoppingCart", order: 4,
    sections: [
      { name: "Checkouts", items: ["Checkouts"] },
      { name: "Shopping Carts", items: ["ShoppingCarts"] },
      { name: "Product Headers", items: ["ProductHeaders"] },
      { name: "Product List Sections", items: ["ProductListSections"] },
      { name: "Product List Filters", items: ["ProductListFilters"] },
      { name: "Product Category", items: ["ProductCategorySections"] },
      { name: "Order Summary", items: ["OrderSummarySections"] },
      { name: "Sale Sections", items: ["SaleSections"] },
      { name: "Incentives", items: ["Incentives"] },
      { name: "Store Navbars", items: ["StoreNavbars"] },
    ],
  },
  advanced: {
    title: "Effects & Media", icon: "Wand2", order: 5,
    sections: [
      { name: "Particles & Effects", items: ["ParticleCanvas", "ConfettiExplosion", "GlitchText"] },
      { name: "Hover Effects", items: ["HoverCard", "CardHover"] },
      { name: "3D Canvas", items: ["ThreeCanvasWrapperBlock"] },
      { name: "Video", items: ["VideoPlayer", "VideoBackgroundSection"] },
    ],
  },
};

export type CategoryKey = keyof typeof categories;

function getIcon(name: string): React.ElementType {
  return iconMap[name] || Sparkles;
}

function fmt(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

interface ElementPanelProps {
  onAddComponent?: (type: string) => void;
}

export function ElementPanel({ onAddComponent }: ElementPanelProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const sorted = Object.entries(categories)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([k, v]) => ({ key: k, ...v }));

    if (!search.trim()) return sorted;

    const s = search.toLowerCase();
    return sorted
      .map((cat) => ({
        ...cat,
        sections: cat.sections
          .map((sec) => ({
            ...sec,
            items: sec.items.filter((n) => {
              const desc = componentDescriptions[n] || fmt(n);
              return n.toLowerCase().includes(s) || desc.toLowerCase().includes(s);
            }),
          }))
          .filter((sec) => sec.items.length > 0),
      }))
      .filter((cat) => cat.sections.length > 0);
  }, [search]);

  const toggleCategory = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const collapseAll = () => setCollapsed(new Set(Object.keys(categories)));
  const expandAll = () => setCollapsed(new Set());

  const totalComponents = Object.values(categories).reduce(
    (sum, cat) => sum + cat.sections.reduce((s, sec) => s + sec.items.length, 0), 0
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Components</h3>
          <span className="text-[10px] text-white/20">{totalComponents}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="flex gap-1">
          <button onClick={expandAll} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Expand all</button>
          <span className="text-white/10">·</span>
          <button onClick={collapseAll} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Collapse all</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-xs text-white/30">No components found</div>
        )}
        {filtered.map((cat) => {
          const CatIcon = getIcon(cat.icon);
          const isCollapsed = collapsed.has(cat.key);
          const count = cat.sections.reduce((s, sec) => s + sec.items.length, 0);
          return (
            <div key={cat.key} className="border-b border-white/5">
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                <ChevronRight
                  className={`w-3 h-3 text-white/20 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
                />
                <CatIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-xs font-semibold text-white/80 flex-1 text-left">{cat.title}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-white/30 border-white/10">
                  {count}
                </Badge>
              </button>
              {!isCollapsed && (
                <div className="px-2 pb-2">
                  {cat.sections.map((sec) => (
                    <div key={sec.name} className="mb-1">
                      <div className="flex items-center gap-1.5 px-2 py-1">
                        <span className="text-[10px] font-medium text-white/25 uppercase tracking-wider">{sec.name}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-0.5">
                        {sec.items.map((name) => {
                          const IconComp = getIcon(name);
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
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
