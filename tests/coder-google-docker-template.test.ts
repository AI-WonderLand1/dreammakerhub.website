import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Google Docker Coder workspace template', () => {
  const template = read('infra/coder/google-docker-template/main.tf');
  const entrypoint = read('infra/coder/workspace-image/entrypoint.sh');

  it('uses Docker with the AI WONDERLAND workspace image', () => {
    expect(template).toContain('source = "kreuzwerker/docker"');
    expect(template).toContain('ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest');
    expect(template).toContain('resource "docker_container" "workspace"');
    expect(template).toContain('resource "docker_volume" "home_volume"');
  });

  it('keeps /home/coder persistent and includes the browser IDE tools', () => {
    expect(template).toContain('container_path = "/home/coder"');
    expect(template).toContain('module "code-server"');
    expect(template).toContain('module "git-config"');
    expect(template).toContain('module "filebrowser"');
    expect(template).toContain('database_path = "/home/coder/.filebrowser/filebrowser.db"');
  });

  it('passes the Coder init script to the image entrypoint instead of bypassing it', () => {
    expect(template).toContain('CODER_INIT_SCRIPT_B64=%s');
    expect(template).toContain('base64encode(');
    expect(template).not.toMatch(/^\s*entrypoint\s*=/m);
    expect(template).not.toMatch(/^\s*user\s*=\s*"root"/m);
    expect(entrypoint).toContain('exec su -s /bin/bash coder "$INIT_SCRIPT_FILE"');
  });

  it('does not expose host-level resource metadata to workspace users', () => {
    expect(template).not.toContain('CPU Usage (Host)');
    expect(template).not.toContain('Memory Usage (Host)');
    expect(template).not.toContain('Load Average (Host)');
    expect(template).not.toContain('Swap Usage (Host)');
  });
});
