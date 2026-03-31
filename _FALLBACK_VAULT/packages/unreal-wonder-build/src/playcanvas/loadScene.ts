declare namespace pc {
  type SceneLoadCallback = (err: unknown) => void

  interface Application {
    loadSceneHierarchy(sceneUrl: string, callback: SceneLoadCallback): void
  }
}

export async function loadScene(app: pc.Application, sceneUrl: string) {
  return new Promise<void>((resolve, reject) => {
    app.loadSceneHierarchy(sceneUrl, (err) => {
      if (err) {
        console.error('Failed to load scene:', err)
        reject(err)
        return
      }

      console.log('Scene loaded:', sceneUrl)
      resolve()
    })
  })
}
