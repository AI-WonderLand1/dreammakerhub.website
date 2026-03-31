export type AIModel = {
  id: string;
  provider: "anthropic" | "google" | "local" | "openrouter";
};

/**
 * NEW: Support for Vision & Video
 * Defines the structure for a single piece of content (text, image, or video)
 */
export type AIContentPart = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } } // Base64 data:image/...
  | { type: "video_url"; video_url: { url: string } }; // Base64 data:video/...

/**
 * CLEAN CODE: Updated prompt to support both simple strings and Vision arrays.
 */
export type AIRunInput = {
  // Can be a simple string (text only) or an array (Vision/Video)
  prompt: string | AIContentPart[]; 
  system?: string;
  temperature?: number;
  maxTokens?: number;          // Added to match our openrouter.ts logic
  useConstitutional?: boolean; 
  targetLanguage?: string;     
};

export type Artifact = {
  type: string;
  content: string;
  title?: string;
  language?: string;
};

/**
 * ENHANCED: Added 'confessions' and 'provider' info 
 * to match the Spirit Guide logic in openrouter.ts
 */
export type AIRunOutput = {
  text: string;
  provider?: string;
  model?: string;
  error?: boolean;
  artifacts?: Artifact[];
  usage?: {
    tokens: number;
  };
  confessions?: {
    confidence: number;
    reasoning: string[];
    limitations: string[];
  };
};

