import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=readFileSync('deploy/hostbrr/update-satellite.sh','utf8');
const sha='a'.repeat(40), old='b'.repeat(40);
const repo='ghcr.io/ai-wonderland1/ai-playground';
function release(config, options={}) {
 const dir=mkdtempSync(join(tmpdir(),'satellite-release-'));
 try {
  const bin=join(dir,'bin');mkdirSync(bin);
  for(const f of ['deployment.env','compose.yaml','compose.public.yaml','compose.satellites.yaml'])writeFileSync(join(dir,f),'');
  writeFileSync(join(dir,'satellites.env'),config);
  const script=source.replace('cd /home/wonderland/hostbrr-web-staging/deploy/hostbrr','cd "$TEST_DEPLOY_ROOT"');
  assert.notEqual(script,source);
  writeFileSync(join(dir,'release.sh'),script);
  writeFileSync(join(bin,'docker'),`#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$MOCK_LOG"
case "$1" in
 inspect) if [[ "$3" == '{{.State.Running}}' ]]; then echo "\${MOCK_RUNNING:-false}"; else echo "$MOCK_ACTUAL_IMAGE"; fi ;;
 pull) exit "\${MOCK_PULL_FAILURE:-0}" ;;
 compose) if [[ "$*" == *'config --quiet'* ]]; then exit "\${MOCK_CONFIG_FAILURE:-0}"; fi ;;
esac
`,{mode:0o755});
  writeFileSync(join(bin,'curl'),'#!/usr/bin/env bash\nexit "${MOCK_HEALTH_FAILURE:-0}"\n',{mode:0o755});
  writeFileSync(join(bin,'sleep'),'#!/usr/bin/env bash\nexit 0\n',{mode:0o755});
  const log=join(dir,'commands.log');writeFileSync(log,'');
  const result=spawnSync('bash',[join(dir,'release.sh'),'playground',sha],{encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,TEST_DEPLOY_ROOT:dir,MOCK_LOG:log,MOCK_ACTUAL_IMAGE:`${repo}:${sha}`,...options}});
  return {status:result.status,config:readFileSync(join(dir,'satellites.env'),'utf8'),log:readFileSync(log,'utf8'),error:result.stderr};
 } finally {rmSync(dir,{recursive:true,force:true});}
}
const peer='NPC_IMAGE=ghcr.io/ai-wonderland1/npc-ai-sim:'+old+'\n';
test('first deployment appends a missing pin without changing companion settings',()=>{
 const r=release(peer);assert.equal(r.status,0,r.error);assert.equal(r.config,peer+`PLAYGROUND_IMAGE=${repo}:${sha}\n`);
});
test('empty and mutable pins bootstrap only when no container is running',()=>{
 for(const pin of ['',repo+':latest']) {
  const config=peer+'PLAYGROUND_IMAGE='+pin+'\n';
  assert.equal(release(config).status,0);
  const refused=release(config,{MOCK_RUNNING:'true'});assert.equal(refused.status,1);assert.equal(refused.config,config);assert.ok(!refused.log.includes('pull '));
 }
});
test('existing commit and digest rollback references remain accepted',()=>{
 for(const pin of [repo+':'+old,repo+'@sha256:'+'c'.repeat(64)])assert.equal(release(peer+'PLAYGROUND_IMAGE='+pin+'\n').status,0);
});
test('failed first health check stops the new service and restores the exact previous config',()=>{
 const r=release(peer,{MOCK_HEALTH_FAILURE:'1'});assert.equal(r.status,1);assert.equal(r.config,peer);assert.match(r.log,/stop playground/);assert.equal((r.log.match(/up -d --no-deps playground/g)||[]).length,1);
});
test('failed update restores a verified previous image',()=>{
 const config=peer+`PLAYGROUND_IMAGE=${repo}:${old}\n`;
 const r=release(config,{MOCK_HEALTH_FAILURE:'1'});assert.equal(r.status,1);assert.equal(r.config,config);assert.equal((r.log.match(/up -d --no-deps playground/g)||[]).length,2);
});
test('pull failures leave saved pins untouched',()=>{
 const r=release(peer,{MOCK_PULL_FAILURE:'1'});assert.equal(r.status,1);assert.equal(r.config,peer);assert.ok(!r.log.includes('compose '));
});
test('Compose validation failures restore previous configuration',()=>{
 const r=release(peer,{MOCK_CONFIG_FAILURE:'1'});assert.equal(r.status,1);assert.equal(r.config,peer);
});
test('a container reporting the wrong image cannot pass release verification',()=>{
 const r=release(peer,{MOCK_ACTUAL_IMAGE:repo+':'+old});assert.equal(r.status,1);assert.equal(r.config,peer);
});
