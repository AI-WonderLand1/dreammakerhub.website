export class Orchestrator {
  async generateAndSaveProject(input: any) {
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
}

export async function generateAndSaveProject(input: any) {
  const orchestrator = new Orchestrator();
  return orchestrator.generateAndSaveProject(input);
}