// Deployment architecture policy regression check (no cloud access or credentials).
// Railway hosts the web and apps; AWS EKS is the only customer IDE Kubernetes target.
// UpCloud workflows are retained solely for operator-initiated recovery.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(path,'utf8');
const trigger = yaml => yaml.split(/^permissions:/m)[0];
const upcloud = read('.github/workflows/deploy-upcloud.yml');
const cleanup = read('.github/workflows/upcloud-docker-cleanup.yml');
const eks = read('.github/workflows/aws-customer-pod-preflight.yml');
const railway = JSON.parse(read('railway.json'));
assert.match(trigger(upcloud), /^on:\s*\n\s*workflow_dispatch:/m);
assert.doesNotMatch(trigger(upcloud), /\bworkflow_run:|\bpush:|\bschedule:/);
assert.match(upcloud, /github\.ref == 'refs\/heads\/Master'/);
assert.match(trigger(cleanup), /^on:\s*\n\s*workflow_dispatch:/m);
assert.doesNotMatch(trigger(cleanup), /\bpush:|\bschedule:/);
assert.match(trigger(eks), /^on:\s*\n\s*workflow_dispatch:/m);
assert.match(eks, /aws-customer-pod-preflight\.sh/);
assert.match(eks, /refs\/heads\/Master/);
assert.equal(railway.deploy.healthcheckPath,'/health');
console.log('PASS: Railway-primary, AWS-EKS-IDE and manual-only UpCloud deployment policy');
