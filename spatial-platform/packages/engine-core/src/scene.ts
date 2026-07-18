import { Scene } from '@babylonjs/core/scene'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Engine } from '@babylonjs/core/Engines/engine'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { SpotLight } from '@babylonjs/core/Lights/spotLight'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Light } from '@babylonjs/core/Lights/light'
import type { SceneObject, SceneLight, SceneCamera, SceneSky, MaterialProps } from '@spatial/core'

export class SceneManager {
  readonly scene: Scene
  private meshes: Map<string, Mesh> = new Map()
  private lights: Map<string, Light> = new Map()

  constructor(engine: Engine) {
    this.scene = new Scene(engine)
    this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1)
  }

  addGround(width = 50, height = 50): void {
    const ground = MeshBuilder.CreateGround('ground', { width, height }, this.scene)
    const mat = new StandardMaterial('groundMat', this.scene)
    mat.diffuseColor = new Color3(0.2, 0.2, 0.25)
    mat.backFaceCulling = false
    ground.material = mat
    ground.receiveShadows = true
    this.meshes.set('ground', ground)
  }

  addSkybox(sky?: SceneSky): void {
    const size = 1000
    const box = MeshBuilder.CreateBox('skybox', { size }, this.scene)
    const mat = new StandardMaterial('skyMat', this.scene)
    mat.backFaceCulling = false
    if (sky?.cubemapUrl) {
      mat.reflectionTexture = new Texture(sky.cubemapUrl, this.scene)
      mat.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
      mat.diffuseColor = new Color3(0, 0, 0)
      mat.specularColor = new Color3(0, 0, 0)
    } else {
      const c = sky?.color ?? [0.4, 0.6, 0.9]
      mat.diffuseColor = new Color3(c[0], c[1], c[2])
    }
    box.infiniteDistance = true
    this.meshes.set('skybox', box)
  }

  loadObjects(objects: SceneObject[]): void {
    for (const obj of objects) {
      this.createObject(obj)
    }
  }

  private createObject(obj: SceneObject, parent?: Mesh): void {
    const mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, this.scene)
    mesh.position = new Vector3(obj.position[0], obj.position[1], obj.position[2])
    mesh.rotation = new Vector3(obj.rotation[0], obj.rotation[1], obj.rotation[2])
    mesh.scaling = new Vector3(obj.scale[0], obj.scale[1], obj.scale[2])
    mesh.id = obj.id

    if (obj.material) {
      this.applyMaterial(mesh, obj.material)
    }

    if (parent) {
      mesh.parent = parent
    }

    this.meshes.set(obj.id, mesh)

    for (const child of obj.children) {
      this.createObject(child, mesh)
    }
  }

  private applyMaterial(mesh: Mesh, props: MaterialProps): void {
    const mat = new StandardMaterial(`mat_${mesh.id}`, this.scene)
    mat.diffuseColor = new Color3(props.color[0], props.color[1], props.color[2])
    mat.metallic = props.metallic
    mat.roughness = props.roughness
    if (props.emissive) {
      mat.emissiveColor = new Color3(props.emissive[0], props.emissive[1], props.emissive[2])
    }
    mat.alpha = props.opacity
    mesh.material = mat
  }

  loadLights(lights: SceneLight[]): void {
    for (const light of lights) {
      this.createLight(light)
    }

    if (lights.length === 0) {
      const defaultLight = new HemisphericLight('defaultLight', new Vector3(0, 1, 0), this.scene)
      defaultLight.intensity = 0.7
      this.lights.set('defaultLight', defaultLight)
    }
  }

  private createLight(light: SceneLight): void {
    switch (light.type) {
      case 'ambient': {
        const ambient = new HemisphericLight(light.id, new Vector3(0, 1, 0), this.scene)
        ambient.intensity = light.intensity
        ambient.diffuse.set(light.color[0], light.color[1], light.color[2])
        this.lights.set(light.id, ambient)
        break
      }
      case 'directional': {
        const directional = new DirectionalLight(
          light.id,
          new Vector3(0, -1, 0),
          this.scene
        )
        directional.position = new Vector3(
          light.position[0], light.position[1], light.position[2]
        )
        directional.intensity = light.intensity
        directional.diffuse.set(light.color[0], light.color[1], light.color[2])
        this.lights.set(light.id, directional)
        break
      }
      case 'point': {
        const point = new PointLight(
          light.id,
          new Vector3(light.position[0], light.position[1], light.position[2]),
          this.scene
        )
        point.intensity = light.intensity
        point.diffuse.set(light.color[0], light.color[1], light.color[2])
        point.range = light.range
        this.lights.set(light.id, point)
        break
      }
      case 'spot': {
        const target = light.target ?? [0, 0, 0]
        const spot = new SpotLight(
          light.id,
          new Vector3(light.position[0], light.position[1], light.position[2]),
          new Vector3(target[0], target[1], target[2]),
          Math.PI / 4,
          2,
          this.scene
        )
        spot.intensity = light.intensity
        spot.diffuse.set(light.color[0], light.color[1], light.color[2])
        spot.range = light.range
        this.lights.set(light.id, spot)
        break
      }
    }
  }

  setupCamera(cameraData: SceneCamera): ArcRotateCamera {
    const target = new Vector3(
      cameraData.target[0],
      cameraData.target[1],
      cameraData.target[2]
    )
    const pos = new Vector3(
      cameraData.position[0],
      cameraData.position[1],
      cameraData.position[2]
    )
    const dist = Vector3.Distance(pos, target)
    const alpha = Math.atan2(pos.x - target.x, pos.z - target.z)
    const beta = Math.acos((pos.y - target.y) / dist)

    const camera = new ArcRotateCamera('mainCamera', alpha, beta, dist, target, this.scene)
    camera.fov = cameraData.fov * (Math.PI / 180)
    camera.minZ = cameraData.near
    camera.maxZ = cameraData.far
    camera.attachControl(true)
    return camera
  }

  getMesh(id: string): Mesh | undefined {
    return this.meshes.get(id)
  }

  removeMesh(id: string): void {
    const mesh = this.meshes.get(id)
    if (mesh) {
      mesh.dispose()
      this.meshes.delete(id)
    }
  }

  clear(): void {
    for (const mesh of this.meshes.values()) {
      mesh.dispose()
    }
    this.meshes.clear()
    for (const light of this.lights.values()) {
      light.dispose()
    }
    this.lights.clear()
  }

  dispose(): void {
    this.clear()
    this.scene.dispose()
  }
}
