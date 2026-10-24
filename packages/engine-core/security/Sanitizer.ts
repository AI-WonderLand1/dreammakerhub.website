
/**
 * Clean Coding: We use a static class to provide security utility
 * across the entire WonderSpace engine.
 */
export class SecurityCore {
  // A comprehensive list of patterns that could harm your server or leak data
  private static readonly DANGEROUS_PATTERNS = [
    "rm -rf",         // Filesystem deletion
    "process.env",    // Environment variable leakage
    "eval(",          // Dynamic code execution (Major risk)
    "exec(",          // Shell command execution
    "execSync",       // Synchronous shell execution
    "spawn(",         // Process spawning
    "child_process",  // Node child process module
    "require('fs')",  // File system access
    "require(\"fs\")", // File system access (double quotes)
    "require('path')",// Path module access
    "<script",        // XSS (Cross-Site Scripting)
    "document.cookie",// Session hijacking
    "localStorage",   // Token theft
    "chmod",          // Permission changes
    ".bashrc",        // Shell configuration tampering
    "new Function(",  // Dynamic function creation
    "import('",       // Dynamic import
    "import(\"",      // Dynamic import
    "__proto__",      // Prototype pollution
    "constructor[",   // Prototype pollution
    "process.exit",   // Process termination
    "child_process",  // Process spawning module
  ];

  /**
   * Scans any input string (prompt or code) for security risks.
   * Priority #1: Security
   */
  static validateCodeSafety(input: string): { safe: boolean; reason?: string } {
    if (!input) return { safe: true };

    const lower = input.toLowerCase();
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (lower.includes(pattern.toLowerCase())) {
        return { 
          safe: false, 
          reason: `Security Block: Malicious pattern '${pattern}' detected.` 
        };
      }
    }

    return { safe: true };
  }
}

