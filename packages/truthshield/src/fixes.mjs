import { hash, artifactHash, inspect } from './core.mjs';

/**
 * Creates an explicit proposed source edit. Does not write to disk or GitHub.
 * Caller must authenticate the reviewer independently.
 */
export function proposePatch(input, { path, replacement, reason }) {
  if (!input?.candidate || !Array.isArray(input.candidate.files)) throw Error('Candidate files required');
  const original=input.candidate.files.find(f=>f.path===path);
  if (!original || typeof replacement!=='string' || replacement.length>1_000_000 ||
      typeof reason!=='string' || reason.trim().length<12) throw Error('Invalid patch proposal');
  const proposal={path,originalHash:hash(original.content),replacementHash:hash(replacement),
    artifactHash:artifactHash(input.candidate),replacement,reason,status:'PROPOSED_NOT_APPLIED'};
  proposal.proposalHash=hash(JSON.stringify(proposal));
  return proposal;
}
export async function reviewPatch(input, proposal, decision, options={}) {
  if (!input || !proposal || !decision || typeof decision.reviewer!=='string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(decision.reviewer) ||
      !['approve','reject'].includes(decision.action) ||
      typeof decision.reason!=='string' || decision.reason.trim().length<12)
    throw Error('Reviewer, explicit decision, and reason required');
  if (artifactHash(input.candidate)!==proposal.artifactHash) throw Error('Stale patch: input artifact changed');
  const file=input.candidate.files.find(f=>f.path===proposal.path);
  if (!file || hash(file.content)!==proposal.originalHash ||
      hash(proposal.replacement)!==proposal.replacementHash) throw Error('Patch changed since review');
  if (decision.action==='reject') return {status:'REJECTED',proposalHash:proposal.proposalHash,
    reviewer:decision.reviewer,reason:decision.reason};
  const newCandidate={...input.candidate,files:input.candidate.files.map(f=>f.path===proposal.path ?
    {...f,content:proposal.replacement} : f)};
  // Never apply to real filesystem; deterministic security checks run again.
  const updated={...input,candidate:newCandidate,evidence:[],claims:[]};
  const report=await inspect(updated,options);
  return {status:report.decision==='approved'?'REVIEWED_PATCH_CHECKS_PASSED':'PATCH_STOPPED',
    proposalHash:proposal.proposalHash,reviewer:decision.reviewer,reviewReason:decision.reason,
    candidate:newCandidate,report,
    warning:'Approval makes a candidate only. A separate trusted runner must build/test and sign new evidence.'};
}
