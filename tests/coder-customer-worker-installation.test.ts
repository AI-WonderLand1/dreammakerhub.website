import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('AWS paused customer worker installation guardrails', () => {
  const manifest = read('infra/coder/customer-worker-cronjobs.yaml');
  const installer = read('infra/coder/install-paused-customer-workers.sh');

  it('ships both schedulers suspended, bounded and without a runnable image tag', () => {
    expect(manifest.match(/kind: CronJob/g)).toHaveLength(2);
    expect(manifest.match(/suspend: true/g)).toHaveLength(2);
    expect(manifest.match(/REPLACE_WITH_REVIEWED_CURL_IMAGE_DIGEST/g)).toHaveLength(2);
    expect(manifest.match(/readOnlyRootFilesystem: true/g)).toHaveLength(2);
    expect(manifest.match(/automountServiceAccountToken: false/g)).toHaveLength(2);
    expect(manifest.match(/limits: \{ cpu: 100m, memory: 128Mi \}/g)).toHaveLength(2);
  });

  it('pins exact cluster identity before any install and refuses implicit activation', () => {
    expect(installer).toContain('EXPECTED_KUBE_CONTEXT');
    expect(installer).toContain('EXPECTED_CLUSTER_ARN');
    expect(installer).toContain('cluster.endpoint');
    expect(installer).toContain('CONFIRM_INSTALL_PAUSED');
    expect(installer).toContain('INSTALL_SUSPENDED_ONLY');
    expect(installer).toContain('curlimages/curl@sha256:');
    expect(installer).toContain('apply --dry-run=server');
    expect(installer).toContain("suspended");
    expect(installer).not.toContain('patch cronjob');
    expect(installer).not.toContain('suspend=false');
  });
});
