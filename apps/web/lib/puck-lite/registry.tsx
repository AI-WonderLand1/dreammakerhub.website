import React from "react";
import { Config } from "@puckeditor/core";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export type PuckFieldType = 
  | "text" 
  | "number" 
  | "boolean" 
  | "select" 
  | "radio" 
  | "date"
  | "textarea"
  | "child";

export interface ComponentField {
  type: PuckFieldType;
  label?: string;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
}

export interface PuckComponentConfig {
  fields: Record<string, ComponentField>;
  defaultProps?: Record<string, any>;
  render: (props: any) => React.ReactNode;
}

const DEFAULT_STYLE = "bg-white/5 backdrop-blur-lg border border-white/10 text-white rounded-xl";

function wrapSimpleComponent(
  name: string, 
  Component: React.FC<any>,
  options: {
    contentLabel?: string;
    showStyle?: boolean;
    defaultStyle?: string;
  } = {}
): PuckComponentConfig {
  const {
    contentLabel = "Content",
    showStyle = true,
    defaultStyle = DEFAULT_STYLE,
  } = options;

  return {
    fields: {
      content: { type: "text", label: contentLabel },
      ...(showStyle && { 
        style: { type: "text", label: "Custom Style" } 
      }),
    },
    defaultProps: {
      content: formatLabel(name),
      style: defaultStyle,
    },
    render: ({ content, style, ...props }: any) => (
      <div className={style || defaultStyle}>
        <Component content={content} {...props} />
      </div>
    ),
  };
}

function wrapContainerComponent(
  name: string,
  Component: React.FC<any>,
  options: {
    showStyle?: boolean;
  } = {}
): PuckComponentConfig {
  const { showStyle = true } = options;

  return {
    fields: {
      ...(showStyle && { style: { type: "text", label: "Custom Style" } }),
    },
    defaultProps: {
      style: DEFAULT_STYLE,
    },
    render: ({ style, ...props }: any) => (
      <div className={style || DEFAULT_STYLE}>
        <Component {...props} />
      </div>
    ),
  };
}

