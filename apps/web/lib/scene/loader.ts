import * as pc from "playcanvas"
import { SceneFile } from "./schema"

export async function loadScene(app: pc.Application, scene: SceneFile) {
  const glbUrl = `/projects/${scene.workspaceId}/runtime/${scene.id}.glb`

  app.assets.loadFromUrl(glbUrl, "container", (err, asset) => {
    if (err) return console.error(err)
    const entity = asset.resource.instantiateRenderEntity()
    app.root.addChild(entity)
  })

  scene.lights.forEach(light => {
    const e = new pc.Entity()
    e.addComponent("light", {
      type: light.type,
      color: new pc.Color(...light.color),
      intensity: light.intensity
    })
    app.root.addChild(e)
  })

  const cam = new pc.Entity()
  cam.addComponent("camera", { fov: scene.camera.fov })
  cam.setPosition(...scene.camera.position)
  app.root.addChild(cam)

  if (scene.skybox) {
    app.setSkybox(scene.skybox.url)
  }
}
