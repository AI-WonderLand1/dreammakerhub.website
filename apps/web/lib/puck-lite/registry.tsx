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
  basics: {
    title: "Basic Elements",
    components: [
      "button", "input", "typography", "badge", "heading", "blockquote",
      "kinetiText", "checkbox", "radioGroup", "switch", "slider",
      "floatingLabelInput", "skeleton", "progress", "tooltip",
      "badgeVariant", "avatar", "dotIndicator", "kbd", "divider",
      "iconWrapper", "link"
    ],
  },
  animations: {
    title: "Animations",
    components: [
      "fadeIn", "slideUp", "scaleIn", "bounce", "glitchText", 
      "typewriterHero", "confettiExplosion", "particleCanvas"
    ],
  },
  marketing: {
    title: "Marketing",
    components: [
      "splitHero", "centerHero", "microHero", "pricingTable", 
      "featureGrid", "logoCloud", "logoMarquee", "testimonialCard",
      "stepProcess", "statsSection", "ctaBox", "newsletterStrip"
    ],
  },
  interactive: {
    title: "Interactive",
    components: [
      "glassAccordion", "hoverCard", "tabsSystem", "videoPlayer",
      "accordionFAQ", "cardHover"
    ],
  },
  content: {
    title: "Content",
    components: [
      "blogPreviewGrid", "teamGrid", "testimonialCarousel", 
      "masonryGallery", "iconGrid", "timelineLayout"
    ],
  },
  layout: {
    title: "Layout",
    components: [
      "stickyHeader", "multiColumnFooter", "contactSplit",
      "glassmorphicHero", "parallaxSection", "beforeAfterSlider",
      "floatingCTA"
    ],
  },
  basicsCore: {
    title: "Basic Elements",
    components: [
      "button", "input", "typography", "heading", "badge",
      "blockquote", "checkbox", "switch", "slider", "progress",
      "skeleton", "floatingLabelInput"
    ],
  },
  templates: {
    title: "Full Page Templates",
    components: [
      "saaSLanding", "portfolioLanding", "newsletterLanding",
      "waitlistLanding", "productLaunchLanding", "agencyLanding",
      "appLanding", "eventLanding", "personalLanding", "ecommerceLanding"
    ],
  },
  dashboards: {
    title: "Dashboard Templates",
    components: [
      "analyticsDashboardTemplate", "userManagementTemplate",
      "agentControlTemplate", "projectManagementTemplate",
      "financialDashboardTemplate", "supportDashboardTemplate",
      "marketingDashboardTemplate", "inventoryDashboardTemplate",
      "settingsDashboardTemplate", "monitoringDashboardTemplate"
    ],
  },
  utility: {
    title: "Utility Pages",
    components: [
      "error404", "maintenancePage", "authFlow", "onboardingWizard",
      "contactPage", "termsPage", "privacyPage", "comingSoon",
      "searchResults", "feedbackForm", "maintenanceMode"
    ],
  },
  experimental: {
    title: "Experimental",
    components: [
      "glitchText", "typewriterHero", "confettiExplosion", "particleCanvas"
    ],
  },
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
      steps: { type: "text", label: "Steps (comma separated)" },
    },
    defaultProps: {
      steps: "Sign Up,Configure,Launch",
    },
    render: ({ steps }: any) => (
      <div className="flex items-center gap-4 p-6">
        {steps?.split(",").map((step: string, i: number) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <span className="text-white/80">{step.trim()}</span>
            </div>
            {i < (steps?.split(",").length || 0) - 1 && (
              <div className="flex-1 h-px bg-white/20" />
            )}
          </React.Fragment>
        ))}
      </div>
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
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <details className="group">
          <summary className="p-4 cursor-pointer text-white font-medium flex items-center justify-between">
            {title}
            <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-4 pb-4 text-white/60">{content}</div>
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
      <div className="relative group p-4 rounded-xl bg-white/5 border border-white/10">
        <span className="text-white/80">{title}</span>
        <div className="absolute left-0 bottom-full mb-2 w-48 p-3 rounded-lg bg-black/90 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm text-white/80">{content}</p>
        </div>
      </div>
    ),
  };

  components["tabsSystem"] = {
    fields: {
      tabs: { type: "text", label: "Tab Labels (comma separated)" },
    },
    defaultProps: {
      tabs: "Overview,Features,Pricing",
    },
    render: ({ tabs }: any) => {
      const tabList = tabs?.split(",").map((t: string) => t.trim()) || [];
      const [activeTab, setActiveTab] = React.useState(0);
      return (
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10">
            {tabList.map((tab: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === i 
                    ? 'text-white border-b-2 border-violet-500 bg-white/5' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4 text-white/80">
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
        className="h-64 rounded-xl overflow-hidden"
        style={{ background: bgColor }}
      >
        <canvas className="w-full h-full" />
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
    },
    defaultProps: {
      title: "Contact Us",
    },
    render: ({ title }: any) => (
      <div className="grid grid-cols-2 gap-8 p-8 rounded-xl bg-white/5 border border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/60 mb-6">Get in touch with us</p>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Name"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white"
            />
            <input 
              type="email" 
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white"
            />
            <textarea 
              placeholder="Message"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white resize-none"
            />
            <button className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg">
              Send Message
            </button>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl" />
      </div>
    ),
  };

  components["glassmorphicHero"] = {
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
    },
    defaultProps: {
      title: "Glassmorphic Hero",
      subtitle: "Beautiful glass effect",
    },
    render: ({ title, subtitle }: any) => (
      <div className="relative p-16 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl" />
        <div className="absolute inset-0 border border-white/20 rounded-2xl" />
        <div className="relative text-center">
          <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-xl text-white/70">{subtitle}</p>
        </div>
      </div>
    ),
  };

  components["parallaxSection"] = {
    fields: {
      title: { type: "text", label: "Title" },
    },
    defaultProps: {
      title: "Parallax Section",
    },
    render: ({ title }: any) => (
      <div 
        className="h-64 flex items-center justify-center rounded-xl"
        style={{
          backgroundImage: 'linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
        }}
      >
        <h2 className="text-3xl font-bold text-white">{title}</h2>
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

  return {
    components,
    categories,
  };
}

export default buildPuckConfig;
