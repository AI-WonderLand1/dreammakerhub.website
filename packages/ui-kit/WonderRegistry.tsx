import React from 'react';
import { Button } from './components/basics/Button';
console.log('Button:', Button);
import { Input } from './components/basics/Input';
import { Typography } from './components/basics/Typography';
import { Badge } from './components/basics/Badge';
import { Heading } from './components/basics/Heading';
import { Blockquote } from './components/basics/Blockquote';
import { KinetiText } from './components/basics/KinetiText';
import { Checkbox } from './components/basics/Checkbox';
import { RadioGroup } from './components/basics/RadioGroup';
import { Switch } from './components/basics/Switch';
import { Slider } from './components/basics/Slider';
import { FloatingLabelInput } from './components/basics/FloatingLabelInput';
import { Skeleton } from './components/basics/Skeleton';
import { Progress } from './components/basics/Progress';
import { Tooltip } from './components/basics/Tooltip';
import { BadgeVariant } from './components/basics/BadgeVariant';
import { Avatar } from './components/basics/Avatar';
import { DotIndicator } from './components/basics/DotIndicator';
import { KBD } from './components/basics/KBD';
import { Divider } from './components/basics/Divider';
import { IconWrapper } from './components/basics/IconWrapper';
import { Link } from './components/basics/Link';
import { SplitHero } from './components/marketing/SplitHero';
import { CenterHero } from './components/marketing/CenterHero';
import { MicroHero } from './components/marketing/MicroHero';
import { LogoCloud } from './components/marketing/LogoCloud';
import { TestimonialCard } from './components/marketing/TestimonialCard';
import { PricingTable } from './components/marketing/PricingTable';
import { FeatureGrid } from './components/marketing/FeatureGrid';
import { StepProcess } from './components/marketing/StepProcess';
import { StickyHeader } from './components/layout/StickyHeader';
import { MultiColumnFooter } from './components/layout/MultiColumnFooter';
import { VideoHero } from './components/composite/VideoHero';
import { IconGrid } from './components/composite/IconGrid';
import { CardHover } from './components/composite/CardHover';
import { FeatureList } from './components/composite/FeatureList';
import { TestimonialGrid } from './components/composite/TestimonialGrid';
import { LogoMarquee } from './components/composite/LogoMarquee';
import { AccordionFAQ } from './components/composite/AccordionFAQ';
import { TeamGrid } from './components/composite/TeamGrid';
import { StatsSection } from './components/composite/StatsSection';
import { NewsletterStrip } from './components/composite/NewsletterStrip';
import { ComparisonTable } from './components/composite/ComparisonTable';
import { FeatureHighlightList } from './components/composite/FeatureHighlightList';
import { TestimonialCarousel } from './components/composite/TestimonialCarousel';
import { FloatingCTA } from './components/composite/FloatingCTA';
import { UserReviewSummary } from './components/composite/UserReviewSummary';
import { FAQSingleColumn } from './components/composite/FAQSingleColumn';
import { CallToActionBox } from './components/composite/CallToActionBox';
import { ProductShowcaseHero } from './components/composite/ProductShowcaseHero';
import { GlassmorphicHero } from './components/composite/GlassmorphicHero';
import { ParallaxSection } from './components/composite/ParallaxSection';
import { BeforeAfterSlider } from './components/composite/BeforeAfterSlider';
import { VideoBackgroundSection } from './components/composite/VideoBackgroundSection';
import { StoryHero } from './components/composite/StoryHero';
import { BlogPreviewGrid } from './components/composite/BlogPreviewGrid';
import { TimelineLayout } from './components/composite/TimelineLayout';
import { TabbedContent } from './components/composite/TabbedContent';
import { MasonryGallery } from './components/composite/MasonryGallery';
import { SimpleTable } from './components/composite/SimpleTable';
import { LogoGridStatic } from './components/composite/LogoGridStatic';
import { ContactSplit } from './components/composite/ContactSplit';
import { MegaMenu } from './components/navigation/MegaMenu';
import { BreadcrumbTrail } from './components/navigation/BreadcrumbTrail';
import { PaginationControls } from './components/navigation/PaginationControls';
import { SideCommandPalette } from './components/navigation/SideCommandPalette';
import { LanguageSwitcher } from './components/navigation/LanguageSwitcher';
import { MobileDrawer } from './components/navigation/MobileDrawer';
import { SearchBar } from './components/navigation/SearchBar';
import { ProgressBar } from './components/navigation/ProgressBar';
import { ScrollIndicator } from './components/navigation/ScrollIndicator';
import { SocialLinks } from './components/navigation/SocialLinks';
import { GlassAccordion } from './components/interactive/GlassAccordion';
import { TabsSystem } from './components/interactive/TabsSystem';
import { ImageLightbox } from './components/interactive/ImageLightbox';
import { ParallaxScrollContainer } from './components/interactive/ParallaxScrollContainer';
import { CustomCursor } from './components/interactive/CustomCursor';
import { HoverCard } from './components/interactive/HoverCard';
import { InteractiveMap } from './components/interactive/InteractiveMap';
import { VideoPlayer } from './components/interactive/VideoPlayer';
import { FormWizard } from './components/interactive/FormWizard';
import { DraggableCard } from './components/interactive/DraggableCard';
import { GlassModal } from './components/overlays/GlassModal';
import { SlideOverPanel } from './components/overlays/SlideOverPanel';
import { NotificationToast } from './components/overlays/NotificationToast';
import { ConfettiTrigger } from './components/overlays/ConfettiTrigger';
import { FloatingDock } from './components/overlays/FloatingDock';
import { TooltipOverlay } from './components/overlays/TooltipOverlay';
import { ContextMenu } from './components/overlays/ContextMenu';
import { LoadingSpinner } from './components/overlays/LoadingSpinner';
import { SuccessMessage } from './components/overlays/SuccessMessage';
import { ErrorBanner } from './components/overlays/ErrorBanner';
import { SaaSLanding } from './templates/landing/SaaSLanding';
import { PortfolioLanding } from './templates/landing/PortfolioLanding';
import { NewsletterLanding } from './templates/landing/NewsletterLanding';
import { WaitlistLanding } from './templates/landing/WaitlistLanding';
import { ProductLaunchLanding } from './templates/landing/ProductLaunchLanding';
import { AgencyLanding } from './templates/landing/AgencyLanding';
import { AppLanding } from './templates/landing/AppLanding';
import { EventLanding } from './templates/landing/EventLanding';
import { PersonalLanding } from './templates/landing/PersonalLanding';
import { EcommerceLanding } from './templates/landing/EcommerceLanding';
import { AnalyticsDashboardTemplate } from './templates/dashboard/AnalyticsDashboardTemplate';
import { UserManagementTemplate } from './templates/dashboard/UserManagementTemplate';
import { AgentControlTemplate } from './templates/dashboard/AgentControlTemplate';
import { ProjectManagementTemplate } from './templates/dashboard/ProjectManagementTemplate';
import { FinancialDashboardTemplate } from './templates/dashboard/FinancialDashboardTemplate';
import { SupportDashboardTemplate } from './templates/dashboard/SupportDashboardTemplate';
import { MarketingDashboardTemplate } from './templates/dashboard/MarketingDashboardTemplate';
import { InventoryDashboardTemplate } from './templates/dashboard/InventoryDashboardTemplate';
import { SettingsDashboardTemplate } from './templates/dashboard/SettingsDashboardTemplate';
import { MonitoringDashboardTemplate } from './templates/dashboard/MonitoringDashboardTemplate';
import { BlogPostDetail } from './templates/content/BlogPostDetail';
import { BlogIndex } from './templates/content/BlogIndex';
import { DocumentationPage } from './templates/content/DocumentationPage';
import { CaseStudy } from './templates/content/CaseStudy';
import { PressRelease } from './templates/content/PressRelease';
import { NewsletterArchive } from './templates/content/NewsletterArchive';
import { TutorialPage } from './templates/content/TutorialPage';
import { AuthorProfile } from './templates/content/AuthorProfile';
import { Error404 } from './templates/utility/Error404';
import { MaintenancePage } from './templates/utility/MaintenancePage';
import { AuthFlow } from './templates/utility/AuthFlow';
import { OnboardingWizard } from './templates/utility/OnboardingWizard';
import { ContactPage } from './templates/utility/ContactPage';
import { TermsPage } from './templates/utility/TermsPage';
import { PrivacyPage } from './templates/utility/PrivacyPage';
import { ComingSoon } from './templates/utility/ComingSoon';
import { SearchResults } from './templates/utility/SearchResults';
import { FeedbackForm } from './templates/utility/FeedbackForm';
import { ThoughtBubble } from './components/ai/ThoughtBubble';
import { AgentTerminal } from './components/ai/AgentTerminal';
import { LogicFlow } from './components/ai/LogicFlow';
import { ModelStatus } from './components/ai/ModelStatus';
import { PromptInput } from './components/ai/PromptInput';
import { ContextChip } from './components/ai/ContextChip';
import { CodeSandbox } from './components/ai/CodeSandbox';
import { CookieBanner } from './components/marketing/CookieBanner';
import { MaintenanceMode } from './components/utility/MaintenanceMode';
import { PricingComparison } from './components/marketing/PricingComparison';
import { CloudConnectorForm } from './components/specialized/CloudConnectorForm';
import { UserDashboardHome } from './components/dashboard/UserDashboardHome';
import { RealtimeStream } from './components/data/RealtimeStream';
import { AuthForm } from './components/data/AuthForm';
import { BucketGallery } from './components/data/BucketGallery';
import { DatabaseTable } from './components/data/DatabaseTable';
import { UserPresence } from './components/data/UserPresence';
import { AnalyticsDashboard } from './components/data/AnalyticsDashboard';
import { JsonTree } from './components/data/JsonTree';
import { VoiceVisualizer } from './components/experimental/VoiceVisualizer';
import { ParticleCanvas } from './components/experimental/ParticleCanvas';
import { GlitchText } from './components/experimental/GlitchText';
import { TypewriterHero } from './components/experimental/TypewriterHero';
import { SpotlightEffect } from './components/experimental/SpotlightEffect';
import { ConfettiExplosion } from './components/experimental/ConfettiExplosion';
import { WonderProps } from './types';

