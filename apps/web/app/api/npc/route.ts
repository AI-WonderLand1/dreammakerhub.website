import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { 
  listNpcs, 
  createNpc, 
  getNpc, 
  updateNpc, 
  deleteNpc 
} from '@/lib/npc/storage';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const npcs = await listNpcs(userId);
    return NextResponse.json({ ok: true, npcs });
  } catch (err: any) {
    logger.error('List npcs error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to list NPCs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ ok: false, message: 'name is required' }, { status: 400 });
    }

    const npc = await createNpc(userId, {
      name: body.name.trim(),
      worldId: body.worldId ?? null,
      modelUrl: body.modelUrl ?? null,
      position: body.position ?? null,
      rotation: body.rotation ?? null,
      personality: body.personality ?? null,
      llmProvider: body.llmProvider ?? null,
      llmModel: body.llmModel ?? null,
      systemPrompt: body.systemPrompt ?? null,
      knowledgeBase: body.knowledgeBase ?? null,
      memorySize: body.memorySize ?? null,
      interactionRadius: body.interactionRadius ?? null,
      voiceEnabled: body.voiceEnabled ?? false,
    });

    return NextResponse.json({ ok: true, npc }, { status: 201 });
  } catch (err: any) {
    logger.error('Create npc error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to create NPC' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { searchParams } = new URL(req.url);
    const npcId = searchParams.get('id');
    
    if (!npcId) {
      return NextResponse.json({ ok: false, message: 'npcId is required' }, { status: 400 });
    }

    await deleteNpc(npcId, userId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Delete npc error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to delete NPC' },
      { status: 500 }
    );
  }
}

// For individual NPC operations (GET, PUT, DELETE specific NPC)
export async function PUT(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { searchParams } = new URL(req.url);
    const npcId = searchParams.get('id');
    
    if (!npcId) {
      return NextResponse.json({ ok: false, message: 'npcId is required' }, { status: 400 });
    }

    const body = await req.json();
    
    // Prevent updating protected fields
    const updates: Partial<Omit<any, "id" | "ownerId" | "createdAt" | "updatedAt">> = {};
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ ok: false, message: 'Invalid name' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    
    if (body.worldId !== undefined) updates.worldId = body.worldId;
    if (body.modelUrl !== undefined) updates.modelUrl = body.modelUrl;
    if (body.position !== undefined) updates.position = body.position;
    if (body.rotation !== undefined) updates.rotation = body.rotation;
    if (body.personality !== undefined) updates.personality = body.personality;
    if (body.llmProvider !== undefined) updates.llmProvider = body.llmProvider;
    if (body.llmModel !== undefined) updates.llmModel = body.llmModel;
    if (body.systemPrompt !== undefined) updates.systemPrompt = body.systemPrompt;
    if (body.knowledgeBase !== undefined) updates.knowledgeBase = body.knowledgeBase;
    if (body.memorySize !== undefined) updates.memorySize = body.memorySize;
    if (body.interactionRadius !== undefined) updates.interactionRadius = body.interactionRadius;
    if (body.voiceEnabled !== undefined) updates.voiceEnabled = body.voiceEnabled;

    // Check if any valid updates were provided
    const validKeys = Object.keys(updates) as Array<keyof typeof updates>;
    if (validKeys.length === 0) {
      return NextResponse.json({ ok: false, message: 'No valid fields to update' }, { status: 400 });
    }

    const npc = await updateNpc(npcId, userId, updates);
    return NextResponse.json({ ok: true, npc });
  } catch (err: any) {
    logger.error('Update npc error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to update NPC' },
      { status: 500 }
    );
  }
}