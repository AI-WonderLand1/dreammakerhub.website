// engine/core/ai/orchestrator.ts

type ParsedAiPayload = {
  isVisualBlock?: boolean
  glimpse?: unknown
  confession?: unknown
  trustScore?: number
  files?: Record<string, string>
}

export type OrchestratorEvent =
  | { type: 'thought'; data: string }
  | { type: 'glimpse'; data: unknown }
  | { type: 'confession'; data: unknown; meta?: { trustScore?: number } }

export type OrchestratedOutput = {
  events: OrchestratorEvent[]
  files: Array<{ path: string; content: string }>
}

type GenerateAndSaveProjectInput = {
  prompt: string
  model?: string
  userId?: string
}

type GenerateAndSaveProjectResult = {
  projectId: string
  events: OrchestratorEvent[]
  files: Array<{ path: string; content: string }>
}

function safeJsonParse(rawText: string): ParsedAiPayload {
  try {
    return JSON.parse(rawText) as ParsedAiPayload
  } catch {
    return { files: {} }
  }
}

export function orchestrateAiPayload(rawText: string): OrchestratedOutput {
  const parsed = safeJsonParse(rawText)
  const events: OrchestratorEvent[] = []

  if (parsed.isVisualBlock) {
    events.push({ type: 'thought', data: 'Applying Wonderland Theme Primitives...' })
    events.push({ type: 'glimpse', data: parsed.glimpse })
    events.push({
      type: 'confession',
      data: parsed.confession,
      meta: { trustScore: parsed.trustScore },
    })
  }

  const files = Object.entries(parsed.files || {}).map(([path, content]) => ({
    path,
    content: String(content),
  }))

  return { events, files }
}

export async function generateAndSaveProject(input: GenerateAndSaveProjectInput): Promise<GenerateAndSaveProjectResult> {
  const timestamp = Date.now().toString(36)
  const projectId = `proj-${timestamp}`

  const output = orchestrateAiPayload(JSON.stringify({
    isVisualBlock: true,
    glimpse: { prompt: input.prompt, model: input.model ?? 'default' },
    confession: { note: 'Generated via local orchestrator fallback.' },
    trustScore: 0.72,
    files: {
      'README.md': `# Generated Project\n\nPrompt: ${input.prompt}`,
    },
  }))

  return {
    projectId,
    events: output.events,
    files: output.files,
  }
}
