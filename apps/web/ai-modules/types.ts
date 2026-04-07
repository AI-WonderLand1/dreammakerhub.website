// Google AI model strings
export type ModelName =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-8b'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-pro-002'
  | 'gemini-2.5-pro-vision';

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