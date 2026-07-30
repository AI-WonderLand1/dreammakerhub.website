import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { listFiles, readFile } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'zip';

    if (format === 'zip') {
      const filePaths = await listFiles(projectId, userId);
      const zip = new JSZip();

      for (const filePath of filePaths) {
        const content = await readFile(projectId, userId, filePath);
        if (content !== null) {
          zip.file(filePath, content);
        }
      }

      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="project-${projectId}.zip"`,
        },
      });
    }

    return NextResponse.json(
      { ok: false, message: 'Invalid format. Use ?format=zip' },
      { status: 400 }
    );
  } catch (err: any) {
    logger.error('Export error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Export failed' },
      { status: 500 }
    );
  }
}