export const WonderRegistry: Record<string, React.FC<any>> = {
  'button': Button,
  'input': Input,
  'typography': Typography,
  'badge': Badge,
  'heading': Heading,
  'blockquote': Blockquote,
  'kinetiText': KinetiText,
  'checkbox': Checkbox,
  'radioGroup': RadioGroup,
  'switch': Switch,
  'slider': Slider,
  'floatingLabelInput': FloatingLabelInput,
  'skeleton': Skeleton,
  'progress': Progress,
  'tooltip': Tooltip,
  'badgeVariant': BadgeVariant,
  'avatar': Avatar,
  'dotIndicator': DotIndicator,
  'kbd': KBD,
  'divider': Divider,
  'iconWrapper': IconWrapper,
  'link': Link,
  'splitHero': SplitHero,
  'centerHero': CenterHero,
  'microHero': MicroHero,
  'logoCloud': LogoCloud,
  'testimonialCard': TestimonialCard,
  'pricingTable': PricingTable,
  'featureGrid': FeatureGrid,
  'stepProcess': StepProcess,
  'stickyHeader': StickyHeader,
  'multiColumnFooter': MultiColumnFooter,
  'videoHero': VideoHero,
  'iconGrid': IconGrid,
  'cardHover': CardHover,
  'featureList': FeatureList,
  'testimonialGrid': TestimonialGrid,
  'logoMarquee': LogoMarquee,
  'accordionFAQ': AccordionFAQ,
  'teamGrid': TeamGrid,
  'statsSection': StatsSection,
  'newsletterStrip': NewsletterStrip,
  'comparisonTable': ComparisonTable,
  'featureHighlightList': FeatureHighlightList,
  'testimonialCarousel': TestimonialCarousel,
  'floatingCTA': FloatingCTA,
  'userReviewSummary': UserReviewSummary,
  'faqSingleColumn': FAQSingleColumn,
  'callToActionBox': CallToActionBox,
  'productShowcaseHero': ProductShowcaseHero,
  'glassmorphicHero': GlassmorphicHero,
  'parallaxSection': ParallaxSection,
  'beforeAfterSlider': BeforeAfterSlider,
  'videoBackgroundSection': VideoBackgroundSection,
  'storyHero': StoryHero,
  'blogPreviewGrid': BlogPreviewGrid,
  'timelineLayout': TimelineLayout,
  'tabbedContent': TabbedContent,
  'masonryGallery': MasonryGallery,
  'simpleTable': SimpleTable,
  'logoGridStatic': LogoGridStatic,
  'contactSplit': ContactSplit,
  'megaMenu': MegaMenu,
  'breadcrumbTrail': BreadcrumbTrail,
  'paginationControls': PaginationControls,
  'sideCommandPalette': SideCommandPalette,
  'languageSwitcher': LanguageSwitcher,
  'mobileDrawer': MobileDrawer,
  'searchBar': SearchBar,
  'progressBar': ProgressBar,
  'scrollIndicator': ScrollIndicator,
  'socialLinks': SocialLinks,
  'glassAccordion': GlassAccordion,
  'tabsSystem': TabsSystem,
  'imageLightbox': ImageLightbox,
  'parallaxScrollContainer': ParallaxScrollContainer,
  'customCursor': CustomCursor,
  'hoverCard': HoverCard,
  'interactiveMap': InteractiveMap,
  'videoPlayer': VideoPlayer,
  'formWizard': FormWizard,
  'draggableCard': DraggableCard,
  'glassModal': GlassModal,
  'slideOverPanel': SlideOverPanel,
  'notificationToast': NotificationToast,
  'confettiTrigger': ConfettiTrigger,
  'floatingDock': FloatingDock,
  'tooltipOverlay': TooltipOverlay,
  'contextMenu': ContextMenu,
  'loadingSpinner': LoadingSpinner,
  'successMessage': SuccessMessage,
  'errorBanner': ErrorBanner,
  'saaSLanding': SaaSLanding,
  'portfolioLanding': PortfolioLanding,
  'newsletterLanding': NewsletterLanding,
  'waitlistLanding': WaitlistLanding,
  'productLaunchLanding': ProductLaunchLanding,
  'agencyLanding': AgencyLanding,
  'appLanding': AppLanding,
  'eventLanding': EventLanding,
  'personalLanding': PersonalLanding,
  'ecommerceLanding': EcommerceLanding,
  'analyticsDashboardTemplate': AnalyticsDashboardTemplate,
  'userManagementTemplate': UserManagementTemplate,
  'agentControlTemplate': AgentControlTemplate,
  'projectManagementTemplate': ProjectManagementTemplate,
  'financialDashboardTemplate': FinancialDashboardTemplate,
  'supportDashboardTemplate': SupportDashboardTemplate,
  'marketingDashboardTemplate': MarketingDashboardTemplate,
  'inventoryDashboardTemplate': InventoryDashboardTemplate,
  'settingsDashboardTemplate': SettingsDashboardTemplate,
  'monitoringDashboardTemplate': MonitoringDashboardTemplate,
  'blogPostDetail': BlogPostDetail,
  'blogIndex': BlogIndex,
  'documentationPage': DocumentationPage,
  'caseStudy': CaseStudy,
  'pressRelease': PressRelease,
  'newsletterArchive': NewsletterArchive,
  'tutorialPage': TutorialPage,
  'authorProfile': AuthorProfile,
  'error404': Error404,
  'maintenancePage': MaintenancePage,
  'authFlow': AuthFlow,
  'onboardingWizard': OnboardingWizard,
  'contactPage': ContactPage,
  'termsPage': TermsPage,
  'privacyPage': PrivacyPage,
  'comingSoon': ComingSoon,
  'searchResults': SearchResults,
  'feedbackForm': FeedbackForm,
  'thoughtBubble': ThoughtBubble,
  'agentTerminal': AgentTerminal,
  'logicFlow': LogicFlow,
  'modelStatus': ModelStatus,
  'promptInput': PromptInput,
  'contextChip': ContextChip,
  'codeSandbox': CodeSandbox,
  'cookieBanner': CookieBanner,
  'maintenanceMode': MaintenanceMode,
  'pricingComparison': PricingComparison,
  'cloudConnectorForm': CloudConnectorForm,
  'userDashboardHome': UserDashboardHome,
  'realtimeStream': RealtimeStream,
  'authForm': AuthForm,
  'bucketGallery': BucketGallery,
  'databaseTable': DatabaseTable,
  'userPresence': UserPresence,
  'analyticsDashboard': AnalyticsDashboard,
  'jsonTree': JsonTree,
  'voiceVisualizer': VoiceVisualizer,
  'particleCanvas': ParticleCanvas,
  'glitchText': GlitchText,
  'typewriterHero': TypewriterHero,
  'spotlightEffect': SpotlightEffect,
  'confettiExplosion': ConfettiExplosion,
};
