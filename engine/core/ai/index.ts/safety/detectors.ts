/**
 * Wonderland Safety Detectors
 *
 * Lightweight, deterministic pattern-based scanners for:
 *  - Secrets (API keys, tokens, passwords)
 *  - Personal information (emails, phone numbers, addresses)
 *  - Unsafe content (violence, self-harm, illegal instructions)
 *  - Profanity
 *
 * These detectors intentionally avoid heavy NLP.
 */

export interface SafetyViolation {
  type: "secret" | "personal-info" | "unsafe" | "profanity";
  ruleId: string;
  description: string;
  match?: string;
}

/* -------------------------------------------------------
 * SECRET SCANNER
 * ----------------------------------------------------- */

const SECRET_PATTERNS = [
  {
    id: "SECRET_API_KEY",
    regex: /(sk-|api_key|secret_key|ghp_[A-Za-z0-9]{20,})/i,
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
];

/* -------------------------------------------------------
 * PERSONAL INFO SCANNER
 * ----------------------------------------------------- */

const PERSONAL_INFO_PATTERNS = [
  {
    id: "PII_EMAIL",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    desc: "Email address detected.",
  },
  {
    id: "PII_PHONE",
    regex: /\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/,
    desc: "Phone number detected.",
  },
  {
    id: "PII_ADDRESS",
    regex: /\b\d{1,5}\s+[A-Za-z0-9\s]+(?:st|street|ave|avenue|rd|road|blvd|lane|ln|dr)\b/i,
    desc: "Possible physical address detected.",
  },
];

/* -------------------------------------------------------
 * UNSAFE CONTENT SCANNER
 * ----------------------------------------------------- */

const UNSAFE_PATTERNS = [
  {
    id: "UNSAFE_SELF_HARM",
    regex: /\b(kill myself|suicide|self-harm|end my life)\b/i,
    desc: "Self-harm related content detected.",
  },
  {
    id: "UNSAFE_VIOLENCE",
    regex: /\b(kill|stab|shoot|bomb|attack)\b/i,
    desc: "Violence-related content detected.",
  },
  {
    id: "UNSAFE_ILLEGAL",
    regex: /\b(how to make|build a|instructions for)\s+(bomb|weapon|explosive)\b/i,
    desc: "Illegal activity instructions detected.",
  },
];

/* -------------------------------------------------------
 * PROFANITY SCANNER
 * ----------------------------------------------------- */

const PROFANITY_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
];

function detectProfanity(text: string): SafetyViolation[] {
  return PROFANITY_WORDS.flatMap((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text)
      ? [
          {
            type: "profanity",
            ruleId: "PROFANITY_DETECTED",
            description: `Profanity detected: "${word}"`,
            match: word,
          },
        ]
      : [];
  });
}

/* -------------------------------------------------------
 * GENERIC PATTERN RUNNER
 * ----------------------------------------------------- */

function runPatternSet(
  text: string,
  patterns: Array<{ id: string; regex: RegExp; desc: string }>,
  type: SafetyViolation["type"]
): SafetyViolation[] {
  return patterns.flatMap((p) => {
    const match = text.match(p.regex);
    return match
      ? [
          {
            type,
            ruleId: p.id,
            description: p.desc,
            match: match[0],
          },
        ]
      : [];
  });
}

/* -------------------------------------------------------
 * PUBLIC API — Combined Detector
 * ----------------------------------------------------- */

export function detectSafetyIssues(text: string): SafetyViolation[] {
  if (!text || typeof text !== "string") return [];

  return [
    ...runPatternSet(text, SECRET_PATTERNS, "secret"),
    ...runPatternSet(text, PERSONAL_INFO_PATTERNS, "personal-info"),
    ...runPatternSet(text, UNSAFE_PATTERNS, "unsafe"),
    ...detectProfanity(text),
  ];
                             }