function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export const uiKitComponents: Record<string, PuckComponentConfig> = {

  // ============================================
  // BASICS
  // ============================================
  button: {
    fields: {
      content: { type: "text", label: "Button Text" },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Default", value: "bg-violet-600 hover:bg-violet-700" },
          { label: "Outline", value: "border border-white/20 bg-transparent hover:bg-white/10" },
          { label: "Ghost", value: "bg-transparent hover:bg-white/10" },
          { label: "Destructive", value: "bg-red-600 hover:bg-red-700" },
        ],
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "px-3 py-1.5 text-xs" },
          { label: "Medium", value: "px-4 py-2 text-sm" },
          { label: "Large", value: "px-6 py-3 text-base" },
        ],
      },
    },
    defaultProps: {
      content: "Click me",
      variant: "bg-violet-600 hover:bg-violet-700",
      size: "px-4 py-2 text-sm",
      style: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    },
    render: ({ content, variant, size, style, ...props }: any) => (
      <div className={style} {...props}>
        <button className={`${variant} ${size} text-white`}>
          {content}
        </button>
      </div>
    ),
  },

  input: {
    fields: {
      content: { type: "text", label: "Placeholder" },
      label: { type: "text", label: "Label" },
    },
    defaultProps: {
      content: "Enter text...",
      label: "Input Label",
      style: DEFAULT_STYLE,
    },
    render: ({ content, label, style, ...props }: any) => (
      <div className={style}>
        {label && <label className="block text-sm text-white/60 mb-1">{label}</label>}
        <input 
          placeholder={content} 
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
          {...props} 
        />
      </div>
    ),
  },

  typography: wrapSimpleComponent("typography", ({ content }: any) => (
    <p className="text-white/80">{content}</p>
  )),

  badge: {
    fields: {
      content: { type: "text", label: "Badge Text" },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Default", value: "bg-violet-600 text-white" },
          { label: "Secondary", value: "bg-white/10 text-white" },
          { label: "Success", value: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" },
          { label: "Warning", value: "bg-amber-600/20 text-amber-400 border border-amber-500/30" },
          { label: "Destructive", value: "bg-red-600/20 text-red-400 border border-red-500/30" },
          { label: "Outline", value: "bg-transparent text-white border border-white/20" },
        ],
      },
    },
    defaultProps: {
      content: "Badge",
      variant: "bg-violet-600 text-white",
      style: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    },
    render: ({ content, variant, style }: any) => (
      <span className={`${style} ${variant}`}>{content}</span>
    ),
  },

  heading: {
    fields: {
      content: { type: "text", label: "Heading Text" },
      level: {
        type: "select",
        label: "Size",
        options: [
          { label: "H1", value: "text-4xl font-bold" },
          { label: "H2", value: "text-3xl font-semibold" },
          { label: "H3", value: "text-2xl font-semibold" },
          { label: "H4", value: "text-xl font-medium" },
        ],
      },
    },
    defaultProps: {
      content: "Heading",
      level: "text-3xl font-semibold",
      style: "text-white mb-4",
    },
    render: ({ content, level, style }: any) => (
      <h2 className={style}>{content}</h2>
    ),
  },

  blockquote: wrapSimpleComponent("blockquote", ({ content }: any) => (
    <blockquote className="border-l-4 border-violet-500 pl-4 italic text-white/70">
      {content}
    </blockquote>
  )),

  checkbox: {
    fields: {
      content: { type: "text", label: "Label" },
    },
    defaultProps: {
      content: "Checkbox Label",
      style: "flex items-center gap-2",
    },
    render: ({ content, style }: any) => (
      <label className={style}>
        <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500" />
        <span className="text-white/80">{content}</span>
      </label>
    ),
  },

  radioGroup: wrapSimpleComponent("radioGroup", ({ content }: any) => (
    <div className="flex flex-col gap-2">{content}</div>
  )),

  switch: {
    fields: {
      content: { type: "text", label: "Label" },
    },
    defaultProps: {
      content: "Toggle Switch",
      style: "flex items-center gap-3",
    },
    render: ({ content, style }: any) => (
      <label className={style}>
        <div className="relative inline-block w-11 h-6 bg-white/10 rounded-full peer-checked:bg-violet-600 cursor-pointer">
          <input type="checkbox" className="sr-only peer" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5" />
        </div>
        <span className="text-white/80">{content}</span>
      </label>
    ),
  },

  slider: wrapSimpleComponent("slider", ({ content }: any) => (
    <div className="flex items-center gap-4">
      <input type="range" className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
      <span className="text-white/60 text-sm">{content || "50"}</span>
    </div>
  )),

  floatingLabelInput: wrapSimpleComponent("floatingLabelInput", ({ content }: any) => (
    <div className="relative">
      <input 
        type="text" 
        placeholder=" "
        className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500 peer"
      />
      <label className="absolute left-4 top-3 text-white/40 transition-all pointer-events-none peer-placeholder-shown:top-3 peer-focus:top-0 peer-focus:text-xs peer-focus:text-violet-400 peer-[:not(:placeholder-shown)]top-0 peer-[:not(:placeholder-shown)]:text-xs">
        {content || "Floating Label"}
      </label>
    </div>
  )),

  skeleton: wrapSimpleComponent("skeleton", ({ content }: any) => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-4 bg-white/10 rounded" />
    </div>
  )),

  progress: {
    fields: {
      content: { type: "number", label: "Progress %" },
    },
    defaultProps: {
      content: "65",
      style: "w-full",
    },
    render: ({ content, style }: any) => (
      <div className={style}>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Number(content)))}%` }} />
        </div>
      </div>
    ),
  },

  tooltip: {
    fields: {
      content: { type: "text", label: "Tooltip Text" },
      tooltipContent: { type: "text", label: "Hover Message" },
    },
    defaultProps: {
      content: "Hover me",
      tooltipContent: "This is a tooltip!",
      style: "relative group cursor-help",
    },
    render: ({ content, tooltipContent, style }: any) => (
      <div className={style}>
        <span className="text-white/80">{content}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltipContent}
        </div>
      </div>
    ),
  },

  avatar: {
    fields: {
      content: { type: "text", label: "Initials" },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "w-8 h-8 text-xs" },
          { label: "Medium", value: "w-10 h-10 text-sm" },
          { label: "Large", value: "w-12 h-12 text-base" },
        ],
      },
    },
    defaultProps: {
      content: "JD",
      size: "w-10 h-10 text-sm",
      style: "rounded-full bg-violet-600 flex items-center justify-center font-medium text-white",
    },
    render: ({ content, size, style }: any) => (
      <div className={`${style} ${size}`}>{content}</div>
    ),
  },

  dotIndicator: {
    fields: {
      content: { type: "text", label: "Status" },
      color: {
        type: "select",
        label: "Color",
        options: [
          { label: "Green", value: "bg-emerald-500" },
          { label: "Red", value: "bg-red-500" },
          { label: "Yellow", value: "bg-amber-500" },
          { label: "Blue", value: "bg-blue-500" },
        ],
      },
    },
    defaultProps: {
      content: "Online",
      color: "bg-emerald-500",
      style: "flex items-center gap-2",
    },
    render: ({ content, color, style }: any) => (
      <div className={style}>
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm text-white/60">{content}</span>
      </div>
    ),
  },

  kbd: wrapSimpleComponent("kbd", ({ content }: any) => (
    <kbd className="px-2 py-1 text-xs font-mono bg-white/10 border border-white/20 rounded text-white/80">
      {content || "Ctrl"}
    </kbd>
  )),

  divider: {
    fields: {},
    defaultProps: {
      style: "border-t border-white/10 my-4",
    },
    render: ({ style }: any) => <div className={style} />,
  },

  iconWrapper: wrapSimpleComponent("iconWrapper", ({ content }: any) => (
    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
      {content || "★"}
    </div>
  )),

  link: {
    fields: {
      content: { type: "text", label: "Link Text" },
      url: { type: "text", label: "URL" },
    },
    defaultProps: {
      content: "Click here",
      url: "#",
      style: "text-violet-400 hover:text-violet-300 underline",
    },
    render: ({ content, url, style }: any) => (
      <a href={url} className={style}>{content}</a>
    ),
  },

  // ============================================
  // MARKETING
  // ============================================
  splitHero: wrapContainerComponent("splitHero"),

  centerHero: wrapContainerComponent("centerHero"),

  microHero: wrapContainerComponent("microHero"),

  logoCloud: wrapContainerComponent("logoCloud"),

  testimonialCard: wrapContainerComponent("testimonialCard"),

  pricingTable: wrapContainerComponent("pricingTable"),

  featureGrid: wrapContainerComponent("featureGrid"),

  stepProcess: wrapContainerComponent("stepProcess"),

  cookieBanner: wrapContainerComponent("cookieBanner"),

  pricingComparison: wrapContainerComponent("pricingComparison"),

  // ============================================
  // COMPOSITE
  // ============================================
  videoHero: wrapContainerComponent("videoHero"),

  iconGrid: wrapContainerComponent("iconGrid"),

  cardHover: wrapContainerComponent("cardHover"),

  featureList: wrapContainerComponent("featureList"),

  testimonialGrid: wrapContainerComponent("testimonialGrid"),

  logoMarquee: wrapContainerComponent("logoMarquee"),

  accordionFAQ: wrapContainerComponent("accordionFAQ"),

  teamGrid: wrapContainerComponent("teamGrid"),

  statsSection: wrapContainerComponent("statsSection"),

  newsletterStrip: wrapContainerComponent("newsletterStrip"),

  comparisonTable: wrapContainerComponent("comparisonTable"),

  featureHighlightList: wrapContainerComponent("featureHighlightList"),

  testimonialCarousel: wrapContainerComponent("testimonialCarousel"),

  floatingCTA: wrapContainerComponent("floatingCTA"),

  userReviewSummary: wrapContainerComponent("userReviewSummary"),

  faqSingleColumn: wrapContainerComponent("faqSingleColumn"),

  callToActionBox: wrapContainerComponent("callToActionBox"),

  productShowcaseHero: wrapContainerComponent("productShowcaseHero"),

  glassmorphicHero: wrapContainerComponent("glassmorphicHero"),

  parallaxSection: wrapContainerComponent("parallaxSection"),

  beforeAfterSlider: wrapContainerComponent("beforeAfterSlider"),

  videoBackgroundSection: wrapContainerComponent("videoBackgroundSection"),

  storyHero: wrapContainerComponent("storyHero"),

  blogPreviewGrid: wrapContainerComponent("blogPreviewGrid"),

  timelineLayout: wrapContainerComponent("timelineLayout"),

  tabbedContent: wrapContainerComponent("tabbedContent"),

  masonryGallery: wrapContainerComponent("masonryGallery"),

  simpleTable: wrapContainerComponent("simpleTable"),

  logoGridStatic: wrapContainerComponent("logoGridStatic"),

  contactSplit: wrapContainerComponent("contactSplit"),

  // ============================================
  // NAVIGATION
  // ============================================
  megaMenu: wrapContainerComponent("megaMenu"),

  breadcrumbTrail: wrapContainerComponent("breadcrumbTrail"),

  paginationControls: wrapContainerComponent("paginationControls"),

  sideCommandPalette: wrapContainerComponent("sideCommandPalette"),

  languageSwitcher: wrapContainerComponent("languageSwitcher"),

  mobileDrawer: wrapContainerComponent("mobileDrawer"),

  searchBar: wrapContainerComponent("searchBar"),

  progressBar: {
    fields: {
      content: { type: "number", label: "Progress %" },
      showLabel: { type: "boolean", label: "Show Label" },
    },
    defaultProps: {
      content: "45",
      showLabel: true,
      style: "w-full",
    },
    render: ({ content, showLabel, style }: any) => (
      <div className={style}>
        <div className="flex justify-between mb-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden flex-1">
            <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style={{ width: `${content}%` }} />
          </div>
          {showLabel && <span className="ml-2 text-xs text-white/60">{content}%</span>}
        </div>
      </div>
    ),
  },

  scrollIndicator: wrapContainerComponent("scrollIndicator"),

  socialLinks: wrapContainerComponent("socialLinks"),

  // ============================================
  // INTERACTIVE
  // ============================================
  glassAccordion: wrapContainerComponent("glassAccordion"),

  tabsSystem: wrapContainerComponent("tabsSystem"),

  imageLightbox: wrapContainerComponent("imageLightbox"),

  parallaxScrollContainer: wrapContainerComponent("parallaxScrollContainer"),

  customCursor: wrapContainerComponent("customCursor"),

  hoverCard: wrapContainerComponent("hoverCard"),

  interactiveMap: wrapContainerComponent("interactiveMap"),

  videoPlayer: wrapContainerComponent("videoPlayer"),

  formWizard: wrapContainerComponent("formWizard"),

  draggableCard: wrapContainerComponent("draggableCard"),

  // ============================================
  // OVERLAYS
  // ============================================
  glassModal: wrapContainerComponent("glassModal"),

  slideOverPanel: wrapContainerComponent("slideOverPanel"),

  notificationToast: wrapContainerComponent("notificationToast"),

  confettiTrigger: wrapContainerComponent("confettiTrigger"),

  floatingDock: wrapContainerComponent("floatingDock"),

  tooltipOverlay: wrapContainerComponent("tooltipOverlay"),

  contextMenu: wrapContainerComponent("contextMenu"),

  loadingSpinner: {
    fields: {
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "w-4 h-4" },
          { label: "Medium", value: "w-8 h-8" },
          { label: "Large", value: "w-12 h-12" },
        ],
      },
    },
    defaultProps: {
      size: "w-8 h-8",
      style: "border-2 border-white/20 border-t-violet-500 rounded-full animate-spin",
    },
    render: ({ size, style }: any) => (
      <div className={`${style} ${size}`} />
    ),
  },

  successMessage: {
    fields: {
      content: { type: "text", label: "Message" },
    },
    defaultProps: {
      content: "Operation completed successfully!",
      style: "p-4 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300",
    },
    render: ({ content, style }: any) => (
      <div className={style}>
        <span className="mr-2">✓</span>
        {content}
      </div>
    ),
  },

  errorBanner: {
    fields: {
      content: { type: "text", label: "Error Message" },
    },
    defaultProps: {
      content: "Something went wrong. Please try again.",
      style: "p-4 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300",
    },
    render: ({ content, style }: any) => (
      <div className={style}>
        <span className="mr-2">✕</span>
        {content}
      </div>
    ),
  },

  // ============================================
  // TEMPLATES
  // ============================================
  saaSLanding: wrapContainerComponent("saaSLanding"),
  portfolioLanding: wrapContainerComponent("portfolioLanding"),
  newsletterLanding: wrapContainerComponent("newsletterLanding"),
  waitlistLanding: wrapContainerComponent("waitlistLanding"),
  productLaunchLanding: wrapContainerComponent("productLaunchLanding"),
  agencyLanding: wrapContainerComponent("agencyLanding"),
  appLanding: wrapContainerComponent("appLanding"),
  eventLanding: wrapContainerComponent("eventLanding"),
  personalLanding: wrapContainerComponent("personalLanding"),
  ecommerceLanding: wrapContainerComponent("ecommerceLanding"),

  // Dashboard templates
  analyticsDashboardTemplate: wrapContainerComponent("analyticsDashboardTemplate"),
  userManagementTemplate: wrapContainerComponent("userManagementTemplate"),
  agentControlTemplate: wrapContainerComponent("agentControlTemplate"),
  projectManagementTemplate: wrapContainerComponent("projectManagementTemplate"),
  financialDashboardTemplate: wrapContainerComponent("financialDashboardTemplate"),
  supportDashboardTemplate: wrapContainerComponent("supportDashboardTemplate"),
  marketingDashboardTemplate: wrapContainerComponent("marketingDashboardTemplate"),
  inventoryDashboardTemplate: wrapContainerComponent("inventoryDashboardTemplate"),
  settingsDashboardTemplate: wrapContainerComponent("settingsDashboardTemplate"),
  monitoringDashboardTemplate: wrapContainerComponent("monitoringDashboardTemplate"),

  // Content templates
  blogPostDetail: wrapContainerComponent("blogPostDetail"),
  blogIndex: wrapContainerComponent("blogIndex"),
  documentationPage: wrapContainerComponent("documentationPage"),
  caseStudy: wrapContainerComponent("caseStudy"),
  pressRelease: wrapContainerComponent("pressRelease"),
  newsletterArchive: wrapContainerComponent("newsletterArchive"),
  tutorialPage: wrapContainerComponent("tutorialPage"),
  authorProfile: wrapContainerComponent("authorProfile"),

  // Utility templates
  error404: wrapContainerComponent("error404"),
  maintenancePage: wrapContainerComponent("maintenancePage"),
  authFlow: wrapContainerComponent("authFlow"),
  onboardingWizard: wrapContainerComponent("onboardingWizard"),
  contactPage: wrapContainerComponent("contactPage"),
  termsPage: wrapContainerComponent("termsPage"),
  privacyPage: wrapContainerComponent("privacyPage"),
  comingSoon: wrapContainerComponent("comingSoon"),
  searchResults: wrapContainerComponent("searchResults"),
  feedbackForm: wrapContainerComponent("feedbackForm"),

  // ============================================
  // AI COMPONENTS
  // ============================================
  thoughtBubble: wrapContainerComponent("thoughtBubble"),
  agentTerminal: wrapContainerComponent("agentTerminal"),
  logicFlow: wrapContainerComponent("logicFlow"),
  modelStatus: wrapContainerComponent("modelStatus"),
  promptInput: wrapContainerComponent("promptInput"),
  contextChip: wrapContainerComponent("contextChip"),
  codeSandbox: wrapContainerComponent("codeSandbox"),

  // ============================================
  // SPECIALIZED & DATA
  // ============================================
  cloudConnectorForm: wrapContainerComponent("cloudConnectorForm"),
  userDashboardHome: wrapContainerComponent("userDashboardHome"),
  realtimeStream: wrapContainerComponent("realtimeStream"),
  authForm: wrapContainerComponent("authForm"),
  bucketGallery: wrapContainerComponent("bucketGallery"),
  databaseTable: wrapContainerComponent("databaseTable"),
  userPresence: wrapContainerComponent("userPresence"),
  analyticsDashboard: wrapContainerComponent("analyticsDashboard"),
  jsonTree: wrapContainerComponent("jsonTree"),

  // ============================================
  // EXPERIMENTAL
  // ============================================
  voiceVisualizer: wrapContainerComponent("voiceVisualizer"),
  particleCanvas: wrapContainerComponent("particleCanvas"),
  glitchText: wrapContainerComponent("glitchText"),
  typewriterHero: wrapContainerComponent("typewriterHero"),
  spotlightEffect: wrapContainerComponent("spotlightEffect"),
  confettiExplosion: wrapContainerComponent("confettiExplosion"),

  // ============================================
  // UTILITY
  // ============================================
  maintenanceMode: wrapContainerComponent("maintenanceMode"),
};

// Category mapping
export const categories = {
  layout: { title: "Layout", components: ["stickyHeader", "multiColumnFooter", "contactSplit", "glassmorphicHero", "parallaxSection", "beforeAfterSlider", "floatingCTA", "splitHero", "centerHero", "microHero", "timelineLayout", "tabbedContent"] },
  media: { title: "Media", components: ["videoPlayer", "imageLightbox", "masonryGallery", "logoCloud", "logoMarquee", "logoGridStatic", "videoHero", "videoBackgroundSection", "iconGrid"] },
  forms: { title: "Forms", components: ["input", "floatingLabelInput", "checkbox", "radioGroup", "switch", "slider", "formWizard", "authForm", "cloudConnectorForm", "contactPage", "feedbackForm", "newsletterStrip", "searchBar"] },
  embeds: { title: "Embeds", components: ["interactiveMap", "codeSandbox", "jsonTree", "databaseTable", "realtimeStream"] },
  advanced: { title: "Advanced", components: ["glassModal", "slideOverPanel", "notificationToast", "confettiTrigger", "floatingDock", "tooltipOverlay", "contextMenu", "confettiExplosion", "glitchText", "typewriterHero", "particleCanvas", "spotlightEffect", "voiceVisualizer", "parallaxScrollContainer", "customCursor", "loadingSpinner", "successMessage", "errorBanner"] },
  basics: { title: "Basic", components: ["button", "heading", "typography", "badge", "blockquote", "divider", "link", "avatar", "dotIndicator", "kbd", "iconWrapper", "tooltip", "skeleton", "progress"] },
  marketing: { title: "Marketing", components: ["pricingTable", "featureGrid", "testimonialCard", "stepProcess", "statsSection", "ctaBox", "pricingComparison", "comparisonTable", "featureHighlightList", "testimonialCarousel", "userReviewSummary", "faqSingleColumn", "callToActionBox", "productShowcaseHero", "storyHero", "cookieBanner"] },
  interactive: { title: "Interactive", components: ["glassAccordion", "hoverCard", "tabsSystem", "accordionFAQ", "cardHover", "draggableCard"] },
  content: { title: "Content", components: ["blogPreviewGrid", "teamGrid", "masonryGallery", "timelineLayout", "accordionFAQ", "blogPostDetail", "blogIndex", "documentationPage", "caseStudy", "pressRelease", "newsletterArchive", "tutorialPage", "authorProfile"] },
  navigation: { title: "Navigation", components: ["megaMenu", "breadcrumbTrail", "paginationControls", "sideCommandPalette", "languageSwitcher", "mobileDrawer", "scrollIndicator", "socialLinks"] },
  ai: { title: "AI Components", components: ["thoughtBubble", "agentTerminal", "logicFlow", "modelStatus", "promptInput", "contextChip"] },
  templates: { title: "Page Templates", components: ["saaSLanding", "portfolioLanding", "newsletterLanding", "waitlistLanding", "productLaunchLanding", "agencyLanding", "appLanding", "eventLanding", "personalLanding", "ecommerceLanding"] },
  dashboards: { title: "Dashboards", components: ["analyticsDashboardTemplate", "userManagementTemplate", "agentControlTemplate", "projectManagementTemplate", "financialDashboardTemplate", "supportDashboardTemplate", "marketingDashboardTemplate", "inventoryDashboardTemplate", "settingsDashboardTemplate", "monitoringDashboardTemplate"] },
  utility: { title: "Utility Pages", components: ["error404", "maintenancePage", "authFlow", "onboardingWizard", "contactPage", "termsPage", "privacyPage", "comingSoon", "searchResults", "feedbackForm", "maintenanceMode"] },
};

// Build Puck config from registry
export function buildPuckConfig(): Config {
  const components: Record<string, any> = {};
  
  // Add existing inline components
  Object.entries(uiKitComponents).forEach(([name, config]) => {
    components[name] = config;
  });

  // Add UI-Kit components with motion support
  components["featureList"] = {
    fields: {
      items: { type: "text", label: "Features (comma separated)" },
    },
    defaultProps: {
      items: "Fast, Secure, Scalable",
    },
    render: ({ items }: any) => (
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
        {items?.split(",").map((item: string, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-white/80">{item.trim()}</span>
          </motion.div>
        ))}
      </div>
    ),
  };

  components["splitHero"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      ctaText: { type: "text", label: "CTA Text" },
    },
    defaultProps: {
      title: "Build Amazing Things",
      subtitle: "The modern way to create beautiful websites",
      ctaText: "Get Started",
    },
    render: ({ title, subtitle, ctaText }: any) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/70 mb-6">{subtitle}</p>
          <button className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">
            {ctaText}
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full h-64 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-xl border border-white/10" />
        </div>
      </div>
    ),
  };

  components["centerHero"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
    },
    defaultProps: {
      title: "Welcome to Wonder",
      subtitle: "Build beautiful websites with AI",
    },
    render: ({ title, subtitle }: any) => (
      <div className="text-center p-16 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10">
        <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
        <p className="text-xl text-white/60">{subtitle}</p>
      </div>
    ),
  };

  components["microHero"] = {
    fields: {
      title: { type: "text", label: "Title" },
    },
    defaultProps: {
      title: "Micro Hero",
    },
    render: ({ title }: any) => (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-white/80">{title}</p>
      </div>
    ),
  };

  components["pricingTable"] = {
    fields: {
      plans: { type: "text", label: "Plan Names" },
      price: { type: "text", label: "Price" },
    },
    defaultProps: {
      plans: "Basic,Pro,Enterprise",
      price: "$9/mo",
    },
    render: ({ plans, price }: any) => (
      <div className="grid grid-cols-3 gap-4 p-6">
        {plans?.split(",").map((plan: string, i: number) => (
          <div key={i} className={`p-6 rounded-xl border ${i === 1 ? 'bg-violet-600/20 border-violet-500/50' : 'bg-white/5 border-white/10'}`}>
            <h3 className="text-lg font-semibold text-white mb-2">{plan.trim()}</h3>
            <p className="text-3xl font-bold text-white mb-4">{price}</p>
            <button className={`w-full py-2 rounded-lg ${i === 1 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white'}`}>
              Choose
            </button>
          </div>
        ))}
      </div>
    ),
  };

  components["featureGrid"] = {
    fields: {
      features: { type: "text", label: "Features (comma separated)" },
    },
    defaultProps: {
      features: "Fast,Secure,Scalable",
    },
    render: ({ features }: any) => (
      <div className="grid grid-cols-3 gap-4 p-6">
        {features?.split(",").map((feature: string, i: number) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 mb-3 flex items-center justify-center">
              <span className="text-violet-400">★</span>
            </div>
            <h4 className="font-semibold text-white mb-2">{feature.trim()}</h4>
            <p className="text-sm text-white/60">Description for {feature.trim()}</p>
          </div>
        ))}
      </div>
    ),
  };

  components["logoCloud"] = {
    fields: {
      companies: { type: "text", label: "Company Names" },
    },
    defaultProps: {
      companies: "Google,Meta,Microsoft,Amazon",
    },
    render: ({ companies }: any) => (
      <div className="flex flex-wrap items-center justify-center gap-8 p-8">
        {companies?.split(",").map((company: string, i: number) => (
          <span key={i} className="text-2xl font-bold text-white/40">{company.trim()}</span>
        ))}
      </div>
    ),
  };

  components["testimonialCard"] = {
    fields: {
      quote: { type: "text", label: "Quote" },
      author: { type: "text", label: "Author" },
    },
    defaultProps: {
      quote: "This product changed my life!",
      author: "Jane Doe",
    },
    render: ({ quote, author }: any) => (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <p className="text-lg text-white/80 italic mb-4">"{quote}"</p>
        <p className="text-white/60 font-medium">— {author}</p>
      </div>
    ),
  };

  components["stepProcess"] = {
    fields: {
      title: { type: "text", label: "Section Title" },
      steps: { type: "text", label: "Steps (semicolon: icon|title|desc;)" },
    },
    defaultProps: { title: "How it works", steps: "✏️|Sign Up|Create your free account in seconds;⚙️|Configure|Set up your project with our tools;🚀|Launch|Go live and share with the world" },
    render: ({ title, steps }: any) => (
      <section className="py-24 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.split(";").filter(Boolean).map((step: string, i: number) => {
              const [icon, title, desc] = step.split("|");
              return (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                    <span className="text-xl">{icon}</span>
                  </div>
                  <div className="text-[11px] text-white/20 font-semibold uppercase tracking-wider mb-2">Step {i + 1}</div>
                  <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["glassAccordion"] = {
    fields: {
      title: { type: "text", label: "Title" },
      content: { type: "text", label: "Content" },
    },
    defaultProps: {
      title: "Click to expand",
      content: "This is the hidden content that appears when expanded.",
    },
    render: ({ title, content }: any) => (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <details className="group">
          <summary className="px-6 py-5 cursor-pointer text-sm font-medium text-white/70 flex items-center justify-between">
            {title}
            <svg className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </summary>
          <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed">{content}</div>
        </details>
      </div>
    ),
  };

  components["hoverCard"] = {
    fields: {
      title: { type: "text", label: "Title" },
      content: { type: "text", label: "Content" },
    },
    defaultProps: {
      title: "Hover me",
      content: "This content appears on hover!",
    },
    render: ({ title, content }: any) => (
      <div className="relative group p-5 rounded-2xl border border-white/5 bg-white/[0.02] cursor-pointer" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <span className="text-sm text-white/60">{title}</span>
        <div className="absolute left-0 bottom-full mb-2 w-56 p-4 rounded-xl bg-[#09090b] border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-[13px] text-white/50 leading-relaxed">{content}</p>
        </div>
      </div>
    ),
  };

  components["tabsSystem"] = {
    fields: {
      tabs: { type: "text", label: "Tab Labels (semicolon separated)" },
    },
    defaultProps: {
      tabs: "Overview;Features;Pricing",
    },
    render: ({ tabs }: any) => {
      const tabList = tabs?.split(";").map((t: string) => t.trim()) || [];
      const [activeTab, setActiveTab] = React.useState(0);
      return (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          <div className="flex border-b border-white/5">
            {tabList.map((tab: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`flex-1 px-5 py-4 text-[13px] font-medium transition-colors border-b-2 ${
                  activeTab === i
                    ? 'text-white border-white/40 bg-white/[0.03]'
                    : 'text-white/25 border-transparent hover:text-white/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-8 text-sm text-white/40">
            Content for {tabList[activeTab]}
          </div>
        </div>
      );
    },
  };

  components["videoPlayer"] = {
    fields: {
      src: { type: "text", label: "Video URL" },
    },
    defaultProps: {
      src: "",
    },
    render: ({ src }: any) => (
      <div className="aspect-video rounded-xl bg-black border border-white/10 flex items-center justify-center">
        {src ? (
          <video src={src} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="text-white/40">No video URL provided</div>
        )}
      </div>
    ),
  };

  components["confettiExplosion"] = {
    fields: {
      text: { type: "text", label: "Celebration Text" },
    },
    defaultProps: {
      text: "🎉 Success!",
    },
    render: ({ text }: any) => (
      <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
        <p className="text-2xl">{text}</p>
        <p className="text-sm text-white/40 mt-2">Click to trigger confetti</p>
      </div>
    ),
  };

  components["glitchText"] = {
    fields: {
      text: { type: "text", label: "Text" },
    },
    defaultProps: {
      text: "GLITCH",
    },
    render: ({ text }: any) => (
      <div className="relative inline-block">
        <span className="text-4xl font-bold text-white">{text}</span>
        <span className="absolute inset-0 text-4xl font-bold text-cyan-400 opacity-70 animate-pulse" style={{ clipPath: 'inset(0 0 0 0)', transform: 'translate(2px, 2px)' }}>{text}</span>
        <span className="absolute inset-0 text-4xl font-bold text-red-500 opacity-70 animate-pulse" style={{ clipPath: 'inset(0 0 0 0)', transform: 'translate(-2px, -2px)' }}>{text}</span>
      </div>
    ),
  };

  components["typewriterHero"] = {
    fields: {
      text: { type: "text", label: "Text" },
    },
    defaultProps: {
      text: "Building the future...",
    },
    render: ({ text }: any) => {
      const [displayed, setDisplayed] = React.useState("");
      React.useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
          setDisplayed(text.slice(0, i + 1));
          i++;
          if (i >= text.length) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
      }, [text]);
      return <h1 className="text-4xl font-bold text-white">{displayed}<span className="animate-pulse">|</span></h1>;
    },
  };

  components["particleCanvas"] = {
    fields: {
      bgColor: { type: "text", label: "Background Color" },
    },
    defaultProps: {
      bgColor: "#0a0a10",
    },
    render: ({ bgColor }: any) => (
      <div 
        className="h-64 rounded-xl overflow-hidden relative"
        style={{ background: bgColor }}
      >
        <canvas className="w-full h-full" ref={(canvas) => {
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
          for (let i = 0; i < 80; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              r: Math.random() * 2 + 1,
            });
          }
          let animId: number;
          function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
              p.x += p.vx;
              p.y += p.vy;
              if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
              if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(68, 136, 255, 0.6)";
              ctx.fill();
            }
            for (let i = 0; i < particles.length; i++) {
              for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                  ctx.beginPath();
                  ctx.moveTo(particles[i].x, particles[i].y);
                  ctx.lineTo(particles[j].x, particles[j].y);
                  ctx.strokeStyle = `rgba(68, 136, 255, ${0.15 * (1 - dist / 100)})`;
                  ctx.stroke();
                }
              }
            }
            animId = requestAnimationFrame(draw);
          }
          draw();
          return () => cancelAnimationFrame(animId);
        }} />
      </div>
    ),
  };

  components["stickyHeader"] = {
    fields: {
      title: { type: "text", label: "Title" },
    },
    defaultProps: {
      title: "My App",
    },
    render: ({ title }: any) => (
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <span className="text-xl font-bold text-white">{title}</span>
        <div className="flex gap-4">
          <span className="text-white/60">Link 1</span>
          <span className="text-white/60">Link 2</span>
        </div>
      </div>
    ),
  };

  components["multiColumnFooter"] = {
    fields: {
      columns: { type: "text", label: "Columns (comma separated)" },
    },
    defaultProps: {
      columns: "Product,Company,Support",
    },
    render: ({ columns }: any) => (
      <div className="grid grid-cols-3 gap-4 p-8 bg-white/5 border-t border-white/10">
        {columns?.split(",").map((col: string, i: number) => (
          <div key={i}>
            <h4 className="font-semibold text-white mb-3">{col.trim()}</h4>
            <div className="space-y-2">
              <p className="text-sm text-white/40">Link 1</p>
              <p className="text-sm text-white/40">Link 2</p>
            </div>
          </div>
        ))}
      </div>
    ),
  };

  components["newsletterStrip"] = {
    fields: {
      title: { type: "text", label: "Title" },
    },
    defaultProps: {
      title: "Subscribe to our newsletter",
    },
    render: ({ title }: any) => (
      <div className="flex items-center justify-between p-6 bg-violet-600/20 border border-violet-500/30 rounded-xl">
        <p className="text-white font-medium">{title}</p>
        <div className="flex gap-2">
          <input 
            type="email" 
            placeholder="Enter email" 
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40"
          />
          <button className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium">
            Subscribe
          </button>
        </div>
      </div>
    ),
  };

  components["ctaBox"] = {
    fields: {
      title: { type: "text", label: "Title" },
      buttonText: { type: "text", label: "Button Text" },
    },
    defaultProps: {
      title: "Ready to get started?",
      buttonText: "Sign Up Now",
    },
    render: ({ title, buttonText }: any) => (
      <div className="text-center p-8 rounded-xl bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-white/10">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors">
          {buttonText}
        </button>
      </div>
    ),
  };

  components["accordionFAQ"] = {
    fields: {
      items: { type: "text", label: "FAQ Items" },
    },
    defaultProps: {
      items: "What is this?|It is a FAQ item;How does it work?|It works by magic",
    },
    render: ({ items }: any) => (
      <div className="space-y-2">
        {items?.split(";").map((item: string, i: number) => {
          const [question, answer] = item.split("|");
          return (
            <details key={i} className="rounded-lg bg-white/5 border border-white/10">
              <summary className="p-4 cursor-pointer text-white font-medium">
                {question?.trim()}
              </summary>
              <div className="px-4 pb-4 text-white/60">
                {answer?.trim()}
              </div>
            </details>
          );
        })}
      </div>
    ),
  };

  components["blogPreviewGrid"] = {
    fields: {
      count: { type: "number", label: "Number of Posts" },
    },
    defaultProps: {
      count: 3,
    },
    render: ({ count }: any) => (
      <div className="grid grid-cols-3 gap-4 p-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="h-32 bg-white/10" />
            <div className="p-4">
              <h4 className="font-semibold text-white mb-2">Blog Post {i + 1}</h4>
              <p className="text-sm text-white/60">Preview text goes here...</p>
            </div>
          </div>
        ))}
      </div>
    ),
  };

  components["teamGrid"] = {
    fields: {
      count: { type: "number", label: "Number of Members" },
    },
    defaultProps: {
      count: 4,
    },
    render: ({ count }: any) => (
      <div className="grid grid-cols-4 gap-4 p-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-3" />
            <h4 className="font-semibold text-white">Team Member</h4>
            <p className="text-sm text-white/60">Role</p>
          </div>
        ))}
      </div>
    ),
  };

  components["statsSection"] = {
    fields: {
      stats: { type: "text", label: "Stats" },
    },
    defaultProps: {
      stats: "Users:1000;Projects:500;Countries:50",
    },
    render: ({ stats }: any) => (
      <div className="grid grid-cols-3 gap-4 p-8 bg-white/5 border border-white/10 rounded-xl">
        {stats?.split(";").map((stat: string, i: number) => {
          const [label, value] = stat.split(":");
          return (
            <div key={i} className="text-center">
              <p className="text-4xl font-bold text-white">{value?.trim()}</p>
              <p className="text-white/60">{label?.trim()}</p>
            </div>
          );
        })}
      </div>
    ),
  };

  components["masonryGallery"] = {
    fields: {
      count: { type: "number", label: "Number of Images" },
    },
    defaultProps: {
      count: 6,
    },
    render: ({ count }: any) => (
      <div className="columns-3 gap-4 p-6">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="mb-4 rounded-lg bg-white/10"
            style={{ height: Math.random() * 100 + 100 }}
          />
        ))}
      </div>
    ),
  };

  components["beforeAfterSlider"] = {
    fields: {
      beforeLabel: { type: "text", label: "Before Label" },
      afterLabel: { type: "text", label: "After Label" },
    },
    defaultProps: {
      beforeLabel: "Before",
      afterLabel: "After",
    },
    render: ({ beforeLabel, afterLabel }: any) => (
      <div className="relative h-64 rounded-xl overflow-hidden bg-white/10">
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <span className="text-white/40">Before/After Slider</span>
        </div>
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded text-xs text-white">
          {beforeLabel}
        </div>
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded text-xs text-white">
          {afterLabel}
        </div>
      </div>
    ),
  };

  components["contactSplit"] = {
    fields: {
      title: { type: "text", label: "Title" },
      buttonText: { type: "text", label: "Button Text" },
    },
    defaultProps: {
      title: "Get in Touch",
      buttonText: "Send Message",
    },
    render: ({ title, buttonText }: any) => (
      <section className="py-24 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
            <p className="text-sm text-white/30 leading-relaxed">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name"
              className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
            <textarea
              placeholder="Message"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-white/[0.15] transition-colors"
            />
            <button className="w-full h-11 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">{buttonText}</button>
          </div>
        </div>
      </section>
    ),
  };

  components["glassmorphicHero"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      ctaText: { type: "text", label: "CTA Text" },
    },
    defaultProps: {
      title: "Glassmorphic Hero",
      subtitle: "Beautiful glass effect",
      ctaText: "Get Started",
    },
    render: ({ title, subtitle, ctaText }: any) => (
      <div className="relative py-32 px-6 overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
        <div className="absolute inset-0 border border-white/[0.06] m-6 rounded-3xl" />
        <div className="relative text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-[-0.03em] mb-5">{title}</h1>
          <p className="text-lg text-white/35 mb-8">{subtitle}</p>
          <button className="px-8 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">{ctaText}</button>
        </div>
      </div>
    ),
  };

  components["parallaxSection"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
    },
    defaultProps: {
      title: "Parallax Section",
      subtitle: "Scroll to explore",
    },
    render: ({ title, subtitle }: any) => (
      <div
        className="py-32 flex flex-col items-center justify-center rounded-none"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-3">{title}</h2>
        <p className="text-sm text-white/30">{subtitle}</p>
      </div>
    ),
  };

  components["logoMarquee"] = {
    fields: {
      companies: { type: "text", label: "Company Names" },
    },
    defaultProps: {
      companies: "Google,Meta,Microsoft,Amazon,Apple,Nvidia",
    },
    render: ({ companies }: any) => (
      <div className="flex gap-8 overflow-hidden py-4">
        <div className="flex animate-marquee gap-8">
           {[...companies.split(","), ...companies.split(",")].map((company: string, i: number) => (
            <span key={i} className="text-2xl font-bold text-white/30 whitespace-nowrap">{company.trim()}</span>
          ))}
        </div>
      </div>
    ),
  };

  components["iconGrid"] = {
    fields: {
      count: { type: "number", label: "Number of Icons" },
    },
    defaultProps: {
      count: 4,
    },
    render: ({ count }: any) => (
      <div className="grid grid-cols-4 gap-4 p-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-violet-400">★</span>
            </div>
            <span className="text-sm text-white/60">Feature</span>
          </div>
        ))}
      </div>
    ),
  };

  components["floatingCTA"] = {
    fields: {
      text: { type: "text", label: "Button Text" },
    },
    defaultProps: {
      text: "Get Started",
    },
    render: ({ text }: any) => (
      <div className="fixed bottom-8 right-8 z-50">
        <button className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full shadow-lg shadow-violet-500/30 animate-bounce">
          {text}
        </button>
      </div>
    ),
  };

  components["cardHover"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
    },
    defaultProps: {
      title: "Card Title",
      description: "Hover to see the effect",
    },
    render: ({ title, description }: any) => (
      <div className="group p-6 rounded-xl bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-violet-500/50 hover:scale-105 cursor-pointer">
        <h4 className="font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">{title}</h4>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    ),
  };

  // ============================================================
  // SHADCN/UI PRIMITIVE COMPONENTS
  // ============================================================

  components["alert"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
      variant: { type: "select", label: "Variant", options: [
        { label: "Default", value: "default" },
        { label: "Destructive", value: "destructive" },
        { label: "Success", value: "success" },
      ]},
    },
    defaultProps: { title: "Alert Title", description: "This is an alert message.", variant: "default" },
    render: ({ title, description, variant }: any) => {
      const styles: Record<string, string> = {
        default: "border-white/20 bg-white/5 text-white",
        destructive: "border-red-500/30 bg-red-500/10 text-red-300",
        success: "border-green-500/30 bg-green-500/10 text-green-300",
      };
      return (
        <div className={`rounded-lg border p-4 ${styles[variant] || styles.default}`}>
          {title && <h5 className="font-semibold text-sm mb-1">{title}</h5>}
          {description && <p className="text-xs opacity-80">{description}</p>}
        </div>
      );
    },
  };

  components["alertDialog"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
      cancelText: { type: "text", label: "Cancel Button" },
      confirmText: { type: "text", label: "Confirm Button" },
    },
    defaultProps: { title: "Are you sure?", description: "This action cannot be undone.", cancelText: "Cancel", confirmText: "Continue" },
    render: ({ title, description, cancelText, confirmText }: any) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/60 mb-6">{description}</p>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/10">{cancelText}</button>
            <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90">{confirmText}</button>
          </div>
        </div>
      </div>
    ),
  };

  components["avatar"] = {
    fields: {
      src: { type: "text", label: "Image URL" },
      fallback: { type: "text", label: "Fallback Text" },
      size: { type: "select", label: "Size", options: [
        { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" },
      ]},
    },
    defaultProps: { src: "", fallback: "AB", size: "md" },
    render: ({ src, fallback, size }: any) => {
      const sizes: Record<string, string> = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
      return (
        <div className={`${sizes[size] || sizes.md} rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center overflow-hidden`}>
          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span className="text-violet-300 font-semibold">{fallback}</span>}
        </div>
      );
    },
  };

  components["badge"] = {
    fields: {
      text: { type: "text", label: "Text" },
      variant: { type: "select", label: "Variant", options: [
        { label: "Default", value: "default" }, { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" }, { label: "Success", value: "success" },
        { label: "Warning", value: "warning" }, { label: "Destructive", value: "destructive" },
      ]},
    },
    defaultProps: { text: "Badge", variant: "default" },
    render: ({ text, variant }: any) => {
      const styles: Record<string, string> = {
        default: "bg-violet-600/20 text-violet-300 border-violet-500/30",
        secondary: "bg-white/10 text-white/70 border-white/10",
        outline: "bg-transparent text-white/70 border-white/20",
        success: "bg-green-600/20 text-green-300 border-green-500/30",
        warning: "bg-yellow-600/20 text-yellow-300 border-yellow-500/30",
        destructive: "bg-red-600/20 text-red-300 border-red-500/30",
      };
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant] || styles.default}`}>{text}</span>;
    },
  };

  components["breadcrumb"] = {
    fields: {
      items: { type: "text", label: "Items (comma separated)" },
      separator: { type: "text", label: "Separator" },
    },
    defaultProps: { items: "Home, Products, Cart", separator: "/" },
    render: ({ items, separator }: any) => (
      <nav className="flex items-center gap-1.5 text-sm text-white/50">
        {items.split(",").map((item: string, i: number, arr: string[]) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={i === arr.length - 1 ? "text-white font-medium" : "hover:text-white cursor-pointer transition-colors"}>{item.trim()}</span>
            {i < arr.length - 1 && <span className="text-white/20">{separator}</span>}
          </span>
        ))}
      </nav>
    ),
  };

  components["button"] = {
    fields: {
      text: { type: "text", label: "Text" },
      variant: { type: "select", label: "Variant", options: [
        { label: "Default", value: "default" }, { label: "Destructive", value: "destructive" },
        { label: "Outline", value: "outline" }, { label: "Secondary", value: "secondary" },
        { label: "Ghost", value: "ghost" }, { label: "Link", value: "link" },
      ]},
      size: { type: "select", label: "Size", options: [
        { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" },
      ]},
    },
    defaultProps: { text: "Button", variant: "default", size: "md" },
    render: ({ text, variant, size }: any) => {
      const variants: Record<string, string> = {
        default: "bg-white text-black hover:bg-white/90",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-white/20 text-white hover:bg-white/10",
        secondary: "bg-white/10 text-white hover:bg-white/20",
        ghost: "text-white hover:bg-white/10",
        link: "text-violet-400 underline-offset-4 hover:underline",
      };
      const sizes: Record<string, string> = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };
      return <button className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors ${variants[variant] || variants.default} ${sizes[size] || sizes.md}`}>{text}</button>;
    },
  };

  components["buttonGroup"] = {
    fields: {
      buttons: { type: "text", label: "Buttons (comma separated)" },
      variant: { type: "select", label: "Variant", options: [
        { label: "Default", value: "default" }, { label: "Outline", value: "outline" },
      ]},
    },
    defaultProps: { buttons: "Save, Cancel, Delete", variant: "default" },
    render: ({ buttons, variant }: any) => (
      <div className="flex gap-2">
        {buttons.split(",").map((btn: string, i: number) => (
          <button key={i} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            variant === "outline" ? "border border-white/20 text-white hover:bg-white/10" : "bg-white text-black hover:bg-white/90"
          }`}>{btn.trim()}</button>
        ))}
      </div>
    ),
  };

  components["calendar"] = {
    fields: {
      month: { type: "text", label: "Month" },
      year: { type: "number", label: "Year" },
    },
    defaultProps: { month: "July", year: 2026 },
    render: ({ month, year }: any) => {
      const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      const numDays = 31;
      return (
        <div className="w-[280px] p-3 rounded-xl border border-white/10 bg-white/5">
          <div className="text-center text-sm font-semibold text-white mb-3">{month} {year}</div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {days.map((d) => <div key={d} className="text-center text-[10px] text-white/30 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: numDays }, (_, i) => (
              <button key={i} className={`text-xs py-1.5 rounded-lg hover:bg-white/10 ${i + 1 === 8 ? "bg-violet-600 text-white" : "text-white/70"}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      );
    },
  };

  components["card"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
      content: { type: "text", label: "Content" },
    },
    defaultProps: { title: "Card Title", description: "Card description goes here.", content: "" },
    render: ({ title, description, content }: any) => (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
        {content && <div className="mt-4 text-sm text-white/50">{content}</div>}
      </div>
    ),
  };

  components["carousel"] = {
    fields: {
      images: { type: "text", label: "Image URLs (comma separated)" },
      autoPlay: { type: "boolean", label: "Auto Play" },
    },
    defaultProps: { images: "", autoPlay: false },
    render: ({ images }: any) => {
      const imgs = images ? images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      return (
        <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {(imgs.length ? imgs : ["placeholder"]).map((src: string, i: number) => (
              <div key={i} className="snap-center shrink-0 w-full h-64 flex items-center justify-center">
                {src === "placeholder" ? (
                  <div className="text-white/20 text-sm">Add images in properties</div>
                ) : (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {(imgs.length ? imgs : [0]).map((_: any, i: number) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </div>
      );
    },
  };

  components["checkbox"] = {
    fields: {
      label: { type: "text", label: "Label" },
      checked: { type: "boolean", label: "Checked" },
    },
    defaultProps: { label: "Accept terms and conditions", checked: false },
    render: ({ label, checked }: any) => (
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? "bg-violet-600 border-violet-600" : "border-white/20 group-hover:border-white/40"
        }`}>
          {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className="text-sm text-white/80">{label}</span>
      </label>
    ),
  };

  components["collapsible"] = {
    fields: {
      title: { type: "text", label: "Title" },
      content: { type: "text", label: "Content" },
    },
    defaultProps: { title: "Collapsible Section", content: "This is the collapsible content." },
    render: ({ title, content }: any) => (
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5">
          <span className="text-sm font-medium text-white">{title}</span>
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        <div className="px-4 pb-4 text-sm text-white/60">{content}</div>
      </div>
    ),
  };

  components["combobox"] = {
    fields: {
      placeholder: { type: "text", label: "Placeholder" },
      options: { type: "text", label: "Options (comma separated)" },
    },
    defaultProps: { placeholder: "Select framework...", options: "React, Vue, Angular, Svelte" },
    render: ({ placeholder, options }: any) => (
      <div className="w-[300px]">
        <div className="relative">
          <input type="text" placeholder={placeholder} className="w-full h-10 px-3 pr-8 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" readOnly />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    ),
  };

  components["command"] = {
    fields: {
      placeholder: { type: "text", label: "Placeholder" },
    },
    defaultProps: { placeholder: "Type a command or search..." },
    render: ({ placeholder }: any) => (
      <div className="w-[400px] rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder={placeholder} className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none" readOnly />
        </div>
        <div className="p-2 text-xs text-white/30">No results found.</div>
      </div>
    ),
  };

  components["dialog"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
    },
    defaultProps: { title: "Edit Profile", description: "Make changes to your profile here." },
    render: ({ title, description }: any) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/60 mt-1">{description}</p>
          <div className="mt-4 h-32 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/20">Content slot</div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/10">Cancel</button>
            <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90">Save</button>
          </div>
        </div>
      </div>
    ),
  };

  components["drawer"] = {
    fields: {
      title: { type: "text", label: "Title" },
      side: { type: "select", label: "Side", options: [
        { label: "Right", value: "right" }, { label: "Left", value: "left" },
      ]},
    },
    defaultProps: { title: "Drawer", side: "right" },
    render: ({ title, side }: any) => (
      <div className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-[350px] bg-gray-900 border-${side === "left" ? "r" : "l"} border-white/10 p-6 shadow-2xl z-50`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white">{title}</h3>
          <button className="text-white/40 hover:text-white">✕</button>
        </div>
        <div className="text-sm text-white/40">Drawer content goes here.</div>
      </div>
    ),
  };

  components["dropdownMenu"] = {
    fields: {
      trigger: { type: "text", label: "Trigger Text" },
      items: { type: "text", label: "Menu Items (comma separated)" },
    },
    defaultProps: { trigger: "Options", items: "Edit, Duplicate, Delete" },
    render: ({ trigger, items }: any) => (
      <div className="relative inline-block">
        <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white hover:bg-white/10">{trigger}</button>
        <div className="absolute top-full mt-1 left-0 w-48 bg-gray-900 border border-white/10 rounded-xl p-1 shadow-xl">
          {items.split(",").map((item: string, i: number) => (
            <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">{item.trim()}</button>
          ))}
        </div>
      </div>
    ),
  };

  components["form"] = {
    fields: {
      title: { type: "text", label: "Form Title" },
      fields: { type: "text", label: "Fields (comma separated)" },
    },
    defaultProps: { title: "Contact Form", fields: "Name, Email, Message" },
    render: ({ title, fields }: any) => (
      <div className="w-full max-w-md p-6 rounded-xl border border-white/10 bg-white/5">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-3">
          {fields.split(",").map((f: string, i: number) => (
            <div key={i}>
              <label className="text-xs text-white/50 mb-1 block">{f.trim()}</label>
              <input type="text" className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" placeholder={`Enter ${f.trim().toLowerCase()}...`} />
            </div>
          ))}
          <button className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">Submit</button>
        </div>
      </div>
    ),
  };

  components["hoverCard"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
    },
    defaultProps: { title: "Hover Card", description: "Hover over me to see more info" },
    render: ({ title, description }: any) => (
      <div className="group relative inline-block">
        <span className="text-sm text-violet-400 underline underline-offset-4 cursor-pointer">{description}</span>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-4 rounded-xl border border-white/10 bg-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
          <p className="text-xs text-white/50">This is a hover card with additional content.</p>
        </div>
      </div>
    ),
  };

  components["input"] = {
    fields: {
      placeholder: { type: "text", label: "Placeholder" },
      label: { type: "text", label: "Label" },
      type: { type: "select", label: "Type", options: [
        { label: "Text", value: "text" }, { label: "Email", value: "email" },
        { label: "Password", value: "password" }, { label: "Number", value: "number" },
      ]},
    },
    defaultProps: { placeholder: "Enter text...", label: "", type: "text" },
    render: ({ placeholder, label, type }: any) => (
      <div className="w-full max-w-sm">
        {label && <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>}
        <input type={type} placeholder={placeholder} className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" />
      </div>
    ),
  };

  components["inputGroup"] = {
    fields: {
      label: { type: "text", label: "Label" },
      placeholder: { type: "text", label: "Placeholder" },
      addon: { type: "text", label: "Addon Text" },
    },
    defaultProps: { label: "Website", placeholder: "example.com", addon: "https://" },
    render: ({ label, placeholder, addon }: any) => (
      <div className="w-full max-w-sm">
        {label && <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>}
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-white/10 text-xs text-white/50">{addon}</span>
          <input type="text" placeholder={placeholder} className="flex-1 h-10 px-3 rounded-r-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
        </div>
      </div>
    ),
  };

  components["inputOTP"] = {
    fields: {
      length: { type: "number", label: "Length" },
    },
    defaultProps: { length: 6 },
    render: ({ length }: any) => (
      <div className="flex gap-2">
        {Array.from({ length }, (_, i) => (
          <input key={i} type="text" maxLength={1} className="w-10 h-12 text-center text-lg font-mono rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50" />
        ))}
      </div>
    ),
  };

  components["kbd"] = {
    fields: {
      keys: { type: "text", label: "Keys (e.g. Ctrl+K)" },
    },
    defaultProps: { keys: "Ctrl+K" },
    render: ({ keys }: any) => (
      <div className="inline-flex items-center gap-1">
        {keys.split("+").map((key: string, i: number) => (
          <span key={i} className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-white/20 bg-white/10 text-[11px] font-mono text-white/70 shadow-sm">
            {key.trim()}
          </span>
        ))}
      </div>
    ),
  };

  components["label"] = {
    fields: {
      text: { type: "text", label: "Label Text" },
      required: { type: "boolean", label: "Required" },
    },
    defaultProps: { text: "Email Address", required: false },
    render: ({ text, required }: any) => (
      <label className="text-sm font-medium text-white/80">
        {text}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    ),
  };

  components["progress"] = {
    fields: {
      value: { type: "number", label: "Value (0-100)" },
      label: { type: "text", label: "Label" },
    },
    defaultProps: { value: 60, label: "" },
    render: ({ value, label }: any) => (
      <div className="w-full max-w-sm">
        {label && <div className="flex justify-between text-xs text-white/50 mb-1.5"><span>{label}</span><span>{value}%</span></div>}
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        </div>
      </div>
    ),
  };

  components["radioGroup"] = {
    fields: {
      options: { type: "text", label: "Options (comma separated)" },
      defaultValue: { type: "text", label: "Default Value" },
    },
    defaultProps: { options: "Option A, Option B, Option C", defaultValue: "Option A" },
    render: ({ options, defaultValue }: any) => (
      <div className="space-y-2">
        {options.split(",").map((opt: string, i: number) => (
          <label key={i} className="flex items-center gap-2.5 cursor-pointer">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              opt.trim() === defaultValue ? "border-violet-500" : "border-white/20"
            }`}>
              {opt.trim() === defaultValue && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
            </div>
            <span className="text-sm text-white/80">{opt.trim()}</span>
          </label>
        ))}
      </div>
    ),
  };

  components["scrollArea"] = {
    fields: {
      content: { type: "text", label: "Content" },
      height: { type: "text", label: "Height" },
    },
    defaultProps: { content: "Scrollable content area. Add long text here to see scrolling in action.", height: "200px" },
    render: ({ content, height }: any) => (
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 overflow-y-auto" style={{ height }}>
        <div className="p-4 text-sm text-white/60 leading-relaxed">{content}</div>
      </div>
    ),
  };

  components["select"] = {
    fields: {
      placeholder: { type: "text", label: "Placeholder" },
      options: { type: "text", label: "Options (comma separated)" },
      label: { type: "text", label: "Label" },
    },
    defaultProps: { placeholder: "Select an option", options: "Option 1, Option 2, Option 3", label: "" },
    render: ({ placeholder, options, label }: any) => (
      <div className="w-full max-w-sm">
        {label && <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>}
        <select className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none">
          <option value="" className="bg-gray-900">{placeholder}</option>
          {options.split(",").map((opt: string, i: number) => (
            <option key={i} value={opt.trim()} className="bg-gray-900">{opt.trim()}</option>
          ))}
        </select>
      </div>
    ),
  };

  components["separator"] = {
    fields: {
      orientation: { type: "select", label: "Orientation", options: [
        { label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" },
      ]},
    },
    defaultProps: { orientation: "horizontal" },
    render: ({ orientation }: any) => (
      <div className={`${orientation === "vertical" ? "w-px h-full" : "h-px w-full"} bg-white/10`} />
    ),
  };

  components["sheet"] = {
    fields: {
      title: { type: "text", label: "Title" },
      side: { type: "select", label: "Side", options: [
        { label: "Right", value: "right" }, { label: "Left", value: "left" },
        { label: "Top", value: "top" }, { label: "Bottom", value: "bottom" },
      ]},
    },
    defaultProps: { title: "Sheet Panel", side: "right" },
    render: ({ title, side }: any) => {
      const pos: Record<string, string> = {
        right: "top-0 right-0 h-full w-[400px] border-l",
        left: "top-0 left-0 h-full w-[400px] border-r",
        top: "top-0 left-0 w-full h-[300px] border-b",
        bottom: "bottom-0 left-0 w-full h-[300px] border-t",
      };
      return (
        <div className={`fixed ${pos[side]} bg-gray-900 border-white/10 p-6 shadow-2xl z-50`}>
          <h3 className="font-semibold text-white mb-4">{title}</h3>
          <div className="text-sm text-white/40">Sheet content goes here.</div>
        </div>
      );
    },
  };

  components["skeleton"] = {
    fields: {
      width: { type: "text", label: "Width" },
      height: { type: "text", label: "Height" },
    },
    defaultProps: { width: "100%", height: "20px" },
    render: ({ width, height }: any) => (
      <div className="rounded-lg bg-white/5 animate-pulse" style={{ width, height }} />
    ),
  };

  components["slider"] = {
    fields: {
      min: { type: "number", label: "Min" },
      max: { type: "number", label: "Max" },
      defaultValue: { type: "number", label: "Default Value" },
      label: { type: "text", label: "Label" },
    },
    defaultProps: { min: 0, max: 100, defaultValue: 50, label: "" },
    render: ({ min, max, defaultValue, label }: any) => (
      <div className="w-full max-w-sm">
        {label && <div className="flex justify-between text-xs text-white/50 mb-1.5"><span>{label}</span><span>{defaultValue}</span></div>}
        <input type="range" min={min} max={max} defaultValue={defaultValue} className="w-full h-2 rounded-full appearance-none bg-white/10 accent-violet-600" />
      </div>
    ),
  };

  components["sonner"] = {
    fields: {
      message: { type: "text", label: "Message" },
      variant: { type: "select", label: "Variant", options: [
        { label: "Default", value: "default" }, { label: "Success", value: "success" },
        { label: "Error", value: "error" },
      ]},
    },
    defaultProps: { message: "Event has been created", variant: "default" },
    render: ({ message, variant }: any) => {
      const styles: Record<string, string> = {
        default: "bg-gray-900 text-white", success: "bg-green-900/90 text-green-200",
        error: "bg-red-900/90 text-red-200",
      };
      return (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl border border-white/10 ${styles[variant]}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      );
    },
  };

  components["spinner"] = {
    fields: {
      size: { type: "select", label: "Size", options: [
        { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" },
      ]},
    },
    defaultProps: { size: "md" },
    render: ({ size }: any) => {
      const sizes: Record<string, string> = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
      return (
        <div className={`${sizes[size]} border-2 border-white/20 border-t-violet-500 rounded-full animate-spin`} />
      );
    },
  };

  components["switch"] = {
    fields: {
      label: { type: "text", label: "Label" },
      checked: { type: "boolean", label: "Checked" },
    },
    defaultProps: { label: "Airplane Mode", checked: false },
    render: ({ label, checked }: any) => (
      <label className="flex items-center gap-3 cursor-pointer">
        <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-violet-600" : "bg-white/20"}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
        </div>
        <span className="text-sm text-white/80">{label}</span>
      </label>
    ),
  };

  components["table"] = {
    fields: {
      headers: { type: "text", label: "Headers (comma separated)" },
      rows: { type: "text", label: "Rows (semicolon separated, comma per cell)" },
    },
    defaultProps: { headers: "Name, Email, Role", rows: "John Doe,john@example.com,Admin;Jane Smith,jane@example.com,Editor" },
    render: ({ headers, rows }: any) => (
      <div className="w-full rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {headers.split(",").map((h: string, i: number) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-white/60">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.split(";").map((row: string, ri: number) => (
              <tr key={ri} className="border-b border-white/5 hover:bg-white/[0.02]">
                {row.split(",").map((cell: string, ci: number) => (
                  <td key={ci} className="px-4 py-3 text-white/70">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };

  components["tabs"] = {
    fields: {
      tabs: { type: "text", label: "Tab Labels (comma separated)" },
      defaultValue: { type: "text", label: "Default Tab" },
    },
    defaultProps: { tabs: "Account, Password, Notifications", defaultValue: "Account" },
    render: ({ tabs, defaultValue }: any) => {
      const tabList = tabs.split(",").map((t: string) => t.trim());
      return (
        <div className="w-full">
          <div className="flex border-b border-white/10">
            {tabList.map((tab: string) => (
              <button key={tab} className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === defaultValue ? "text-white border-b-2 border-violet-500" : "text-white/40 hover:text-white/70"
              }`}>{tab}</button>
            ))}
          </div>
          <div className="p-4 text-sm text-white/40">Tab content for {defaultValue}</div>
        </div>
      );
    },
  };

  components["textarea"] = {
    fields: {
      placeholder: { type: "text", label: "Placeholder" },
      label: { type: "text", label: "Label" },
      rows: { type: "number", label: "Rows" },
    },
    defaultProps: { placeholder: "Enter your message...", label: "", rows: 4 },
    render: ({ placeholder, label, rows }: any) => (
      <div className="w-full max-w-sm">
        {label && <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>}
        <textarea placeholder={placeholder} rows={rows} className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" />
      </div>
    ),
  };

  components["toggle"] = {
    fields: {
      pressed: { type: "boolean", label: "Pressed" },
      label: { type: "text", label: "Label" },
    },
    defaultProps: { pressed: false, label: "Bold" },
    render: ({ pressed, label }: any) => (
      <button className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        pressed ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
      }`}>{label}</button>
    ),
  };

  components["toggleGroup"] = {
    fields: {
      options: { type: "text", label: "Options (comma separated)" },
    },
    defaultProps: { options: "Bold, Italic, Underline" },
    render: ({ options }: any) => (
      <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
        {options.split(",").map((opt: string, i: number) => (
          <button key={i} className={`px-3 py-2 text-sm font-medium transition-colors ${
            i === 0 ? "bg-violet-600/20 text-violet-300" : "bg-white/5 text-white/60 hover:bg-white/10"
          } ${i > 0 ? "border-l border-white/10" : ""}`}>{opt.trim()}</button>
        ))}
      </div>
    ),
  };

  components["tooltip"] = {
    fields: {
      text: { type: "text", label: "Tooltip Text" },
      content: { type: "text", label: "Trigger Content" },
    },
    defaultProps: { text: "This is a tooltip", content: "Hover me" },
    render: ({ text, content }: any) => (
      <div className="group relative inline-block">
        <span className="text-sm text-white/70 cursor-pointer">{content}</span>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-900 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1 border-r border-b border-white/10" />
        </div>
      </div>
    ),
  };

  components["typography"] = {
    fields: {
      text: { type: "text", label: "Text" },
      variant: { type: "select", label: "Variant", options: [
        { label: "H1", value: "h1" }, { label: "H2", value: "h2" },
        { label: "H3", value: "h3" }, { label: "H4", value: "h4" },
        { label: "Paragraph", value: "p" }, { label: "Lead", value: "lead" },
        { label: "Large", value: "large" }, { label: "Small", value: "small" },
        { label: "Muted", value: "muted" },
      ]},
    },
    defaultProps: { text: "The quick brown fox jumps over the lazy dog.", variant: "p" },
    render: ({ text, variant }: any) => {
      const styles: Record<string, string> = {
        h1: "text-4xl font-extrabold tracking-tight",
        h2: "text-3xl font-bold tracking-tight",
        h3: "text-2xl font-semibold tracking-tight",
        h4: "text-xl font-semibold",
        p: "text-base text-white/80 leading-7",
        lead: "text-xl text-white/60 leading-relaxed",
        large: "text-lg font-semibold",
        small: "text-sm font-medium",
        muted: "text-sm text-white/40",
      };
      return <div className={`${styles[variant] || styles.p} text-white`}>{text}</div>;
    },
  };

  // ============================================================
  // LANDING PAGE BLOCKS
  // ============================================================

  components["heroSection"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      ctaText: { type: "text", label: "CTA Text" },
      ctaSecondary: { type: "text", label: "Secondary CTA" },
    },
    defaultProps: { title: "Design. Build. Ship.", subtitle: "The modern creative platform for teams who move fast.", ctaText: "Start for free", ctaSecondary: "Watch demo" },
    render: ({ title, subtitle, ctaText, ctaSecondary }: any) => (
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="absolute inset-0 bg-[#09090b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in public beta
          </div>
          <h1 className="text-6xl sm:text-7xl font-bold tracking-[-0.03em] text-white mb-6 leading-[1.1]">
            {title}
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {subtitle}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              {ctaText}
            </button>
            {ctaSecondary && (
              <button className="px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                {ctaSecondary}
              </button>
            )}
          </div>
        </div>
      </section>
    ),
  };

  components["featureGrid"] = {
    fields: {
      title: { type: "text", label: "Section Title" },
      subtitle: { type: "text", label: "Subtitle" },
      features: { type: "text", label: "Features (pipe: icon|title|desc;)" },
    },
    defaultProps: { title: "Everything you need", subtitle: "Built for modern teams.", features: "✦|Blazing Fast|Sub-millisecond response times with edge caching worldwide.;🔒|Secure by Default|SOC 2 compliant with end-to-end encryption.;🎨|Design System|Consistent components that scale with your product.;📊|Real-time Analytics|Live dashboards with actionable insights.;🌍|Global Edge|Deploy to 50+ regions with zero configuration.;🚀|One-Click Deploy|From code to production in seconds." },
    render: ({ title, subtitle, features }: any) => (
      <section className="py-32 px-6 bg-[#09090b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
            {subtitle && <p className="text-lg text-white/40 max-w-lg mx-auto">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {features.split(";").filter(Boolean).map((item: string, i: number) => {
              const [icon, featTitle, desc] = item.split("|");
              return (
                <div key={i} className="p-8 bg-[#09090b] hover:bg-white/[0.02] transition-colors duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 mb-5 group-hover:border-white/20 transition-colors">
                    <span className="text-sm">{icon}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{featTitle}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["ctaBox"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
      buttonText: { type: "text", label: "Button Text" },
    },
    defaultProps: { title: "Start building today", description: "Free forever. No credit card required.", buttonText: "Get started" },
    render: ({ title, description, buttonText }: any) => (
      <section className="py-32 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl opacity-50" />
          <div className="relative text-center py-20 px-12 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
            <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">{description}</p>
            <button className="px-8 py-3.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              {buttonText}
            </button>
          </div>
        </div>
      </section>
    ),
  };

  components["pricingTable"] = {
    fields: {
      title: { type: "text", label: "Section Title" },
      subtitle: { type: "text", label: "Subtitle" },
      plans: { type: "text", label: "Plans (semicolon: name|price|desc|features|cta)" },
    },
    defaultProps: { title: "Simple pricing", subtitle: "No hidden fees. Cancel anytime.", plans: "Starter|$0|For individuals|1 project, Basic analytics, Community support|Get started;Pro|$29/mo|For teams|10 projects, Advanced analytics, Priority support, API access|Start trial;Enterprise|$99/mo|For organizations|Unlimited projects, Custom analytics, Dedicated support, SSO, SLA|Contact sales" },
    render: ({ title, subtitle, plans }: any) => (
      <section className="py-32 px-6 bg-[#09090b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
            {subtitle && <p className="text-lg text-white/40">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.split(";").map((plan: string, i: number) => {
              const [name, price, desc, features, cta] = plan.split("|");
              const isPopular = i === 1;
              return (
                <div key={i} className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  isPopular
                    ? "border-white/20 bg-white/[0.04] shadow-[0_0_80px_rgba(255,255,255,0.05)] scale-[1.02]"
                    : "border-white/5 bg-white/[0.01] hover:border-white/10"
                }`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-black text-[11px] font-semibold tracking-wide">
                      Most popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
                    <p className="text-sm text-white/40 mb-4">{desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white tracking-tight">{price.split("/")[0]}</span>
                      {price.includes("/") && <span className="text-sm text-white/30">/{price.split("/")[1]}</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.split(",").map((f: string, fi: number) => (
                      <li key={fi} className="flex items-center gap-3 text-sm text-white/50">
                        <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f.trim()}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isPopular
                      ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      : "border border-white/10 text-white hover:bg-white/5"
                  }`}>{cta}</button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["testimonialCard"] = {
    fields: {
      quote: { type: "text", label: "Quote" },
      author: { type: "text", label: "Author" },
      role: { type: "text", label: "Role" },
      company: { type: "text", label: "Company" },
    },
    defaultProps: { quote: "WonderBuild cut our shipping time from weeks to hours. It's the tool we always wished we had.", author: "Sarah Chen", role: "Head of Engineering", company: "Vercel" },
    render: ({ quote, author, role, company }: any) => (
      <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors duration-300" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} className="w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          ))}
        </div>
        <p className="text-white/70 text-base leading-relaxed mb-8">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/60 text-sm font-semibold border border-white/10">
            {author.split(" ").map((n: string) => n[0]).join("")}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{author}</div>
            <div className="text-xs text-white/30">{role}{company ? `, ${company}` : ""}</div>
          </div>
        </div>
      </div>
    ),
  };

  components["statsSection"] = {
    fields: {
      stats: { type: "text", label: "Stats (pipe: value|label;)" },
    },
    defaultProps: { stats: "10,000+|Active developers;99.99%|Uptime SLA;500K+|Projects shipped;4.9/5|Average rating" },
    render: ({ stats }: any) => (
      <section className="py-24 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden max-w-5xl mx-auto">
          {stats.split(";").filter(Boolean).map((item: string, i: number) => {
            const [value, label] = item.split("|");
            return (
              <div key={i} className="p-8 bg-[#09090b] text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">{value}</div>
                <div className="text-sm text-white/30">{label}</div>
              </div>
            );
          })}
        </div>
      </section>
    ),
  };

  components["teamGrid"] = {
    fields: {
      title: { type: "text", label: "Section Title" },
      members: { type: "text", label: "Members (pipe: name|role|avatar;)" },
    },
    defaultProps: { title: "Meet the team", members: "Alex Chen|CEO & Co-founder|AC|Maria Santos|CTO|MS|James Wilson|Head of Design|JW|Priya Patel|Head of Product|PP" },
    render: ({ title, members }: any) => (
      <section className="py-32 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {members.split(";").filter(Boolean).map((m: string, i: number) => {
              const [name, role, initials] = m.split("|");
              return (
                <div key={i} className="group text-center">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center text-white/60 text-xl font-semibold mx-auto mb-4 group-hover:border-white/20 transition-colors duration-300">
                    {initials}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">{name}</h3>
                  <p className="text-xs text-white/30">{role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["logoCloud"] = {
    fields: {
      logos: { type: "text", label: "Logo Names (comma separated)" },
    },
    defaultProps: { logos: "Vercel, Next.js, Tailwind, Prisma, Supabase" },
    render: ({ logos }: any) => (
      <section className="py-16 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <p className="text-center text-[11px] text-white/25 uppercase tracking-[0.2em] font-medium mb-10">Trusted by the best teams</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 max-w-3xl mx-auto">
          {logos.split(",").map((logo: string, i: number) => (
            <div key={i} className="text-lg font-semibold text-white/15 hover:text-white/30 transition-colors duration-300 tracking-tight">{logo.trim()}</div>
          ))}
        </div>
      </section>
    ),
  };

  components["masonryGallery"] = {
    fields: {
      images: { type: "text", label: "Image URLs (comma separated)" },
      columns: { type: "select", label: "Columns", options: [
        { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" },
      ]},
    },
    defaultProps: { images: "", columns: "3" },
    render: ({ images, columns }: any) => {
      const imgs = images ? images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      return (
        <div className={`grid gap-3 grid-cols-${columns}`}>
          {(imgs.length ? imgs : ["", "", "", "", ""]).map((src: string, i: number) => (
            <div key={i} className={`rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden ${i % 3 === 0 ? "h-48" : "h-32"}`}>
              {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/15 text-[11px]">Image {i + 1}</div>}
            </div>
          ))}
        </div>
      );
    },
  };

  components["bentoGrid"] = {
    fields: {
      items: { type: "text", label: "Items (pipe: icon|title|desc;)" },
    },
    defaultProps: { items: "✦|Design System|Consistent, composable components|⚡|Performance|Sub-millisecond renders|🔒|Security|SOC 2 compliant|📊|Analytics|Real-time insights|🌍|Global CDN|50+ edge regions|🚀|Deploy|Zero-config shipping" },
    render: ({ items }: any) => (
      <section className="py-24 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {items.split(";").filter(Boolean).map((item: string, i: number) => {
            const [icon, title, desc] = item.split("|");
            return (
              <div key={i} className={`group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 ${i === 0 ? "md:col-span-2 md:p-8" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 mb-4 group-hover:border-white/20 transition-colors">
                  <span className="text-sm">{icon}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-1 tracking-tight">{title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),
  };

  components["footerSections"] = {
    fields: {
      brand: { type: "text", label: "Brand Name" },
      tagline: { type: "text", label: "Tagline" },
      columns: { type: "text", label: "Columns (pipe: title|links;)" },
    },
    defaultProps: { brand: "WonderBuild", tagline: "Design, build, and ship — faster.", columns: "Product|Features, Pricing, Changelog, Docs, Roadmap|Company|About, Blog, Careers, Press Kit|Resources|Community, Help Center, Partners, Status|Legal|Privacy, Terms, Security, Cookies" },
    render: ({ brand, tagline, columns }: any) => (
      <footer className="border-t border-white/5 bg-[#09090b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-bold text-white tracking-tight mb-2">{brand}</div>
              <p className="text-sm text-white/30 leading-relaxed">{tagline}</p>
            </div>
            {columns.split(";").filter(Boolean).map((col: string, i: number) => {
              const [title, links] = col.split("|");
              return (
                <div key={i}>
                  <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{title}</h4>
                  <ul className="space-y-2.5">
                    {links.split(",").map((link: string, li: number) => (
                      <li key={li}>
                        <a className="text-sm text-white/30 hover:text-white transition-colors duration-200">{link.trim()}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
            <p className="text-xs text-white/20">© {new Date().getFullYear()} {brand}. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {["GitHub", "Twitter", "Discord"].map((social) => (
                <a key={social} className="text-xs text-white/20 hover:text-white/40 transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    ),
  };

  components["blogPreviewGrid"] = {
    fields: {
      posts: { type: "text", label: "Posts (pipe: title|excerpt|date)" },
    },
    defaultProps: { posts: "Getting Started with WonderBuild|Learn the basics of our platform.|2026-01-15;Advanced AI Features|Explore powerful AI tools.|2026-02-20;3D Scene Creation|Build immersive worlds.|2026-03-10" },
    render: ({ posts }: any) => (
      <section className="py-24 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">Latest Updates</h2>
            <p className="text-lg text-white/35">News, guides, and product updates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.split(";").filter(Boolean).map((post: string, i: number) => {
              const [title, excerpt, date] = post.split("|");
              return (
                <article key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer">
                  <div className="h-40 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-b border-white/5" />
                  <div className="p-6">
                    <p className="text-[11px] text-white/25 mb-3 font-medium">{date}</p>
                    <h3 className="text-base font-semibold text-white mb-2 tracking-tight group-hover:text-white/90 transition-colors">{title}</h3>
                    <p className="text-sm text-white/30 leading-relaxed">{excerpt}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/25 group-hover:text-white/40 transition-colors">
                      Read more
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["newsletterStrip"] = {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "text", label: "Description" },
      buttonText: { type: "text", label: "Button Text" },
    },
    defaultProps: { title: "Stay updated", description: "Get the latest news and updates.", buttonText: "Subscribe" },
    render: ({ title, description, buttonText }: any) => (
      <section className="py-20 px-6 border-y border-white/5 bg-white/[0.01]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white mb-3">{title}</h2>
          <p className="text-sm text-white/30 mb-8">{description}</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
            <button className="px-6 h-11 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              {buttonText}
            </button>
          </div>
        </div>
      </section>
    ),
  };

  components["accordionFAQ"] = {
    fields: {
      title: { type: "text", label: "Section Title" },
      items: { type: "text", label: "Items (pipe: question|answer;)" },
    },
    defaultProps: { title: "Frequently asked questions", items: "What is WonderBuild?|A modern creative platform that helps teams design, build, and ship products faster with AI-powered tools.;Is there a free tier?|Yes! The Starter plan is free forever with no credit card required.Upgrade anytime.;Can I migrate from other tools?|Absolutely. We provide one-click migration from Figma, Webflow, and custom setups.;How does the AI assistant work?|Our AI analyzes your design intent and generates production-ready code, layouts, and components in real-time." },
    render: ({ title, items }: any) => (
      <section className="py-32 px-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white mb-4">{title}</h2>
          </div>
          <div className="space-y-2">
            {items.split(";").filter(Boolean).map((item: string, i: number) => {
              const [q, a] = item.split("|");
              return (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden group">
                  <div className="flex items-center justify-between px-6 py-5 cursor-pointer">
                    <span className="text-sm font-medium text-white pr-4">{q}</span>
                    <svg className="w-4 h-4 text-white/20 shrink-0 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed">{a}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
  };

  components["stickyHeader"] = {
    fields: {
      brand: { type: "text", label: "Brand" },
      links: { type: "text", label: "Nav Links (comma separated)" },
      ctaText: { type: "text", label: "CTA Text" },
    },
    defaultProps: { brand: "WonderBuild", links: "Features, Pricing, Docs", ctaText: "Get Started" },
    render: ({ brand, links, ctaText }: any) => (
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <span className="text-base font-bold text-white tracking-tight">{brand}</span>
        <nav className="hidden md:flex items-center gap-8">
          {links.split(",").map((link: string, i: number) => (
            <a key={i} className="text-[13px] text-white/35 hover:text-white transition-colors duration-200">{link.trim()}</a>
          ))}
        </nav>
        <button className="px-4 py-2 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors">{ctaText}</button>
      </header>
    ),
  };

  components["multiColumnFooter"] = {
    fields: {
      brand: { type: "text", label: "Brand" },
      columns: { type: "text", label: "Columns (pipe: title|links;)" },
    },
    defaultProps: { brand: "WonderBuild", columns: "Product|Features, Pricing, Changelog;Company|About, Blog, Careers;Legal|Privacy, Terms" },
    render: ({ brand, columns }: any) => (
      <footer className="border-t border-white/5 bg-[#09090b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <span className="text-sm font-bold text-white tracking-tight">{brand}</span>
            </div>
            {columns.split(";").filter(Boolean).map((col: string, i: number) => {
              const [title, links] = col.split("|");
              return (
                <div key={i}>
                  <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">{title}</h4>
                  <ul className="space-y-2">
                    {links.split(",").map((link: string, li: number) => (
                      <li key={li}>
                        <a className="text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200">{link.trim()}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 text-[11px] text-white/15">
            © {new Date().getFullYear()} {brand}. All rights reserved.
          </div>
        </div>
      </footer>
    ),
  };

  components["videoPlayer"] = {
    fields: {
      url: { type: "text", label: "Video URL" },
      title: { type: "text", label: "Title" },
    },
    defaultProps: { url: "", title: "Video" },
    render: ({ url, title }: any) => (
      <div className="relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {url ? (
          <video src={url} controls className="w-full aspect-video" title={title} />
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white/20 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <p className="text-sm text-white/40 font-medium">{title}</p>
            <p className="text-[11px] text-white/20 mt-1">Add video URL in properties</p>
          </div>
        )}
      </div>
    ),
  };

  // ============================================================
  // APPLICATION BLOCKS
  // ============================================================

  components["appShells"] = {
    fields: {
      title: { type: "text", label: "App Title" },
      navItems: { type: "text", label: "Nav Items (comma separated)" },
    },
    defaultProps: { title: "My App", navItems: "Dashboard, Projects, Settings" },
    render: ({ title, navItems }: any) => (
      <div className="min-h-[400px] flex rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="w-56 bg-white/[0.02] border-r border-white/5 p-4">
          <h3 className="font-semibold text-white text-sm mb-6 tracking-tight">{title}</h3>
          <nav className="space-y-0.5">
            {navItems.split(",").map((item: string, i: number) => (
              <div key={i} className={`px-3 py-2 rounded-xl text-[13px] transition-colors ${i === 0 ? "bg-white/[0.06] text-white" : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"}`}>{item.trim()}</div>
            ))}
          </nav>
        </div>
        <div className="flex-1 p-6">
          <div className="h-5 w-48 rounded-lg bg-white/[0.04] mb-6" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.04]" />)}
          </div>
        </div>
      </div>
    ),
  };

  components["signIn"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
    },
    defaultProps: { title: "Welcome back", subtitle: "Sign in to your account" },
    render: ({ title, subtitle }: any) => (
      <div className="w-full max-w-sm mx-auto p-8 rounded-2xl border border-white/5 bg-white/[0.02]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">{title}</h2>
        <p className="text-sm text-white/30 text-center mt-1.5 mb-8">{subtitle}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block font-medium">Email</label>
            <input type="email" className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block font-medium">Password</label>
            <input type="password" className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] transition-colors" />
          </div>
          <button className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors mt-2">Sign In</button>
        </div>
        <p className="text-[11px] text-white/20 text-center mt-5">Don't have an account? <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Sign up</span></p>
      </div>
    ),
  };

  components["signUp"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
    },
    defaultProps: { title: "Create account", subtitle: "Get started for free" },
    render: ({ title, subtitle }: any) => (
      <div className="w-full max-w-sm mx-auto p-8 rounded-2xl border border-white/5 bg-white/[0.02]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">{title}</h2>
        <p className="text-sm text-white/30 text-center mt-1.5 mb-8">{subtitle}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block font-medium">Name</label>
            <input type="text" className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block font-medium">Email</label>
            <input type="email" className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block font-medium">Password</label>
            <input type="password" className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] transition-colors" />
          </div>
          <button className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors mt-2">Create Account</button>
        </div>
        <p className="text-[11px] text-white/20 text-center mt-5">Already have an account? <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Sign in</span></p>
      </div>
    ),
  };

  // ============================================================
  // E-COMMERCE BLOCKS
  // ============================================================

  components["productCard"] = {
    fields: {
      name: { type: "text", label: "Product Name" },
      price: { type: "text", label: "Price" },
      description: { type: "text", label: "Description" },
    },
    defaultProps: { name: "Premium Headphones", price: "$299", description: "High-fidelity wireless headphones with noise cancellation." },
    render: ({ name, price, description }: any) => (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all duration-300 group" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="h-48 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
        <div className="p-6">
          <h3 className="text-base font-semibold text-white tracking-tight">{name}</h3>
          <p className="text-sm text-white/30 mt-1.5 leading-relaxed">{description}</p>
          <div className="flex items-center justify-between mt-5">
            <span className="text-lg font-bold text-white tracking-tight">{price}</span>
            <button className="px-4 py-2 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors">Add to Cart</button>
          </div>
        </div>
      </div>
    ),
  };

  components["shoppingCart"] = {
    fields: {
      items: { type: "text", label: "Items (pipe: name|price|qty;)" },
    },
    defaultProps: { items: "Wireless Mouse|$29.99|1;Keyboard|$79.99|1;Monitor|$399.99|1" },
    render: ({ items }: any) => (
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-white/[0.02] p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <h3 className="text-base font-semibold text-white mb-5 tracking-tight">Shopping Cart</h3>
        <div className="space-y-3">
          {items.split(";").filter(Boolean).map((item: string, i: number) => {
            const [name, price, qty] = item.split("|");
            return (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-sm text-white/70">{name}</p>
                  <p className="text-[11px] text-white/25 mt-0.5">Qty: {qty}</p>
                </div>
                <span className="text-sm font-medium text-white/60">{price}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-5 pt-5 border-t border-white/5">
          <span className="text-sm text-white/35">Total</span>
          <span className="text-base font-bold text-white">$509.97</span>
        </div>
        <button className="w-full mt-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">Checkout</button>
      </div>
    ),
  };

  return {
    components,
    categories,
  };
}

export default buildPuckConfig;
