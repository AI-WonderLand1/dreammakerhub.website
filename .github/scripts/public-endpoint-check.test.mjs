import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEndpoints, renderSummary } from './public-endpoint-check.mjs';
const one = [{ name: 'Test endpoint', url: 'https://example.test/', type: 'html' }];
test('passes resolved HTTPS endpoint only on HTTP 200 and expected content type', async () => {
  const r = await inspectEndpoints({list:one,resolve:async()=>({address:'127.0.0.1'}),request:async()=>({status:200,headers:new Headers({'content-type':'text/html; charset=utf-8'})})});
  assert.equal(r[0].result,'PASS'); assert.match(renderSummary(r), /PASS/);
});
test('does not claim success on Cloudflare challenge or redirect', async () => {
  for (const status of [301,403,503]) {
    const r=await inspectEndpoints({list:one,resolve:async()=>{},request:async()=>({status,headers:new Headers({'content-type':'text/html'})})});
    assert.equal(r[0].result,'FAIL');assert.equal(r[0].http,String(status));
  }
});
test('does not mark a DNS outage as success or call HTTP', async () => {
  const r=await inspectEndpoints({list:one,resolve:async()=>{throw Error('DNS');},request:async()=>{throw Error('must not request');}});
  assert.equal(r[0].dns,'unresolved');assert.equal(r[0].http,'not checked');assert.equal(r[0].result,'FAIL');
});
test('requires valid JSON for JSON endpoint', async () => {
  const r=await inspectEndpoints({list:[{...one[0],type:'json'}],resolve:async()=>{},request:async()=>({status:200,headers:new Headers({'content-type':'application/json'}),json:async()=>{throw Error('bad json');}})});
  assert.equal(r[0].result,'FAIL');
});

test('checks both positive and negative authorization expectations', async () => {
  const protectedEndpoint = [{ name: 'Protected', url: 'https://example.test/api/projects', type: 'json', expectedStatus: 401 }];
  const resolve = async()=>{};
  const deny = await inspectEndpoints({list:protectedEndpoint,resolve,request:async()=>({status:401,headers:new Headers({'content-type':'application/json'}),json:async()=>({error:'Unauthorized'})})});
  assert.equal(deny[0].result,'PASS');
  const leak = await inspectEndpoints({list:protectedEndpoint,resolve,request:async()=>({status:200,headers:new Headers({'content-type':'application/json'}),json:async()=>({projects:[]})})});
  assert.equal(leak[0].result,'FAIL');
});
