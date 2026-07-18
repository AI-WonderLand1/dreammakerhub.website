export class Renderer {
  engine: any = {}
  static async create(canvas: HTMLCanvasElement, _opts?: { antialias?: boolean; preferWebGPU?: boolean }) {
    return new Renderer()
  }
  runRenderLoop(cb: () => void) { cb() }
  stopRenderLoop() {}
  resize() {}
  dispose() {}
}

export class SceneManager {
  scene: any = { render() {}, activeCamera: {} }
  constructor(_engine: any) {}
  addGround(_w: number, _h: number) {}
  addSkybox(_cfg?: any) {}
  loadLights(_lights: any[]) {}
  setupCamera(_cfg: any) {}
  loadObjects(_objects: any[]) {}
  getMesh(_id: string) { return null }
  dispose() {}
}
