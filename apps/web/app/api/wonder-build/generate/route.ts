import { NextRequest, NextResponse } from 'next/server'
import { createRootNode, createNode } from '@builder/builder/engine/LayoutTree'
import { createSupabaseServerClient } from '@/app/utils/supabase/server'
import { getSmokeUserIdFromRequest } from '@/lib/smokeAuth'
import type { WonderBuildStatePayload } from '@/lib/wonder-build/masterSchemaContract'

const DEFAULT_THEME: Record<string, string> = {
  '--wb-bg': '#0b0b10',
  '--wb-surface': '#111118',
  '--wb-text': '#f8fafc',
  '--wb-accent': '#22d3ee',
  '--wb-border': 'rgba(255,255,255,0.12)',
}

type WonderBuildBlockType = 'hero' | 'features' | 'footer'

function stableHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function pick<T>(items: T[], hash: number, offset: number) {
  return items[(hash + offset) % items.length]
}

function buildDeterministicWonderBuildState(prompt: string): WonderBuildStatePayload {
  const normalized = prompt.trim().toLowerCase()
  const hash = stableHash(normalized || 'wonder-build')

  const heroTitle = pick(
    [
      'Launch your product with confidence',
      'Build a conversion-ready website faster',
      'Turn your idea into a production website',
    ],
    hash,
    1,
  )

  const heroSubhead = pick(
    [
      'A polished, responsive experience tailored to your audience.',
      'Structured sections, strong typography, and clear calls to action.',
      'Deterministic AI-generated layouts with reliable visual hierarchy.',
    ],
    hash,
    3,
  )

  const features = pick(
    [
      ['Responsive layout', 'Conversion-focused copy', 'Design token theme'],
      ['Fast loading sections', 'Accessible interaction states', 'Clear navigation model'],
      ['Reusable component blocks', 'Deterministic state output', 'Production handoff ready'],
    ],
    hash,
    7,
  )

  return {
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: `${heroTitle}${normalized ? ` — ${normalized.slice(0, 36)}` : ''}`,
          subtitle: heroSubhead,
          primaryCta: 'Get Started',
          secondaryCta: 'Book Demo',
        },
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          heading: 'Core capabilities',
          items: features,
        },
      },
      {
        id: 'footer-1',
        type: 'footer',
        content: {
          text: '© Wonder Build. All rights reserved.',
          links: ['Privacy', 'Terms', 'Contact'],
        },
      },
    ],
    theme: {
      ...DEFAULT_THEME,
      '--wb-accent': pick(['#22d3ee', '#a855f7', '#fb7185'], hash, 11),
    },
    layout: {
      sections: [
        {
          id: 'hero-1',
          type: 'hero' as WonderBuildBlockType,
          order: 1,
          children: [
            { id: 'hero-title', type: 'text' },
            { id: 'hero-subtitle', type: 'text' },
            { id: 'hero-cta', type: 'button' },
          ],
        },
        {
          id: 'features-1',
          type: 'features' as WonderBuildBlockType,
          order: 2,
          children: [{ id: 'features-list', type: 'list' }],
        },
        {
          id: 'footer-1',
          type: 'footer' as WonderBuildBlockType,
          order: 3,
          children: [{ id: 'footer-links', type: 'links' }],
        },
      ],
    },
  }
}

async function requireUser(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const smokeUserId = getSmokeUserIdFromRequest(req)

  if (!user && !smokeUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ownerId = smokeUserId ?? user!.id
  const isPaid = Boolean(user?.app_metadata?.plan === 'pro' || smokeUserId)
  if (process.env.WONDER_BUILD_REQUIRE_PAID === 'true' && !isPaid) {
    return NextResponse.json({ error: 'PAYWALL' }, { status: 402 })
  }

  return ownerId
}

export async function POST(request: NextRequest) {
  const ownerId = await requireUser(request)
  if (ownerId instanceof NextResponse) return ownerId

  try {
    const { prompt } = await request.json()
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'No prompt provided' }, { status: 400 })
    }

    const wonderBuildState = buildDeterministicWonderBuildState(String(prompt))

    const root = createRootNode()
    const heroNode = createNode('universal', {
      text: wonderBuildState.blocks[0].content.title,
      variant: 'box',
      x: 80,
      y: 80,
      w: 900,
      h: 180,
    })

    const featuresNode = createNode('universal', {
      text: `Features: ${(wonderBuildState.blocks[1].content.items as string[]).join(' • ')}`,
      variant: 'box',
      x: 80,
      y: 290,
      w: 900,
      h: 200,
    })

    const footerNode = createNode('universal', {
      text: String(wonderBuildState.blocks[2].content.text),
      variant: 'box',
      x: 80,
      y: 520,
      w: 900,
      h: 100,
    })

    root.children.push(heroNode, featuresNode, footerNode)
    return NextResponse.json({ success: true, root, wonderBuildState })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
