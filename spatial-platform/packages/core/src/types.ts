export interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  role: 'user' | 'admin' | 'moderator'
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  organizationId: string
  name: string
  memberIds: string[]
  createdAt: string
}

export interface World {
  id: string
  name: string
  description: string
  ownerId: string
  organizationId: string | null
  visibility: 'public' | 'private' | 'unlisted'
  thumbnailUrl: string | null
  sceneData: SceneData
  settings: WorldSettings
  createdAt: string
  updatedAt: string
}

export interface WorldSettings {
  maxPlayers: number
  allowScripts: boolean
  physicsEnabled: boolean
  voiceChat: boolean
  entryFee: number | null
  allowedPlugins: string[]
}

export interface SceneData {
  version: number
  objects: SceneObject[]
  lights: SceneLight[]
  camera: SceneCamera
  sky: SceneSky | null
  scripts: SceneScript[]
}

export interface SceneObject {
  id: string
  name: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  meshUrl: string | null
  material: MaterialProps | null
  physics: PhysicsProps | null
  scripts: string[]
  children: SceneObject[]
}

export interface MaterialProps {
  color: [number, number, number]
  metallic: number
  roughness: number
  emissive: [number, number, number] | null
  opacity: number
}

export interface PhysicsProps {
  type: 'static' | 'dynamic' | 'kinematic'
  mass: number
  friction: number
  restitution: number
}

export interface SceneLight {
  id: string
  type: 'ambient' | 'directional' | 'point' | 'spot'
  color: [number, number, number]
  intensity: number
  position: [number, number, number]
  target: [number, number, number] | null
  range: number
}

export interface SceneCamera {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  near: number
  far: number
}

export interface SceneSky {
  color: [number, number, number]
  type: 'solid' | 'gradient' | 'cubemap'
  cubemapUrl: string | null
}

export interface SceneScript {
  id: string
  name: string
  code: string
  enabled: boolean
  events: string[]
}

export interface Asset {
  id: string
  name: string
  description: string
  type: 'model' | 'texture' | 'script' | 'audio' | 'video' | 'plugin'
  url: string
  thumbnailUrl: string | null
  ownerId: string
  price: number | null
  tags: string[]
  downloadCount: number
  createdAt: string
}

export interface Listing {
  id: string
  assetId: string
  sellerId: string
  price: number
  currency: 'credits' | 'usd'
  status: 'active' | 'sold' | 'cancelled'
  createdAt: string
}

export interface Purchase {
  id: string
  listingId: string
  buyerId: string
  amount: number
  currency: 'credits' | 'usd'
  createdAt: string
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  engine: 'babylon' | 'three' | 'unity' | 'unreal' | 'godot' | 'blender' | 'playcanvas'
  hooks: string[]
  permissions: string[]
  entryPoint: string
  assetsUrl: string
}

export interface NPCConfig {
  id: string
  name: string
  worldId: string
  modelUrl: string
  position: [number, number, number]
  rotation: [number, number, number]
  personality: string
  llmProvider: 'openai' | 'anthropic' | 'mistral' | 'groq'
  llmModel: string
  systemPrompt: string
  knowledgeBase: string[]
  memorySize: number
  interactionRadius: number
  voiceEnabled: boolean
}

export interface MultiplayerRoom {
  id: string
  worldId: string
  participants: Participant[]
  state: RoomState
  createdAt: string
}

export interface Participant {
  userId: string
  username: string
  position: [number, number, number]
  rotation: [number, number, number]
  animation: string
  connectedAt: string
}

export interface RoomState {
  objects: SyncObject[]
  npcs: SyncNPC[]
  timestamp: number
}

export interface SyncObject {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface SyncNPC {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  currentAction: string
  dialogue: string | null
}

export interface VideoUpload {
  id: string
  userId: string
  title: string
  filename: string
  sizeBytes: number
  duration: number | null
  status: 'uploading' | 'processing' | 'ready' | 'failed'
  hlsUrl: string | null
  thumbnailUrl: string | null
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
