/**
 * Wonderland Personal Information Scanner
 *
 * Detects:
 *  - Email addresses
 *  - Phone numbers
 *  - Physical addresses
 *
 * Lightweight, deterministic, and safe for pipeline integration.
 */

export interface PersonalInfoViolation {
  type: "personal-info";
  ruleId: string;
  description: string;
  match?: string;
}

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

/**
 * Run all personal‑info patterns against text.
 */
export function scanPersonalInfo(text: string): PersonalInfoViolation[] {
  if (!text || typeof text !== "string") return [];

  return PERSONAL_INFO_PATTERNS.flatMap((p) => {
    const match = text.match(p.regex);
    return match
      ? [
          {
            type: "personal-info",
            ruleId: p.id,
            description: p.desc,
            match: match[0],
          },
        ]
      : [];
  });
}
