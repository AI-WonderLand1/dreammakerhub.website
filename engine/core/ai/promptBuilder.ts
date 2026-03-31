import { AIRunInput } from './types';

/**
 * Rick's Note: I'm adding a classifier because apparently, Morty-level intelligence 
 * can't distinguish between a mobile app and a game without a computer's help. *burp*
 */
export function buildClassificationPrompt(userInput: string): string {
  return `Analyze the following user request and determine which builder is most appropriate.
  
  Options:
  - "web": For websites, dashboards, or general web applications.
  - "mobile": For native-like mobile app experiences.
  - "game": For interactive 3D/2D games or simulations.

  User Request: "${userInput}"

  Return ONLY a valid JSON object with the key "builderType".`;
}

export function buildCodeGenPrompt(input: AIRunInput): string {
  return `System: You are an expert engineer. Generate code for a ${input.context?.platform || 'web'} project based on: ${input.prompt}`;
}

export function buildCodeTransformPrompt(code: string, instruction: string): string {
  return `Transform the following code based on this instruction: ${instruction}\n\nCode:\n${code}`;
}

export function buildImageEditPrompt(imageUrl: string, prompt: string): string {
  return `Edit image at ${imageUrl} based on: ${prompt}`;
}

export function buildImageToCodePrompt(imageUrl: string): string {
  return `Generate UI code from the image at ${imageUrl}`;
}