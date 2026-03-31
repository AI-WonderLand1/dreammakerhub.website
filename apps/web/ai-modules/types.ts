// OpenRouter specific model strings
export type ModelName = 
  | 'google/gemini-3-flash-preview' 
  | 'google/gemini-3.1-pro-preview' 
  | 'google/gemini-2.5-flash-image' 
  | 'google/gemini-3.1-flash-lite-preview';

export interface PlaygroundConfig {
  model: ModelName;
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
  showRobot: boolean;
  useEgyptian?: boolean;
  useVoice?: boolean;
  useVision?: boolean;
}

export interface AIModule {
  id: string;
  name: string;
  config: PlaygroundConfig;
}