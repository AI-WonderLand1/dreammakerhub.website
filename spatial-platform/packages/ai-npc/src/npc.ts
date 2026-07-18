import { NPCBrain, type BrainConfig, type Thought } from './brain'
import { type LLMConfig, type LLMProvider } from './llm-client'

export interface NPCConfig {
  id: string
  name: string
  worldId: string
  modelUrl: string
  position: [number, number, number]
  rotation: [number, number, number]
  personality: string
  llmProvider: LLMProvider
  llmModel: string
  systemPrompt: string
  knowledgeBase: string[]
  memorySize: number
  interactionRadius: number
  voiceEnabled: boolean
}

export interface NPCState {
  position: [number, number, number]
  rotation: [number, number, number]
  currentAction: string
  currentDialogue: string | null
  currentEmotion: string
  lastUpdate: number
}

export class SpatialNPC {
  readonly id: string
  readonly name: string
  readonly worldId: string
  readonly modelUrl: string
  readonly interactionRadius: number
  readonly voiceEnabled: boolean

  private brain: NPCBrain
  private state: NPCState
  private thinkInterval: number
  private lastThinkTime = 0

  constructor(config: NPCConfig) {
    this.id = config.id
    this.name = config.name
    this.worldId = config.worldId
    this.modelUrl = config.modelUrl
    this.interactionRadius = config.interactionRadius
    this.voiceEnabled = config.voiceEnabled

    const llmConfig: LLMConfig = {
      provider: config.llmProvider,
      apiKey: '',
      model: config.llmModel,
    }

    const brainConfig: BrainConfig = {
      llm: llmConfig,
      personality: config.personality,
      systemPrompt: config.systemPrompt,
      knowledgeBase: config.knowledgeBase,
      memorySize: config.memorySize,
      interactionRadius: config.interactionRadius,
    }

    this.brain = new NPCBrain(brainConfig)
    this.thinkInterval = 3000 + Math.random() * 4000

    this.state = {
      position: [...config.position],
      rotation: [...config.rotation],
      currentAction: 'idle',
      currentDialogue: null,
      currentEmotion: 'neutral',
      lastUpdate: Date.now(),
    }
  }

  setApiKey(key: string): void {
    const cfg = this.brain.configData
    cfg.llm.apiKey = key
    this.brain = new NPCBrain(cfg)
  }

  async tick(
    perception: string,
    nearbyPlayers: string[],
    currentState: string
  ): Promise<Thought | null> {
    const now = Date.now()
    if (now - this.lastThinkTime < this.thinkInterval) return null
    this.lastThinkTime = now

    const thought = await this.brain.think(perception, nearbyPlayers, currentState)

    this.state.currentAction = thought.action
    this.state.currentDialogue = thought.dialogue
    this.state.currentEmotion = thought.emotion
    this.state.lastUpdate = now

    return thought
  }

  async chat(playerMessage: string, playerName: string): Promise<string> {
    return this.brain.chat(playerMessage, playerName)
  }

  getState(): NPCState {
    return { ...this.state }
  }

  getMemorySummary(): string {
    return this.brain.getMemorySummary()
  }

  updatePosition(position: [number, number, number]): void {
    this.state.position = position
  }

  updateRotation(rotation: [number, number, number]): void {
    this.state.rotation = rotation
  }

  setThinkInterval(ms: number): void {
    this.thinkInterval = ms
  }

  destroy(): void {
    // cleanup if needed
  }
}
