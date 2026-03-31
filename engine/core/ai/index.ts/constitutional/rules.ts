export type ConstitutionalRule = {
  id: string;
  description: string;
  pattern: RegExp;
};

export const CONSTITUTIONAL_RULES: ConstitutionalRule[] = [
  {
    id: 'no-openai-secrets',
    description: 'Output appears to contain an OpenAI API key.',
    pattern: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: 'no-anthropic-secrets',
    description: 'Output appears to contain an Anthropic API key.',
    pattern: /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g,
  },
  {
    id: 'no-openrouter-secrets',
    description: 'Output appears to contain an OpenRouter API key.',
    pattern: /\bsk-or-v1-[A-Za-z0-9\-_]{20,}\b/g,
  },
  {
    id: 'no-google-api-keys',
    description: 'Output appears to contain a Google API key.',
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
  },
  {
    id: 'no-github-tokens',
    description: 'Output appears to contain a GitHub access token.',
    pattern: /\bghp_[A-Za-z0-9]{30,}\b/g,
  },
  {
    id: 'no-slack-tokens',
    description: 'Output appears to contain a Slack token.',
    pattern: /\bxoxb-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: 'no-database-urls',
    description: 'Output appears to contain a database connection string.',
    pattern: /\b(postgres:\/\/|mongodb\+srv:\/\/)[^\s]+/gi,
  },
];
