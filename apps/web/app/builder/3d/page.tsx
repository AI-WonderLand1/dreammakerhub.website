<<<<<<< HEAD
"use client"

import dynamic from "next/dynamic"

const WebGLStudioHost = dynamic(() => import("@/components/WebGLStudioHost"), { ssr: false })

export default function EditorPage() {
  return (
    <div className="w-full h-screen">
      <WebGLStudioHost />
    </div>
  )
=======
import WebGLStudioHost from "../../../components/WebGLStudioHost";

export default function Builder3DPage() {
  return (
    <div className="h-screen w-full">
      <WebGLStudioHost />
    </div>
  );
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}
