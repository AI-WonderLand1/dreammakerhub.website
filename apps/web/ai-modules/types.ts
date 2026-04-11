// GitHub Models, GROQ and Google AI model strings
export type ModelName =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo'
  | 'llama-3.1-8b-instant'
  | 'llama-3.1-70b-versatile'
  | 'mixtral-8x7b-32768'
  | 'gemma-7b-it'
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