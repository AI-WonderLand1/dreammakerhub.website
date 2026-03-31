import { Artifact } from "@core/ai/types"; // Fixed import

export function extractArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  
  // Extract code blocks with language tags
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'text';
    const content = match[2].trim();
    
    artifacts.push({
      type: 'code',
      language,
      content,
      title: `Generated ${language} code`
    });
  }
  
  return artifacts;
}

export function formatArtifact(artifact: Artifact): string {
  return `\`\`\`${artifact.language || 'text'}\n${artifact.content}\n\`\`\``;
}
