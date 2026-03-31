import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { SceneFile } from "./schema"

export async function exportSceneToGLB(scene: SceneFile) {
  const threeScene = new THREE.Scene()

  for (const obj of scene.objects) {
    const glb = await loadGLB(obj.meshUrl)
    const mesh = glb.scene

    mesh.position.fromArray(obj.position)
    mesh.rotation.fromArray(obj.rotation)
    mesh.scale.fromArray(obj.scale)

    threeScene.add(mesh)
  }

  const exporter = new GLTFExporter()
  const glb = await exporter.parseAsync(threeScene, { binary: true })

  return glb
}

async function loadGLB(url: string) {
  const loader = new (require("three/examples/jsm/loaders/GLTFLoader").GLTFLoader)()
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}
