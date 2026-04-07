// Google AI model strings
export type ModelName =
  | 'gemini-1.5-flash'
  | 'gemini-1.5-flash-8b'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-pro-002';

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