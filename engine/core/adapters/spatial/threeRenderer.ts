import * as THREE from 'three'
import type { AssetManager } from './assetManager'
import type { SpatialWorld, WorldNode } from './worldLoader'

/**
 * Standard Three.js renderer for the Spatial Engine.
 *
 * Used as a fallback when a world has no splat assets, or when the Gaussian
 * Splatting runtime is unavailable. Mirrors the existing ThreeJSAdapter but
 * is driven by a SpatialWorld so the two renderers share one scene graph.
 */
export class ThreeRenderer {
  public readonly name = 'three'
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private canvas: HTMLCanvasElement
  private assets: AssetManager
  private world: SpatialWorld
  private onFrame?: (time: number) => void
  private animationId = 0
  private clock = new THREE.Clock()
  private resizeHandler?: () => void

  constructor(opts: {
    canvas: HTMLCanvasElement
    assets: AssetManager
    world: SpatialWorld
    onFrame?: (time: number) => void
  }) {
    this.canvas = opts.canvas
    this.assets = opts.assets
    this.world = opts.world
    this.onFrame = opts.onFrame
  }

  async init(): Promise<{ context: WebGLRenderingContext | WebGL2RenderingContext }> {
    const width = this.canvas.clientWidth || 800
    const height = this.canvas.clientHeight || 600

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    this.scene = new THREE.Scene()
    if (this.world.environment?.background) {
      this.scene.background = new THREE.Color(this.world.environment.background)
    } else {
      this.scene.background = new THREE.Color(0x1a1a2e)
    }

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
    this.camera.position.set(0, 2, 6)
    this.camera.lookAt(0, 0, 0)

    this.scene.add(new THREE.AmbientLight(0x404040, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 1.0)
    dir.position.set(5, 10, 7)
    this.scene.add(dir)

    if (this.world.environment?.ground !== false) {
      this.scene.add(new THREE.GridHelper(40, 40, 0x444444, 0x222222))
    }

    this.buildNodes(this.world.nodes ?? [], this.scene)

    const resize = () => {
      const rect = this.canvas.getBoundingClientRect()
      const w = rect.width || width
      const h = rect.height || height
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }
    this.resizeHandler = resize
    window.addEventListener('resize', resize)
    resize()

    const loop = () => {
      this.renderer.render(this.scene, this.camera)
      this.onFrame?.(this.clock.getElapsedTime() * 1000)
      this.animationId = requestAnimationFrame(loop)
    }
    this.animationId = requestAnimationFrame(loop)

    return { context: this.renderer.getContext() }
  }

  private buildNodes(nodes: WorldNode[], parent: THREE.Object3D): void {
    for (const node of nodes) {
      if (node.visible === false) continue
      const obj = this.nodeToObject(node)
      if (obj) {
        parent.add(obj)
        if (node.children) this.buildNodes(node.children, obj)
      }
    }
  }

  private nodeToObject(node: WorldNode): THREE.Object3D | null {
    const pos = node.position
    const rot = node.rotation
    const scl = node.scale

    if (node.type === 'light') {
      const light = new THREE.PointLight(0xffffff, 1, 100)
      if (pos) light.position.set(...pos)
      return light
    }

    if (node.assetRef) {
      const url = this.assets.resolveUrl(node.assetRef)
      // Splats are rendered by SplatRenderer; here we only represent meshes.
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x88aaff })
      )
      if (pos) mesh.position.set(...pos)
      if (rot) mesh.rotation.set(...rot)
      if (scl) mesh.scale.set(...scl)
      return mesh
    }

    const group = new THREE.Group()
    if (pos) group.position.set(...pos)
    if (rot) group.rotation.set(...rot)
    if (scl) group.scale.set(...scl)
    return group
  }

  async destroy(): Promise<void> {
    cancelAnimationFrame(this.animationId)
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler)
    this.renderer?.dispose()
    this.scene?.clear()
  }
}
