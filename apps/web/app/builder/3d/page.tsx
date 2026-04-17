"use client"

import dynamic from "next/dynamic"

const WebGLStudioHost = dynamic(() => import("@/components/WebGLStudioHost"), { ssr: false })

export default function EditorPage() {
  return (
    <div className="w-full h-screen">
      <WebGLStudioHost />
    </div>
  )
}
