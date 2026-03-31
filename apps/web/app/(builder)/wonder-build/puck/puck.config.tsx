import type { Config } from "@puckeditor/core";
import { RichTextMenu } from "@puckeditor/core";
import Superscript from "@tiptap/extension-superscript";

import type { HeadingBlockProps } from "./components/HeadingBlock";
import type { ButtonBlockProps } from "./components/ButtonBlock";
import type { CardBlockProps } from "./components/CardBlock";
import type { BadgeBlockProps } from "./components/BadgeBlock";
import type { AlertBlockProps } from "./components/AlertBlock";
import type { HeroSectionBlockProps } from "./components/HeroSectionBlock";
import type { BentoGridBlockProps } from "./components/BentoGridBlock";
import type { SectionContainerBlockProps } from "./components/SectionContainerBlock";
import type { AIChatInterfaceBlockProps } from "./components/AIChatInterfaceBlock";
import type { PromptInputBlockProps } from "./components/PromptInputBlock";
import type { VoiceModuleTriggerBlockProps } from "./components/VoiceModuleTriggerBlock";
import type { ThreeCanvasWrapperBlockProps } from "./components/ThreeCanvasWrapperBlock";
import type { ImageGalleryBlockProps } from "./components/ImageGalleryBlock";
import type { VideoPlayerBlockProps } from "./components/VideoPlayerBlock";
import type { FeatureCardsBlockProps } from "./components/FeatureCardsBlock";
import type { PricingTableBlockProps } from "./components/PricingTableBlock";
import type { NavigationBlockProps } from "./components/NavigationBlock";
import type { FooterBlockProps } from "./components/FooterBlock";

import HeadingBlock from "./components/HeadingBlock";
import TextBlock from "./components/TextBlock";
import ButtonBlock from "./components/ButtonBlock";
import CardBlock from "./components/CardBlock";
import BadgeBlock from "./components/BadgeBlock";
import AlertBlock from "./components/AlertBlock";
import HeroSectionBlock from "./components/HeroSectionBlock";
import BentoGridBlock from "./components/BentoGridBlock";
import SectionContainerBlock from "./components/SectionContainerBlock";
import AIChatInterfaceBlock from "./components/AIChatInterfaceBlock";
import PromptInputBlock from "./components/PromptInputBlock";
import VoiceModuleTriggerBlock from "./components/VoiceModuleTriggerBlock";
import ThreeCanvasWrapperBlock from "./components/ThreeCanvasWrapperBlock";
import ImageGalleryBlock from "./components/ImageGalleryBlock";
import VideoPlayerBlock from "./components/VideoPlayerBlock";
import FeatureCardsBlock from "./components/FeatureCardsBlock";
import PricingTableBlock from "./components/PricingTableBlock";
import NavigationBlock from "./components/NavigationBlock";
import FooterBlock from "./components/FooterBlock";

type Props = {
  HeadingBlock: HeadingBlockProps;
  TextBlock: { text: string };
  ButtonBlock: ButtonBlockProps;
  CardBlock: CardBlockProps;
  BadgeBlock: BadgeBlockProps;
  AlertBlock: AlertBlockProps;
  HeroSectionBlock: HeroSectionBlockProps;
  BentoGridBlock: BentoGridBlockProps;
  SectionContainerBlock: SectionContainerBlockProps;
  AIChatInterfaceBlock: AIChatInterfaceBlockProps;
  PromptInputBlock: PromptInputBlockProps;
  VoiceModuleTriggerBlock: VoiceModuleTriggerBlockProps;
  ThreeCanvasWrapperBlock: ThreeCanvasWrapperBlockProps;
  ImageGalleryBlock: ImageGalleryBlockProps;
  VideoPlayerBlock: VideoPlayerBlockProps;
  FeatureCardsBlock: FeatureCardsBlockProps;
  PricingTableBlock: PricingTableBlockProps;
  NavigationBlock: NavigationBlockProps;
  FooterBlock: FooterBlockProps;
};

