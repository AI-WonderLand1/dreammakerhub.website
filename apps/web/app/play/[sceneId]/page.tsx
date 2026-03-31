"use client"

import { useEffect } from "react"
import * as pc from "playcanvas"
import { loadScene } from "@/lib/scene/loader"

export default function PlayPage({ params }) {
  useEffect(() => {
    async function run() {
      const canvas = document.getElementById("pc") as HTMLCanvasElement

      const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas)
      })

      app.start()

      const res = await fetch(`/api/scenes/${params.sceneId}`)
      const scene = await res.json()

      await loadScene(app, scene)
    }

    run()
  }, [])

  return <canvas id="pc" style={{ width: "100%", height: "100vh" }} />
}
