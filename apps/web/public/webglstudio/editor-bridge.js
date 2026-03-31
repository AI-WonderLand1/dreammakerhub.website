window.WonderBridge = {
  loadScene(scene) {
    LS.GlobalScene.clear()

    scene.objects.forEach(obj => {
      const node = new LS.SceneNode()
      node.name = obj.name

      node.transform.position.set(obj.position)
      node.transform.rotation.set(obj.rotation)
      node.transform.scale.set(obj.scale)

      const comp = new LS.Components.MeshRenderer()
      comp.mesh = obj.meshUrl
      node.addComponent(comp)

      LS.GlobalScene.root.addChild(node)
    })
  },

  exportScene() {
    const objects = []

    LS.GlobalScene.root.children.forEach(node => {
      const comp = node.getComponent(LS.Components.MeshRenderer)
      if (!comp) return

      objects.push({
        id: node.uid,
        name: node.name,
        meshUrl: comp.mesh,
        position: [...node.transform.position],
        rotation: [...node.transform.rotation],
        scale: [...node.transform.scale]
      })
    })

    return { objects }
  }
}