export const config: Config<Props> = {
  components: {

    // ─── LAYOUT & STRUCTURE ────────────────────────────────────────────────

    HeroSectionBlock: {
      fields: {
        eyebrow: { type: "text" },
        title: { type: "text" },
        subtitle: { type: "textarea" },
        ctaLabel: { type: "text" },
        ctaHref: { type: "text" },
        secondaryLabel: { type: "text" },
        secondaryHref: { type: "text" },
        background: {
          type: "select",
          options: [
            { label: "Neon (Cyan)", value: "neon" },
            { label: "Psychedelic (Pink/Purple)", value: "psychedelic" },
            { label: "Dark", value: "dark" },
            { label: "Egyptian (Amber)", value: "egyptian" },
          ],
        },
      },
      defaultProps: {
        eyebrow: "Welcome to AI Wonderland",
        title: "Where your imagination comes to life",
        subtitle: "Build real-time 3D worlds, generate AI-powered experiences, and launch in one click.",
        ctaLabel: "Open WebGL Studio",
        ctaHref: "/wonder-build/playcanvas",
        secondaryLabel: "View Plans",
        secondaryHref: "/subscription",
        background: "neon",
      },
      render: (props) => <HeroSectionBlock {...props} />,
    },

    BentoGridBlock: {
      fields: {
        accentColor: {
          type: "select",
          options: [
            { label: "Cyan", value: "cyan" },
            { label: "Violet", value: "violet" },
            { label: "Amber", value: "amber" },
            { label: "Pink", value: "pink" },
          ],
        },
      },
      defaultProps: {
        items: [
          { icon: "⚡", title: "Real-time 3D", desc: "Build immersive scenes instantly in the browser.", span: "2" },
          { icon: "🧠", title: "AI Co-Pilot", desc: "Let the AI architect your scenes.", span: "1" },
          { icon: "🗣", title: "Voice Module", desc: "Egyptian hieroglyphic synthesis.", span: "1" },
          { icon: "🚀", title: "1-Click Deploy", desc: "Ship your creation instantly.", span: "1" },
          { icon: "🎨", title: "Design Tokens", desc: "Sync your brand across all blocks.", span: "1" },
        ],
        accentColor: "cyan",
      },
      render: (props) => <BentoGridBlock {...props} />,
    },

    SectionContainerBlock: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        label: { type: "text" },
        background: {
          type: "select",
          options: [
            { label: "None", value: "none" },
            { label: "Dark", value: "dark" },
            { label: "Gradient", value: "gradient" },
            { label: "Bordered", value: "bordered" },
          ],
        },
        paddingY: {
          type: "select",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        title: "Section Title",
        subtitle: "A brief description of this section.",
        label: "Section Label",
        background: "none",
        paddingY: "md",
      },
      render: (props) => <SectionContainerBlock {...props} />,
    },

    NavigationBlock: {
      fields: {
        logo: { type: "text" },
        links: { type: "text" },
        ctaLabel: { type: "text" },
        ctaHref: { type: "text" },
        theme: {
          type: "select",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Glass", value: "glass" },
            { label: "Neon", value: "neon" },
          ],
        },
      },
      defaultProps: {
        logo: "AI Wonderland",
        links: "Features, Pricing, Docs, Community",
        ctaLabel: "Get Started",
        ctaHref: "/public-pages/auth",
        theme: "dark",
      },
      render: (props) => <NavigationBlock {...props} />,
    },

    FooterBlock: {
      fields: {
        brand: { type: "text" },
        tagline: { type: "text" },
        columns: { type: "textarea" },
        copyright: { type: "text" },
        theme: {
          type: "select",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        brand: "AI Wonderland",
        tagline: "Where your imagination comes to life.",
        columns: "Platform\nBuilder\nWebGL Studio\nAI Builder\n|\nCompany\nAbout\nPricing\nDocs\n|\nLegal\nPrivacy\nTerms",
        copyright: `© ${new Date().getFullYear()} AI Wonderland. All rights reserved.`,
        theme: "dark",
      },
      render: (props) => <FooterBlock {...props} />,
    },

    // ─── AI & INTERACTION ──────────────────────────────────────────────────

    AIChatInterfaceBlock: {
      fields: {
        agentName: { type: "text" },
        agentRole: { type: "text" },
        samplePrompt: { type: "text" },
        sampleResponse: { type: "textarea" },
        theme: {
          type: "select",
          options: [
            { label: "Egyptian (Amber)", value: "hieroglyphic" },
            { label: "Neon (Cyan)", value: "neon" },
            { label: "Minimal (Violet)", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        agentName: "Anubis AI",
        agentRole: "Hieroglyphic Decoder",
        samplePrompt: "Decode this ancient symbol for me",
        sampleResponse: "𓂀 The Eye of Horus represents protection and royal power. In this context it suggests divine oversight and guidance on your creative journey.",
        theme: "hieroglyphic",
      },
      render: (props) => <AIChatInterfaceBlock {...props} />,
    },

    PromptInputBlock: {
      fields: {
        label: { type: "text" },
        placeholder: { type: "textarea" },
        buttonLabel: { type: "text" },
        theme: {
          type: "select",
          options: [
            { label: "Violet", value: "violet" },
            { label: "Cyan", value: "cyan" },
            { label: "Amber", value: "amber" },
          ],
        },
      },
      defaultProps: {
        label: "AI Prompt",
        placeholder: "Describe what you want to build...",
        buttonLabel: "✨ Magic",
        theme: "violet",
      },
      render: (props) => <PromptInputBlock {...props} />,
    },

    VoiceModuleTriggerBlock: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        language: { type: "text" },
        theme: {
          type: "select",
          options: [
            { label: "Egyptian (Amber)", value: "egyptian" },
            { label: "Neon (Cyan)", value: "neon" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        title: "Egyptian Voice Module",
        description: "Activate AI-powered hieroglyphic voice synthesis. Speak in the tongue of the ancients.",
        language: "Ancient Egyptian",
        theme: "egyptian",
      },
      render: (props) => <VoiceModuleTriggerBlock {...props} />,
    },

    // ─── MEDIA & 3D ────────────────────────────────────────────────────────

    ThreeCanvasWrapperBlock: {
      fields: {
        label: { type: "text" },
        height: {
          type: "select",
          options: [
            { label: "Small (192px)", value: "sm" },
            { label: "Medium (288px)", value: "md" },
            { label: "Large (384px)", value: "lg" },
            { label: "Extra Large (512px)", value: "xl" },
          ],
        },
        sceneType: {
          type: "select",
          options: [
            { label: "WebGL Scene", value: "webgl" },
            { label: "3D World", value: "3d-world" },
            { label: "Particle System", value: "particle" },
            { label: "Custom", value: "custom" },
          ],
        },
        showControls: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
      },
      defaultProps: {
        label: "3D Canvas",
        height: "md",
        sceneType: "webgl",
        showControls: true,
      },
      render: (props) => <ThreeCanvasWrapperBlock {...props} />,
    },

    ImageGalleryBlock: {
      fields: {
        title: { type: "text" },
        columns: {
          type: "select",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
        aspectRatio: {
          type: "select",
          options: [
            { label: "Square (1:1)", value: "square" },
            { label: "Video (16:9)", value: "video" },
            { label: "Portrait (3:4)", value: "portrait" },
          ],
        },
        accentColor: {
          type: "select",
          options: [
            { label: "Cyan", value: "cyan" },
            { label: "Violet", value: "violet" },
            { label: "Amber", value: "amber" },
            { label: "Pink", value: "pink" },
          ],
        },
        imageUrls: { type: "textarea" },
      },
      defaultProps: {
        title: "Blueprint Gallery",
        columns: "3",
        aspectRatio: "square",
        accentColor: "cyan",
        imageUrls: "",
      },
      render: (props) => <ImageGalleryBlock {...props} />,
    },

    VideoPlayerBlock: {
      fields: {
        title: { type: "text" },
        videoUrl: { type: "text" },
        caption: { type: "text" },
        rounded: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        showOverlay: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
      },
      defaultProps: {
        title: "",
        videoUrl: "",
        caption: "Live Preview",
        rounded: true,
        showOverlay: true,
      },
      render: (props) => <VideoPlayerBlock {...props} />,
    },

    // ─── STANDARD UI ───────────────────────────────────────────────────────

    FeatureCardsBlock: {
      fields: {
        eyebrow: { type: "text" },
        headline: { type: "text" },
        columns: {
          type: "select",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
        accentColor: {
          type: "select",
          options: [
            { label: "Cyan", value: "cyan" },
            { label: "Violet", value: "violet" },
            { label: "Amber", value: "amber" },
            { label: "Pink", value: "pink" },
          ],
        },
      },
      defaultProps: {
        eyebrow: "Platform Features",
        headline: "Everything you need to build",
        columns: "3",
        accentColor: "cyan",
        features: [
          { icon: "⚡", title: "5 AI Chats/day", desc: "Available on The Nomad free plan." },
          { icon: "∞", title: "Unlimited AI", desc: "Unlock on The Architect plan." },
          { icon: "🌐", title: "3D Engine", desc: "Full WebGL Studio access." },
          { icon: "🗣", title: "Voice Module", desc: "Egyptian hieroglyphic synthesis." },
          { icon: "🚀", title: "1-Click Deploy", desc: "Ship instantly to the cloud." },
          { icon: "🔥", title: "God Mode", desc: "Exclusive to The Creator tier." },
        ],
      },
      render: (props) => <FeatureCardsBlock {...props} />,
    },

    PricingTableBlock: {
      fields: {
        eyebrow: { type: "text" },
        headline: { type: "text" },
        subheadline: { type: "text" },
        freeLabel: { type: "text" },
        proLabel: { type: "text" },
        eliteLabel: { type: "text" },
      },
      defaultProps: {
        eyebrow: "Pricing",
        headline: "Start free. Scale when ready.",
        subheadline: "Pick the plan that fits your stage.",
        freeLabel: "Start Free",
        proLabel: "Become an Architect",
        eliteLabel: "Unlock God Mode",
      },
      render: (props) => <PricingTableBlock {...props} />,
    },

    ButtonBlock: {
      fields: {
        label: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Default (Violet)", value: "default" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
            { label: "Destructive", value: "destructive" },
            { label: "Secondary", value: "secondary" },
          ],
        },
        size: {
          type: "select",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        href: { type: "text" },
      },
      defaultProps: {
        label: "Click me",
        variant: "default",
        size: "md",
        href: "",
      },
      render: ({ label, variant, size, href }) => (
        <ButtonBlock label={label} variant={variant} size={size} href={href} />
      ),
    },

    CardBlock: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        body: { type: "textarea" },
        variant: {
          type: "select",
          options: [
            { label: "Default", value: "default" },
            { label: "Bordered", value: "bordered" },
            { label: "Glass", value: "glass" },
          ],
        },
      },
      defaultProps: {
        title: "Card Title",
        description: "A short description",
        body: "",
        variant: "default",
      },
      render: ({ title, description, body, variant }) => (
        <CardBlock title={title} description={description} body={body} variant={variant} />
      ),
    },

    BadgeBlock: {
      fields: {
        label: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Default (Violet)", value: "default" },
            { label: "Secondary", value: "secondary" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Destructive", value: "destructive" },
            { label: "Outline", value: "outline" },
          ],
        },
      },
      defaultProps: {
        label: "New",
        variant: "default",
      },
      render: ({ label, variant }) => <BadgeBlock label={label} variant={variant} />,
    },

    AlertBlock: {
      fields: {
        title: { type: "text" },
        message: { type: "textarea" },
        variant: {
          type: "select",
          options: [
            { label: "Default", value: "default" },
            { label: "Info", value: "info" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Destructive", value: "destructive" },
          ],
        },
      },
      defaultProps: {
        title: "Heads up!",
        message: "This is an alert message.",
        variant: "default",
      },
      render: ({ title, message, variant }) => (
        <AlertBlock title={title} message={message} variant={variant} />
      ),
    },

    // ─── TYPOGRAPHY ────────────────────────────────────────────────────────

    HeadingBlock: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Heading",
      },
      render: ({ title }) => <HeadingBlock title={title} />,
    },

    TextBlock: {
      fields: {
        text: {
          type: "richtext",
          // @ts-ignore - Bypassing strict menu types for custom extensions
          editor: {
            bold: false,
            heading: { levels: [1, 2] },
            extensions: [Superscript],
            menu: ({ editor }: { editor: any }) => (
              <RichTextMenu.Group>
                <RichTextMenu.Bold />
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded border border-white/10 transition-colors ${
                    editor.isActive("superscript")
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-black/40 text-white/60 hover:bg-black/60"
                  }`}
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                >
                  Superscript
                </button>
              </RichTextMenu.Group>
            ),
          },
        },
      },
      render: ({ text }) => <TextBlock text={text} />,
    },
  },
};

export const defaultData = {
  content: [{ type: "HeroSectionBlock", props: {
    eyebrow: "Welcome to AI Wonderland",
    title: "Where your imagination comes to life",
    subtitle: "Build real-time 3D worlds, generate AI-powered experiences, and launch in one click.",
    ctaLabel: "Open WebGL Studio",
    ctaHref: "/wonder-build/playcanvas",
    secondaryLabel: "View Plans",
    secondaryHref: "/subscription",
    background: "neon",
  }}],
};
