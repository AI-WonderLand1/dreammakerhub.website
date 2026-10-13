import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { inspect, review, createReviewedReceipt, verifyReceipt } from '../src/core.mjs';
import { runPipeline } from '../src/pipeline.mjs';
import { proposePatch, reviewPatch } from '../src/fixes.mjs';
import { createTruthShieldServer } from '../src/server.mjs';

const AUDIT = 'audit-secret-only-in-local-tests'.repeat(2);
const input=()=>({tenantId:'demo',runId:'test-run',agentId:'alice',
  candidate:{text:'Proposed new file',files:[{path:'src/app.ts',content:'const answer=42;\n'}]},claims:[],evidence:[]});
test('multiagent pipeline stops before the next model on review',async()=>{
  let visited=0;
  const agents=[
    {id:'alice',generate:async()=>{visited++;return {candidate:{text:'We deployed this.',files:[]}};}},
    {id:'frontend',generate:async()=>{visited++;return {candidate:{text:'Will never execute',files:[]}};}}
  ];
  const out=await runPipeline({tenantId:'demo',runId:'run-99',prompt:'build site',agents},{auditSecret:AUDIT});
  assert.equal(out.reason,'HUMAN_REVIEW_REQUIRED');assert.equal(visited,1);
});
test('four different AI identities pass through signed mandatory gates',async()=>{
  const names=['alice','frontend','security','confessions'];
  const agents=names.map(id=>({id,generate:async()=>({candidate:{text:'Proposed '+id,files:[]}})}));
  const out=await runPipeline({tenantId:'demo',runId:'run-99',prompt:'build site',agents},{auditSecret:AUDIT});
  assert.equal(out.status,'checks_passed');assert.equal(out.results.length,4);
  assert.ok(verifyReceipt(out.receipt,AUDIT));
  assert.equal(out.results[3].report.previousReportHash,out.results[2].report.reportHash);
});
test('missing audit signing fails closed on multiagent pipeline',async()=>{
  const agents=[{id:'alice',generate:async()=>({candidate:{text:'Proposed',files:[]}})}];
  const out=await runPipeline({tenantId:'demo',runId:'run-99',prompt:'x',agents},{});
  assert.equal(out.reason,'AUDIT_SIGNATURE_REQUIRED');
});
test('validator error hard-stops; benign validator can pass',async()=>{
  const i=input();
  const bad=await inspect(i,{validators:[{id:'dependency-audit',check:async()=>{throw Error('Backend offline');}}]});
  assert.equal(bad.decision,'blocked');
  assert.ok(bad.findings.some(f=>f.rule==='VALIDATOR_FAILED'));
  const good=await inspect(i,{validators:[{id:'dependency-audit',check:async()=>[]}]});
  assert.equal(good.decision,'approved');
});
test('proposed code patch requires human and is rechecked before release',async()=>{
  const i=input();
  const patch=proposePatch(i,{path:'src/app.ts',replacement:'const answer=43;\n',reason:'Correct the expected answer in source'});
  assert.equal(i.candidate.files[0].content,'const answer=42;\n');
  const result=await reviewPatch(i,patch,{reviewer:'owner',action:'approve',reason:'Approved changed constant after manual inspection'});
  assert.equal(result.status,'REVIEWED_PATCH_CHECKS_PASSED');
  assert.equal(result.candidate.files[0].content,'const answer=43;\n');
  assert.equal(i.candidate.files[0].content,'const answer=42;\n');
});
test('security issue in proposed patch is still blocked',async()=>{
  const i=input();
  const leaked=['sk','live','123456789012345678901234'].join('_');
  const patch=proposePatch(i,{path:'src/app.ts',replacement:'const password="'+leaked+'";',
    reason:'A proposed change carrying a secret'});
  const result=await reviewPatch(i,patch,{reviewer:'owner',action:'approve',reason:'Reviewed and requested validation'});
  assert.equal(result.status,'PATCH_STOPPED');assert.equal(result.report.decision,'blocked');
});
test('human-reviewed receipt can continue while keeping unverified status',async()=>{
  const i=input();i.claims=[{kind:'test',statement:'All tests passed',evidenceIds:[]}];
  const r=await inspect(i,{auditSecret:AUDIT});
  const human=review(r,{reviewer:'admin',action:'approve',
    reason:'Allowed only as unverified internal draft; do not publish as tested'});
  const receipt=createReviewedReceipt(r,human,AUDIT);
  assert.equal(receipt.decision,'human_approved_unverified');
  assert.equal(verifyReceipt(receipt,AUDIT),true);
});
test('API reviewer can issue audited signed receipt only on held cases',async()=>{
  const hash=(x)=>createHash('sha256').update(x).digest('hex');
  const api=createTruthShieldServer({auditSecret:AUDIT,entries:[
    {id:'scan-key',tenantId:'demo',sha256:hash('test-scan-token'),scopes:['scan']},
    {id:'reviewer-key',tenantId:'demo',sha256:hash('test-review-token'),scopes:['review']},
  ],rateLimit:20});
  api.listen(0,'127.0.0.1');await once(api,'listening');
  const base='http://127.0.0.1:'+api.address().port;
  const post=(route,token,obj)=>fetch(base+route,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(obj)});
  try{
    const i=input();i.claims=[{kind:'test',statement:'tests passed',evidenceIds:[]}];
    const r=await post('/v1/scan','test-scan-token',i);
    assert.equal(r.status,200);
    const report=await r.json();assert.equal(report.decision,'needs_human_review');
    const decided=await post('/v1/reviews','test-review-token',{reportHash:report.reportHash,
      action:'approve',reason:'Approved internal demo with no claims of tested production code'});
    assert.equal(decided.status,200);
    const response=await decided.json();
    assert.equal(response.status,'human_approved_unverified');
    assert.equal(verifyReceipt(response.reviewedReceipt,AUDIT),true);
  }finally{await new Promise(resolve=>api.close(resolve));}
});
