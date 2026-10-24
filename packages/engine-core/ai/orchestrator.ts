import { getStats, isDaemonRunning } from '../aetherguard/daemon';
import { analyzeCode, explainPatch } from '../aetherguard/analyzer';
import { walkDir, assembleRepoContentPrompt } from '../aetherguard/scanner';
import { getAutoFixLog } from '../aetherguard/autofix';
import { checkEslint } from '../aetherguard/checks/eslint';
import { checkTypeScript } from '../aetherguard/checks/typecheck';
import { checkDeps } from '../aetherguard/checks/deps';
import type { VulnerabilityRisk } from '../aetherguard/types';

export class Orchestrator {
  async generateAndSaveProject(input: Record<string, unknown>) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Phase 4: Default to spatial engine when no engine type is specified.
    // Never overwrite an existing project's engine.
    const buildType = (input.type as string) || 'spatial';
    const prompt = (input.prompt as string) || (input.description as string) || '';

    if (!prompt) {
      throw new Error('Orchestrator: prompt is required but was not provided.');
    }

    const runnerResponse = await fetch(`${baseUrl}/api/build/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: buildType,
        prompt,
        save: input.save ?? false,
        fileName: input.fileName,
      }),
    });

    if (!runnerResponse.ok) {
      throw new Error(`Runner failed with status ${runnerResponse.status}.`);
    }

    return runnerResponse.json();
  }

  // AetherGuard integration — enables AI to perform self-maintenance

  async runAudit(): Promise<unknown> {
    const files = walkDir(process.cwd(), process.cwd());
    const prompt = assembleRepoContentPrompt(files);
    return analyzeCode(prompt);
  }

  async getDaemonStatus() {
    return { running: isDaemonRunning(), stats: getStats() };
  }

  async getAutoFixHistory() {
    return getAutoFixLog();
  }

  async runEslintChecks() {
    return checkEslint(process.cwd());
  }

  async runTypeCheck() {
    return checkTypeScript(process.cwd());
  }

  async runDepsCheck() {
    return checkDeps(process.cwd());
  }

  async explainVulnerability(vulnJson: string) {
    const vuln = JSON.parse(vulnJson) as VulnerabilityRisk;
    return explainPatch(vuln);
  }
}

export async function generateAndSaveProject(input: Record<string, unknown>) {
  const orchestrator = new Orchestrator();
  return orchestrator.generateAndSaveProject(input);
}