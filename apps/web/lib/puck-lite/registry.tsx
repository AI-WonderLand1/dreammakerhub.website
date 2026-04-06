import React from "react";
import { Config } from "@puckeditor/core";

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
  marketing: {
    title: "Marketing",
    components: [
      "splitHero", "centerHero", "microHero", "logoCloud",
      "testimonialCard", "pricingTable", "featureGrid", "stepProcess",
      "cookieBanner", "pricingComparison"
    ],
  },
  composite: {
    title: "Composite Layouts",
    components: [
      "videoHero", "iconGrid", "cardHover", "featureList", "testimonialGrid",
      "logoMarquee", "accordionFAQ", "teamGrid", "statsSection",
      "newsletterStrip", "comparisonTable", "featureHighlightList",
      "testimonialCarousel", "floatingCTA", "userReviewSummary",
      "faqSingleColumn", "callToActionBox", "productShowcaseHero",
      "glassmorphicHero", "parallaxSection", "beforeAfterSlider",
      "videoBackgroundSection", "storyHero", "blogPreviewGrid",
      "timelineLayout", "tabbedContent", "masonryGallery",
      "simpleTable", "logoGridStatic", "contactSplit"
    ],
  },
  navigation: {
    title: "Navigation",
    components: [
      "megaMenu", "breadcrumbTrail", "paginationControls",
      "sideCommandPalette", "languageSwitcher", "mobileDrawer",
      "searchBar", "progressBar", "scrollIndicator", "socialLinks"
    ],
  },
  interactive: {
    title: "Interactive",
    components: [
      "glassAccordion", "tabsSystem", "imageLightbox",
      "parallaxScrollContainer", "customCursor", "hoverCard",
      "interactiveMap", "videoPlayer", "formWizard", "draggableCard"
    ],
  },
  overlays: {
    title: "Overlays",
    components: [
      "glassModal", "slideOverPanel", "notificationToast",
      "confettiTrigger", "floatingDock", "tooltipOverlay",
      "contextMenu", "loadingSpinner", "successMessage", "errorBanner"
    ],
  },
  ai: {
    title: "AI Components",
    components: [
      "thoughtBubble", "agentTerminal", "logicFlow", "modelStatus",
      "promptInput", "contextChip", "codeSandbox"
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
  content: {
    title: "Content Templates",
    components: [
      "blogPostDetail", "blogIndex", "documentationPage",
      "caseStudy", "pressRelease", "newsletterArchive",
      "tutorialPage", "authorProfile"
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
  data: {
    title: "Data & Storage",
    components: [
      "cloudConnectorForm", "userDashboardHome", "realtimeStream",
      "authForm", "bucketGallery", "databaseTable",
      "userPresence", "analyticsDashboard", "jsonTree"
    ],
  },
  experimental: {
    title: "Experimental",
    components: [
      "voiceVisualizer", "particleCanvas", "glitchText",
      "typewriterHero", "spotlightEffect", "confettiExplosion"
    ],
  },
};

// Build Puck config from registry
export function buildPuckConfig(): Config {
  const components: Record<string, any> = {};
  
  Object.entries(uiKitComponents).forEach(([name, config]) => {
    components[name] = config;
  });

  return {
    components,
    categories,
  };
}

export default buildPuckConfig;
