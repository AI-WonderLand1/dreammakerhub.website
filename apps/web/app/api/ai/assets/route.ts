import { NextRequest, NextResponse } from 'next/server'
import { requirePaidAIUser } from '@/app/api/ai/auth'
import { uploadAiAssetEntry } from '@/lib/ai/assetStore'
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

const ALLOWED = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'model/gltf+json',
  'model/gltf-binary',
  'application/json',
  'application/octet-stream',
])

const MAX_SIZE = 25 * 1024 * 1024

export async function POST(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req)
  if (paidUser instanceof NextResponse) return paidUser

  const form = await req.formData()
  const file = form.get('file')
  const workspaceId = String(form.get('workspaceId') || '').trim()
  const kindRaw = String(form.get('kind') || 'misc').trim().toLowerCase()
  const kind = (['image', 'video', 'model', 'scene', 'misc'].includes(kindRaw) ? kindRaw : 'misc') as
    | 'image'
    | 'video'
    | 'model'
    | 'scene'
    | 'misc'

  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: { code: 'WORKSPACE_REQUIRED', message: 'workspaceId is required' } }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: { code: 'FILE_REQUIRED', message: 'file is required' } }, { status: 400 })
  }

  if (!ALLOWED.has(file.type || 'application/octet-stream')) {
    return NextResponse.json({ ok: false, error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported file type: ${file.type}` } }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: { code: 'FILE_TOO_LARGE', message: `File exceeds ${MAX_SIZE} bytes` } }, { status: 400 })
  }

  try {
    const body = Buffer.from(await file.arrayBuffer())
    const stored = await uploadAiAssetEntry({
      userId: paidUser.userId,
      workspaceId,
      kind,
      filename: file.name || 'asset.bin',
      contentType: file.type || 'application/octet-stream',
      body,
    })

    return NextResponse.json({
      ok: true,
      asset: {
        filename: file.name,
        mime: file.type,
        size: file.size,
        ...stored,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { code: 'ASSET_UPLOAD_FAILED', message: error?.message || 'Upload failed' } },
      { status: 500 },
    )
  }
}
