import { NextRequest, NextResponse } from 'next/server'
import { requirePaidAIUser } from '@/app/api/ai/auth'
import { listAiAssetEntries, uploadAiAssetEntry } from '@lib/ai/assetStore'
import { supabaseRouteClient } from '@lib/supabase/route'

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

export async function GET(req: NextRequest) {
  const paidUser = await requirePaidAIUser(req)
  if (paidUser instanceof NextResponse) return paidUser

  const workspaceId = String(req.nextUrl.searchParams.get('workspaceId') || '').trim()
  const kindRaw = String(req.nextUrl.searchParams.get('kind') || '').trim().toLowerCase()
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') || 20)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20

  if (!workspaceId) {
    return NextResponse.json(
      { ok: false, error: { code: 'WORKSPACE_REQUIRED', message: 'workspaceId is required' } },
      { status: 400 },
    )
  }

  const kind = (['image', 'video', 'model', 'scene', 'misc'].includes(kindRaw) ? kindRaw : undefined) as
    | 'image'
    | 'video'
    | 'model'
    | 'scene'
    | 'misc'
    | undefined

  try {
    const kinds: Array<'image' | 'video' | 'model' | 'scene' | 'misc'> = kind
      ? [kind]
      : ['image', 'video', 'model', 'scene', 'misc']

    const perKindLimit = Math.max(1, Math.floor(limit / kinds.length))
    const entries = await Promise.all(
      kinds.map((k) =>
        listAiAssetEntries({
          userId: paidUser.userId,
          workspaceId,
          kind: k,
          limit: perKindLimit,
        }),
      ),
    )
    const assets = entries
      .flat()
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, limit)

    const signedAssets = await Promise.all(
      assets.map(async (asset) => {
        const { data } = await supabaseRouteClient().storage.from(asset.bucket).createSignedUrl(asset.path, 60 * 10)
        return { ...asset, signedUrl: data?.signedUrl || null }
      }),
    )

    return NextResponse.json({ ok: true, assets: signedAssets })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { code: 'ASSET_LIST_FAILED', message: error?.message || 'List failed' } },
      { status: 500 },
    )
  }
}

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
