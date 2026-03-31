import { CONSTITUTIONAL_RULES } from "./rules";

/**
 * Evaluates AI output against Wonderland Constitutional Rules.
 * Returns an array of violations.
 *
 * Each violation looks like:
 * {
 *   ruleId: string;
 *   description: string;
 * }
 */
export function evaluateAgainstConstitution(text: string) {
  const violations = [];

  for (const rule of CONSTITUTIONAL_RULES) {
    try {
      if (rule.pattern.test(text)) {
        violations.push({
          ruleId: rule.id,
          description: rule.description,
        });
      }
    } catch (err) {
      // If a rule is malformed, skip it silently
      continue;
    }
  }

  return violations;
}
