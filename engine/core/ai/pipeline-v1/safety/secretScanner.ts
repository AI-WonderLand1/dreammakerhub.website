/**
 * Wonderland Secret Scanner
 *
 * Detects:
 *  - API keys
 *  - JWT tokens
 *  - Password patterns
 *  - Generic secret-like strings
 *
 * Lightweight, deterministic, and safe for pipeline integration.
 */

export interface SecretViolation {
  type: "secret";
  ruleId: string;
  description: string;
  match?: string;
}

const SECRET_PATTERNS = [
  {
    id: "SECRET_API_KEY",
    regex: /\b(sk-[A-Za-z0-9]{20,}|api_key|secret_key|ghp_[A-Za-z0-9]{20,})\b/i,
    desc: "Possible API key or secret detected.",
  },
  {
    id: "SECRET_JWT",
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    desc: "Possible JWT token detected.",
  },
  {
    id: "SECRET_PASSWORD",
    regex: /\bpassword\s*[:=]\s*\S+/i,
    desc: "Possible password detected.",
  },
  {
    id: "SECRET_GENERIC",
    regex: /\b(secret|token|private|credential)[\s:=]+\S+/i,
    desc: "Possible secret or credential detected.",
  },
];

/**
 * Run all secret patterns against text.
 */
export function scanSecrets(text: string): SecretViolation[] {
  if (!text || typeof text !== "string") return [];

  return SECRET_PATTERNS.flatMap((p) => {
    const match = text.match(p.regex);
    return match
      ? [
          {
            type: "secret",
            ruleId: p.id,
            description: p.desc,
            match: match[0],
          },
        ]
      : [];
  });
}
