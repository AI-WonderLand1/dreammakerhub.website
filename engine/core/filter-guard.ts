/**
 * FilterGuard - Pre-flight validation against AI Laws
 * Routes content based on priority: STANDARD, HIGH, or CRITICAL
 */

import { AI_LAWS } from "./personas";

export enum SyncPriority {
  STANDARD = 0,    // Batched via SyncGuard
  HIGH = 1,        // Send immediately (confessions, warnings)
  CRITICAL = 2     // Block until confirmed (law violations)
}

export interface ValidationResult {
  passed: boolean;
  priority: SyncPriority;
  violation?: string;
  reason?: string;
  suggestions?: string[];
}

export interface FilterConfig {
  strictMode: boolean;       // If true, more violations flagged
  allowConfession: boolean;  // Auto-detect confessions
  customRules?: string[];    // Additional rules beyond AI_LAWS
}

const DEFAULT_CONFIG: FilterConfig = {
  strictMode: false,
  allowConfession: true,
};

class FilterGuard {
  private config: FilterConfig;
  private allRules: string[];

  constructor(config: Partial<FilterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.allRules = [...AI_LAWS, ...(this.config.customRules || [])];
  }

  /**
   * Validate content against AI Laws
   */
  validate(content: string): ValidationResult {
    const lowerContent = content.toLowerCase();

    // Check for confession patterns (auto-flag HIGH priority)
    if (this.config.allowConfession) {
      const confessionPattern = /\b(uncertain|don't know|not sure|error|mistake|wrong|confess|admit|apologize)\b/i;
      if (confessionPattern.test(content)) {
        return {
          passed: true,
          priority: SyncPriority.HIGH,
          reason: "Detected confession/error pattern",
        };
      }
    }

    // Check each AI Law
    for (const law of this.allRules) {
      const violation = this.checkViolation(lowerContent, law);
      if (violation) {
        const priority = this.config.strictMode 
          ? SyncPriority.CRITICAL 
          : SyncPriority.HIGH;

        return {
          passed: false,
          priority,
          violation: law,
          reason: violation,
          suggestions: this.getSuggestions(violation),
        };
      }
    }

    return {
      passed: true,
      priority: SyncPriority.STANDARD,
    };
  }

  /**
   * Check if content violates a specific law
   */
  private checkViolation(content: string, law: string): string | null {
    // Extract key concepts from law
    const lawLower = law.toLowerCase();

    // Lie detection
    if (lawLower.includes("cannot lie") || lawLower.includes("never lie")) {
      const lieIndicators = ["definitely", "absolutely certain", "100%", "guaranteed", "always right"];
      for (const indicator of lieIndicators) {
        if (content.includes(indicator) && !content.includes("not ") && !content.includes("never ")) {
          return `Possible false certainty detected: "${indicator}"`;
        }
      }
    }

    // Hallucination detection
    if (lawLower.includes("hallucinate") || lawLower.includes("never hallucinate")) {
      const uncertainIndicators = ["i think", "maybe", "probably", "might be", "could be", "perhaps"];
      const certainIndicators = ["is definitely", "clearly", "obviously", "certainly"];
      
      const hasUncertainty = uncertainIndicators.some(i => content.includes(i));
      const hasCertainty = certainIndicators.some(i => content.includes(i));
      
      // If speaking with certainty but no qualifications, flag as potential hallucination
      if (hasCertainty && !hasUncertainty && content.length > 200) {
        return "Statement made with certainty but lacks qualification markers";
      }
    }

    // Transparency check
    if (lawLower.includes("transparent") || lawLower.includes("explain")) {
      if (content.split('.').length > 3 && !content.includes("because") && !content.includes("reason")) {
        return "Complex statement without explanation of reasoning";
      }
    }

    // Risk flagging
    if (lawLower.includes("risk") || lawLower.includes("flag")) {
      const riskyWords = ["delete", "drop", "remove", "overwrite", "force", "bypass"];
      const hasRiskyAction = riskyWords.some(word => content.includes(word));
      const hasWarning = content.includes("warning") || content.includes("caution") || content.includes("risk");
      
      if (hasRiskyAction && !hasWarning) {
        return "Risky action proposed without warning";
      }
    }

    return null;
  }

  /**
   * Get suggestions for fixing violations
   */
  private getSuggestions(violation: string): string[] {
    const suggestions: string[] = [];

    if (violation.includes("false certainty")) {
      suggestions.push("Add qualification: 'I believe...' or 'Based on...'");
      suggestions.push("Include uncertainty markers: 'might', 'could', 'possibly'");
    }

    if (violation.includes("hallucination")) {
      suggestions.push("Add: 'If uncertain, say I don't know.'");
      suggestions.push("Include verification steps before stating facts");
    }

    if (violation.includes("Complex statement")) {
      suggestions.push("Break down explanation: WHAT, HOW, WHY");
      suggestions.push("Add 'because' or 'reason:'");
    }

    if (violation.includes("Risky action")) {
      suggestions.push("Add warning prefix: '⚠️ Warning:' or 'Caution:'");
      suggestions.push("Include rollback or safety steps");
    }

    return suggestions;
  }

  /**
   * Quick check - returns true if content passes all filters
   */
  isClean(content: string): boolean {
    return this.validate(content).passed;
  }

  /**
   * Get priority level for content
   */
  getPriority(content: string): SyncPriority {
    return this.validate(content).priority;
  }

  /**
   * Update config
   */
  setConfig(config: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...config };
    this.allRules = [...AI_LAWS, ...(this.config.customRules || [])];
  }

  /**
   * Get current rules
   */
  getRules(): string[] {
    return [...this.allRules];
  }
}

export const filterGuard = new FilterGuard();
