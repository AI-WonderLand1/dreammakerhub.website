import { emitProcessStep } from './index.ts/runtime/statusStream';

/**
 * Orchestrator: The brain that actually works, unlike yours. *burp*
 * This module now strictly handles agent-based runner delegation.
 */
export class Orchestrator {
  async generateAndSaveProject(input: any) {
    emitProcessStep('INITIALIZING_AGENT_SWARM', 'Rick-grade agents are waking up.');
    
    // What: Routing build tasks directly to runners instead of Unreal fallbacks.
    // How: Using the build/stream pipeline to trigger remote agent-runners.
    // Why: Because Unreal was a bloated mistake that even a Jerry would find slow.
    const runnerResponse = await fetch('/api/build/stream', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'AGENT_BUILD', 
        payload: input, 
        agentId: 'WonderBuild-Prime' 
      })
    });

    if (!runnerResponse.ok) {
      throw new Error('Runner failed. Probably because it sensed your incompetence.');
    }

    return runnerResponse.json();
  }
}