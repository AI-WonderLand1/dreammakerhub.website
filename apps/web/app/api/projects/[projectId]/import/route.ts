import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { writeFiles } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

const MAX_BODY_BYTES = 100 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const contentType = req.headers.get('content-type') || '';

    let files: Record<string, string>;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body?.files || typeof body.files !== 'object') {
        return NextResponse.json({ ok: false, message: 'files object required' }, { status: 400 });
      }
      files = body.files;
    } else {
      const formData = await req.formData();
      const uploaded = formData.get('file');
      if (!(uploaded instanceof File)) {
        return NextResponse.json({ ok: false, message: 'file upload required' }, { status: 400 });
      }
      if (uploaded.size > MAX_BODY_BYTES) {
        return NextResponse.json({ ok: false, message: 'File too large (max 100MB)' }, { status: 413 });
      }

      if (uploaded.name.endsWith('.zip')) {
        const buffer = Buffer.from(await uploaded.arrayBuffer());
        const zip = await JSZip.loadAsync(buffer);
        files = {};
        for (const [filePath, entry] of Object.entries(zip.files)) {
          if (entry.dir || filePath.startsWith('__MACOSX/')) continue;
          const content = await entry.async('string');
          files[filePath.replace(/^\/+/, '')] = content;
        }
      } else {
        const name = uploaded.name.replace(/^\/+/, '');
        files = { [name]: await uploaded.text() };
      }
    }

    if (Object.keys(files).length === 0) {
      return NextResponse.json({ ok: false, message: 'No importable files found' }, { status: 400 });
    }

    await writeFiles(projectId, userId, Object.entries(files).map(([path, content]) => ({ path, content })));

    return NextResponse.json({
      ok: true,
      message: `Imported ${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'}`,
      fileCount: Object.keys(files).length,
    });
  } catch (err: any) {
    logger.error('Import error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Import failed' },
      { status: 500 }
    );
  }
}
