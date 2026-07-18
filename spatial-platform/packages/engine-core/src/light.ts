import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { SpotLight } from '@babylonjs/core/Lights/spotLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Light } from '@babylonjs/core/Lights/light'
import type { Scene } from '@babylonjs/core/scene'
import type { SceneLight } from '@spatial/core'

export function createLight(data: SceneLight, scene: Scene): Light {
  switch (data.type) {
    case 'ambient': {
      const light = new HemisphericLight(
        data.id,
        new Vector3(0, 1, 0),
        scene
      )
      light.intensity = data.intensity
      light.diffuse.set(data.color[0], data.color[1], data.color[2])
      return light
    }
    case 'directional': {
      const light = new DirectionalLight(
        data.id,
        new Vector3(0, -1, 0),
        scene
      )
      light.position = new Vector3(data.position[0], data.position[1], data.position[2])
      light.intensity = data.intensity
      light.diffuse.set(data.color[0], data.color[1], data.color[2])
      return light
    }
    case 'point': {
      const light = new PointLight(
        data.id,
        new Vector3(data.position[0], data.position[1], data.position[2]),
        scene
      )
      light.intensity = data.intensity
      light.diffuse.set(data.color[0], data.color[1], data.color[2])
      return light
    }
    case 'spot': {
      const target = data.target ?? [0, 0, 0]
      const light = new SpotLight(
        data.id,
        new Vector3(data.position[0], data.position[1], data.position[2]),
        new Vector3(target[0], target[1], target[2]),
        Math.PI / 4,
        2,
        scene
      )
      light.intensity = data.intensity
      light.diffuse.set(data.color[0], data.color[1], data.color[2])
      return light
    }
  }
}

export function setLightIntensity(light: Light, intensity: number): void {
  light.intensity = intensity
}

export function setLightColor(light: Light, r: number, g: number, b: number): void {
  light.diffuse.set(r, g, b)
}
