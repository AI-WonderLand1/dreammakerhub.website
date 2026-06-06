import { getStats, isDaemonRunning } from '@core/aetherguard/daemon';
import { analyzeCode, explainPatch } from '@core/aetherguard/analyzer';
import { walkDir, assembleRepoContentPrompt } from '@core/aetherguard/scanner';
import { getAutoFixLog } from '@core/aetherguard/autofix';
import { checkEslint } from '@core/aetherguard/checks/eslint';
import { checkTypeScript } from '@core/aetherguard/checks/typecheck';
import { checkDeps } from '@core/aetherguard/checks/deps';

export class Orchestrator {
  async generateAndSaveProject(input: Record<string, unknown>) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const runnerResponse = await fetch(`${baseUrl}/api/build/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AGENT_BUILD',
        payload: input,
        agentId: 'WonderBuild-Prime',
      }),
    });

    if (!runnerResponse.ok) {
      throw new Error('Runner failed. Probably because it sensed your incompetence.');
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
    const vuln = JSON.parse(vulnJson) as import('@core/aetherguard/types').VulnerabilityRisk;
    return explainPatch(vuln);
  }
}

export async function generateAndSaveProject(input: Record<string, unknown>) {
  const orchestrator = new Orchestrator();
  return orchestrator.generateAndSaveProject(input);
}