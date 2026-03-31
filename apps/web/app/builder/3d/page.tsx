"use client"

import { useEffect, useState } from "react"

export default function EditorPage() {
  const [scene, setScene] = useState(null)

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/scenes/scene_123")
      const json = await res.json()
      setScene(json)

      if (window.WonderBridge) {
        window.WonderBridge.loadScene(json)
      }
    }
    load()
  }, [])

  return (
    <iframe
      src="/webglstudio/editor/index.html"
      style={{ width: "100%", height: "100vh", border: "none" }}
    />
  )
}
