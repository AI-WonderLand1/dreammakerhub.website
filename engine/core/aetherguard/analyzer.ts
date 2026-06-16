import { runModel } from "@core/ai/runModel";
import { VulnerabilityRisk, AuditResult } from "./types";

<<<<<<< HEAD
const DEFAULT_MODEL = "opencode/big-pickle";
=======
const DEFAULT_MODEL = "groq/llama-3.3-70b-versatile";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

const AUDIT_SYSTEM_PROMPT = `You are a code security auditor. Analyze the workspace codebase and:
1. Identify bugs, vulnerabilities, and security risks.
2. Provide line numbers, descriptions, and remediation patches.
3. Detect code patterns across the repository.
Return a JSON object with "vulnerabilities" (array) and "patterns" (array).`;

function validateAuditResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.vulnerabilities) && Array.isArray(obj.patterns);
}

export async function analyzeCode(
  repoPrompt: string,
  model: string = DEFAULT_MODEL
): Promise<AuditResult> {
  const response = await runModel({
    model,
    messages: [{ role: "user", content: repoPrompt }],
    system: AUDIT_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 4096,
  });

  const text = (response as Record<string, string>)?.text ?? "";
  if (!text) throw new Error("Empty response from AI model");

  let result: unknown;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  if (!validateAuditResponse(result)) {
    throw new Error("AI response missing required fields");
  }

  return {
    vulnerabilities: (result as AuditResult).vulnerabilities,
    patterns: (result as AuditResult).patterns,
    timestamp: Date.now(),
  };
}

export async function explainPatch(
  vulnerability: VulnerabilityRisk,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const prompt = `Vulnerability: ${vulnerability.vulnerabilityType}
Line: ${vulnerability.line}
Description: ${vulnerability.description}

Old code:
\`\`\`
${vulnerability.oldCode}
\`\`\`

New code:
\`\`\`
${vulnerability.newCode}
\`\`\`

Explain how the new code fixes the issue.`;

  const response = await runModel({
    model,
    messages: [{ role: "user", content: prompt }],
    system: "You are a code reviewer. Explain how the proposed patch fixes the vulnerability. Use plain language.",
    temperature: 0.3,
    maxTokens: 1024,
  });

  return (response as Record<string, string>)?.text ?? "No explanation generated.";
}
