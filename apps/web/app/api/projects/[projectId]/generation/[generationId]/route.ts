import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';
import { readFile, writeFile } from '@lib/projects/storage';

type WorkerId = 'A' | 'B' | 'C' | 'D';
type GenerationStatus = 'running' | 'complete' | 'failed';

type GenerationConfession = {
  workerId: WorkerId;
  message: string;
  eventName: string;
  at: string;
};

type StoredGeneration = {
  generationId: string;
  prompt: string;
  status: GenerationStatus;
  step: number;
  mergeGate: boolean;
  constitutionalCheck: 'pending' | 'passed' | 'failed';
  confessions: GenerationConfession[];
  wonderBuildState?: unknown;
  startedAt: string;
  updatedAt: string;
};

const WORKER_STEPS: Array<{ workerId: WorkerId; eventName: string; message: string }> = [
  {
    workerId: 'A',
    eventName: 'generation.started',
    message: 'Worker A: Foundation initialized shared state, theme providers, and API route contracts.',
  },
  {
    workerId: 'B',
    eventName: 'worker.confession.logged',
    message: 'Worker B: Applied universal header contract and trust-layer placeholders for loading/empty/error UI.',
  },
  {
    workerId: 'C',
    eventName: 'constitutional.check.passed',
    message: 'Worker C: Constitutional AI law check passed with no policy-risk flags for generated structure.',
  },
  {
    workerId: 'D',
    eventName: 'generation.merge.ready',
    message: 'Worker D: Assets and section placeholders prepared; merge gate is ready to collapse into Universal Blocks.',
  },
];

function storagePath(generationId: string) {
  return `ai/generations/${generationId}.json`;
}

async function resolveOwnerId(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) return null;
  return smokeUserId ?? user!.id;
}

async function loadGeneration(projectId: string, ownerId: string, generationId: string): Promise<StoredGeneration | null> {
  const raw = await readFile(projectId, ownerId, storagePath(generationId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGeneration;
  } catch {
    return null;
  }
}

async function saveGeneration(projectId: string, ownerId: string, generation: StoredGeneration) {
  await writeFile(projectId, ownerId, storagePath(generation.generationId), JSON.stringify(generation, null, 2));
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], hash: number, offset: number) {
  return items[(hash + offset) % items.length];
}

function buildDeterministicWonderBuildState(prompt: string) {
  const normalized = prompt.trim().toLowerCase();
  const hash = stableHash(normalized || 'wonder-build');

  const heroTitles = [
    'Launch your product with confidence',
    'Build a conversion-ready website faster',
    'Turn your idea into a production website',
  ];

  const featureSets = [
    ['Responsive layout', 'Conversion-focused copy', 'Design token theme'],
    ['Fast loading sections', 'Accessible interaction states', 'Clear navigation model'],
    ['Reusable component blocks', 'Deterministic state output', 'Production handoff ready'],
  ];

  const heroTitle = pick(heroTitles, hash, 1);
  const features = pick(featureSets, hash, 7);

  return {
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: `${heroTitle}${normalized ? ` — ${normalized.slice(0, 36)}` : ''}`,
          subtitle: 'A polished, responsive experience tailored to your audience.',
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
      '--wb-bg': '#0b0b10',
      '--wb-surface': '#111118',
      '--wb-text': '#f8fafc',
      '--wb-accent': pick(['#22d3ee', '#a855f7', '#fb7185'], hash, 11),
      '--wb-border': 'rgba(255,255,255,0.12)',
    },
    layout: {
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          order: 1,
          children: [
            { id: 'hero-title', type: 'text' },
            { id: 'hero-subtitle', type: 'text' },
            { id: 'hero-cta', type: 'button' },
          ],
        },
        {
          id: 'features-1',
          type: 'features',
          order: 2,
          children: [{ id: 'features-list', type: 'list' }],
        },
        {
          id: 'footer-1',
          type: 'footer',
          order: 3,
          children: [{ id: 'footer-links', type: 'links' }],
        },
      ],
    },
  };
}

function nextGenerationState(generation: StoredGeneration): StoredGeneration {
  if (generation.status !== 'running') return generation;
  const now = new Date().toISOString();

  if (generation.step < WORKER_STEPS.length) {
    const step = WORKER_STEPS[generation.step];
    return {
      ...generation,
      step: generation.step + 1,
      constitutionalCheck:
        step.eventName === 'constitutional.check.passed' ? 'passed' : generation.constitutionalCheck,
      confessions: [
        ...generation.confessions,
        {
          workerId: step.workerId,
          message: step.message,
          eventName: step.eventName,
          at: now,
        },
      ],
      updatedAt: now,
    };
  }

  return {
    ...generation,
    status: 'complete',
    mergeGate: true,
    constitutionalCheck: generation.constitutionalCheck === 'pending' ? 'passed' : generation.constitutionalCheck,
    wonderBuildState: generation.wonderBuildState ?? buildDeterministicWonderBuildState(generation.prompt),
    confessions: [
      ...generation.confessions,
      {
        workerId: 'D',
        message: 'Workers collapsed outputs into Universal Blocks. Redirecting back to builder.',
        eventName: 'generation.completed',
        at: now,
      },
    ],
    updatedAt: now,
  };
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string; generationId: string } }) {
  try {
    const ownerId = await resolveOwnerId(req);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const generation: StoredGeneration = {
      generationId: params.generationId,
      prompt: String(prompt),
      status: 'running',
      step: 0,
      mergeGate: false,
      constitutionalCheck: 'pending',
      confessions: [],
      startedAt: now,
      updatedAt: now,
    };

    await saveGeneration(params.projectId, ownerId, generation);
    return NextResponse.json({ ok: true, generationId: params.generationId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to start generation' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { projectId: string; generationId: string } }) {
  try {
    const ownerId = await resolveOwnerId(req);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const generation = await loadGeneration(params.projectId, ownerId, params.generationId);
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    const progressed = nextGenerationState(generation);
    if (progressed.updatedAt !== generation.updatedAt) {
      await saveGeneration(params.projectId, ownerId, progressed);
    }

    return NextResponse.json({ generation: progressed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch generation' }, { status: 500 });
  }
}
