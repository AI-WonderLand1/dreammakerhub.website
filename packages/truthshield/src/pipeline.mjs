import { inspect } from './core.mjs';

/**
 * Model-agnostic gateway: all agents pass through the same mandatory gate.
 * AI adapters can call local inference, remote endpoints, or IDE tooling.
 * No deployment or repository writes take place here.
 */
export async function runPipeline({ tenantId, runId, prompt, agents, priorReceipt }, options = {}) {
  if (!Array.isArray(agents) || agents.length < 1 || agents.length > 16)
    throw Error('Pipeline requires 1 to 16 configured agents');
  if (agents.some(a => !a || typeof a.id !== 'string' || typeof a.generate !== 'function'))
    throw Error('Every agent must provide id and generate(input, {signal})');
  if (new Set(agents.map(a => a.id)).size !== agents.length) throw Error('Duplicate agent identifiers');
  const results=[];
  let previous=priorReceipt || null;
  let candidate=null;
  for (let i=0; i<agents.length; i++) {
    const agent=agents[i];
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 120_000;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 600_000) throw Error('Invalid agent time budget');
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    let response;
    try {
      response=await Promise.race([
        Promise.resolve().then(()=>agent.generate({tenantId,runId,prompt,previousCandidate:candidate,
          previousReceipt:previous},{signal:controller.signal})),
        new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Agent timed out')),{once:true}))
      ]);
    } catch (error) {
      return { status:'stopped', reason:'AGENT_ERROR', stoppedAt:agent.id,
        error:error instanceof Error?error.message:'Generation failed', results };
    } finally { clearTimeout(timeout); }
    const input={tenantId,runId,agentId:agent.id,stage:i===0 && !priorReceipt?'draft':'handoff',
      candidate:response?.candidate,claims:response?.claims || [],evidence:response?.evidence || [],
      ...(i>0 || priorReceipt ? {previous}: {})};
    let report;
    try {
      report=await inspect(input,options);
    } catch (error) {
      return { status:'stopped', reason:'INVALID_AGENT_OUTPUT', stoppedAt:agent.id,
        error:error instanceof Error?error.message:'Invalid candidate', results };
    }
    results.push({agentId:agent.id, report});
    if (report.decision !== 'approved') return {
      status:'stopped', reason:report.decision === 'blocked' ? 'HARD_STOP' : 'HUMAN_REVIEW_REQUIRED',
      stoppedAt:agent.id, results
    };
    // This receipt is available only when the operator configured signing.
    if (!report.receipt) return {status:'stopped',reason:'AUDIT_SIGNATURE_REQUIRED',stoppedAt:agent.id,results};
    previous=report.receipt;
    candidate=response.candidate;
  }
  return { status:'checks_passed', warning:'Only the checks and signed evidence shown in reports are verified',
    receipt:previous, candidate, results };
}
