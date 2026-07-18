interface GestureSettings {
  enabled: boolean
  sensitivity: number
  smoothing: number
}

export class BabylonGestureBridge {
  lastKnownEvent: { gesture: string; confidence: number } | null = null

  constructor(_settings: GestureSettings) {}
  attach(_canvas: HTMLCanvasElement) {}
  destroy() {}
  updateConfig(_settings: GestureSettings) {}
  setTargetCamera(_cam: any) {}
  setTargetMesh(_mesh: any) {}
}
