import { LLMClient, type LLMConfig, type LLMMessage } from './llm-client'
import { NPCMemory } from './memory'

export interface BrainConfig {
  llm: LLMConfig
  personality: string
  systemPrompt: string
  knowledgeBase: string[]
  memorySize: number
  interactionRadius: number
}

export interface Thought {
  action: string
  dialogue: string | null
  emotion: string
  confidence: number
}

export class NPCBrain {
  private llm: LLMClient
  private memory: NPCMemory
  private config: BrainConfig
  private lastThought: Thought | null = null

  constructor(config: BrainConfig) {
    this.config = config
    this.llm = new LLMClient(config.llm)
    this.memory = new NPCMemory(config.memorySize)
  }

  async think(
    perception: string,
    nearbyPlayers: string[],
    currentState: string
  ): Promise<Thought> {
    const memories = this.memory.recall(perception, 5)
    const recentMemories = this.memory.recent(3)

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(perception, nearbyPlayers, currentState, memories, recentMemories),
      },
      {
        role: 'user',
        content: `Current situation: ${perception}\nNearby: ${nearbyPlayers.join(', ') || 'none'}\nState: ${currentState}\n\nWhat do you do and say? Respond as a JSON object with fields: action (string), dialogue (string or null), emotion (string), confidence (number 0-1).`,
      },
    ]

    const response = await this.llm.chat(messages, 256)

    try {
      const parsed = JSON.parse(response.content)
      const thought: Thought = {
        action: parsed.action ?? 'idle',
        dialogue: parsed.dialogue ?? null,
        emotion: parsed.emotion ?? 'neutral',
        confidence: parsed.confidence ?? 0.5,
      }

      this.memory.add({
        type: 'observation',
        content: `Perceived: ${perception}. Acted: ${thought.action}${thought.dialogue ? `, said: "${thought.dialogue}"` : ''}`,
        importance: 0.5,
        decayFactor: 1.0,
      })

      this.lastThought = thought
      return thought
    } catch {
      const fallback: Thought = {
        action: 'idle',
        dialogue: null,
        emotion: 'neutral',
        confidence: 0.3,
      }
      this.lastThought = fallback
      return fallback
    }
  }

  async chat(playerMessage: string, playerName: string): Promise<string> {
    const memories = this.memory.recall(playerMessage, 3)

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(
          `Talking with ${playerName}`,
          [playerName],
          'conversation',
          memories,
          this.memory.recent(3)
        ),
      },
      {
        role: 'user',
        content: playerMessage,
      },
    ]

    const response = await this.llm.chat(messages, 256)

    this.memory.add({
      type: 'conversation',
      content: `${playerName} said: "${playerMessage}". I replied: "${response.content}"`,
      importance: 0.7,
      decayFactor: 1.0,
    })

    return response.content
  }

  private buildSystemPrompt(
    perception: string,
    nearbyPlayers: string[],
    currentState: string,
    memories: import('./memory').MemoryEntry[],
    recentMemories: import('./memory').MemoryEntry[]
  ): string {
    const parts = [
      this.config.systemPrompt,
      `Your personality: ${this.config.personality}`,
    ]

    if (this.config.knowledgeBase.length > 0) {
      parts.push('Knowledge base:')
      parts.push(this.config.knowledgeBase.join('\n'))
    }

    if (memories.length > 0) {
      parts.push('Relevant memories:')
      parts.push(memories.map(m => m.content).join('\n'))
    }

    if (recentMemories.length > 0) {
      parts.push('Recent events:')
      parts.push(recentMemories.map(m => m.content).join('\n'))
    }

    parts.push('You are a 3D world NPC. Respond concisely and in-character.')
    parts.push('Return JSON with: action, dialogue (or null), emotion, confidence')

    return parts.join('\n\n')
  }

  getMemorySummary(): string {
    return this.memory.summarize()
  }

  getLastThought(): Thought | null {
    return this.lastThought
  }

  get configData(): BrainConfig {
    return this.config
  }
}
