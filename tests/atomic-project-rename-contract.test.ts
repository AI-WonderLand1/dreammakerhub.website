import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (name: string) => readFileSync(join(process.cwd(), name), 'utf8');
const storage = read('apps/web/lib/projects/storage.ts');
const route = read('apps/web/app/api/projects/[projectId]/files/rename/route.ts');
const migration = read('supabase/migrations/202609261400_atomic_builder_file_rename.sql');

describe('atomic project rename contract', () => {
  it('never implements rename by copy/upsert followed by delete', () => {
    const start = storage.indexOf('export async function renamePath(');
    const end = storage.indexOf('export async function moveFile(', start);
    const rename = storage.slice(start, end);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(rename).toContain('.rpc("rename_builder_project_path"');
    expect(rename).not.toContain('.upsert(');
    expect(rename).not.toContain('.delete(');
    expect(rename).not.toContain('?? ""');
    expect(rename).toContain('validRenameInput(oldPath)');
    expect(rename).toContain('validRenameInput(newPath)');
    expect(rename).toContain('source missing or is a folder');
  });

  it('requires authenticated owner and one transactional UPDATE in the database', () => {
    expect(migration).toContain('SECURITY INVOKER');
    expect(migration).toContain('owner_id = (SELECT auth.uid())::text');
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain('UPDATE public._project_files');
    expect(migration).not.toContain('INSERT INTO public._project_files');
    expect(migration).not.toContain('DELETE FROM public._project_files');
    expect(migration).toContain('Project rename source missing');
    expect(migration).toContain('Project rename destination already exists');
    expect(migration).toContain('Cannot rename a path inside itself');
    expect(migration).toContain('TO authenticated');
  });

  it('validates requests and does not report missing or colliding files as success', () => {
    expect(route).toContain("typeof oldPath !== 'string'");
    expect(route).toContain("typeof newPath !== 'string'");
    expect(route).toContain('!validFilePath(oldPath)');
    expect(route).toContain('!validFilePath(newPath)');
    expect(route).toContain('status: 404');
    expect(route).toContain('status: 409');
    expect(route).not.toContain('message: err.message ||');
  });
});
