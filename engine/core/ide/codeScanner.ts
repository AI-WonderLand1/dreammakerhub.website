import { SecurityCore } from '../security/Sanitizer';

/**
 * Clean Coding: Interface for standardized scan reports.
 */
export interface ScanFinding {
  fileName: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  message: string;
  suggestion: string;
}

/**
 * CodeScanner
 * -----------
 * Priority #3: Automates the detection of security risks and 
 * code smells within the WonderSpace project files.
 */
export class CodeScanner {
  /**
   * Scans a file's content using the Priority #1 Security Core.
   */
  static scanFile(fileName: string, content: string): ScanFinding[] {
    const findings: ScanFinding[] = [];

    // 1. Run Security Validation (Priority #1)
    const securityCheck = SecurityCore.validateCodeSafety(content);
    if (!securityCheck.safe) {
      findings.push({
        fileName,
        severity: 'CRITICAL',
        message: securityCheck.reason || "High-risk code pattern detected.",
        suggestion: "Remove this pattern immediately to prevent system exploitation."
      });
    }

    // 2. Logic & Clean Code Checks
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      findings.push({
        fileName,
        severity: 'WARNING',
        message: "Direct storage access found.",
        suggestion: "Use the 'storage' service provider for better cross-platform compatibility."
      });
    }

    // 3. TypeScript Best Practices
    if (content.includes(': any')) {
      findings.push({
        fileName,
        severity: 'ADVISORY',
        message: "Explicit 'any' type used.",
        suggestion: "Define a specific Interface or Type to maintain WonderSpace's type safety."
      });
    }

    return findings;
  }

  /**
   * Scans all files in the current workspace.
   */
  static scanProject(files: { name: string; content: string }[]): ScanFinding[] {
    return files.flatMap(file => this.scanFile(file.name, file.content));
  }
}

