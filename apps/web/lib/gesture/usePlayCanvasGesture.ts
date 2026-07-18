'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PlayCanvasGestureBridge } from '@dreammakerhub/gesture-engine/bridge/playcanvas'

export interface UsePlayCanvasGestureOptions {
  autoAttach?: boolean
  sensitivity?: number
  smoothing?: number
}

export function usePlayCanvasGesture(options?: UsePlayCanvasGestureOptions) {
  const bridgeRef = useRef<PlayCanvasGestureBridge | null>(null)
  const [connected, setConnected] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<any>(null)

  const attachToCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
  }, [])

  const attachToApp = useCallback((app: any) => {
    appRef.current = app
  }, [])

  useEffect(() => {
    if (!options?.autoAttach ?? true) return

    const timeout = setTimeout(() => {
      const core = (window as any).CORE
      const canvas = document.querySelector('canvas')
      if (core && canvas) {
        const bridge = new PlayCanvasGestureBridge(core, {
          enabled: true,
          sensitivity: options?.sensitivity ?? 1.0,
          smoothing: options?.smoothing ?? 0.85,
        })
        bridge.attach(canvas)
        bridgeRef.current = bridge
        setConnected(true)
      }
    }, 2000)

    // Also listen for the ready message from the bootstrap
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'ready') {
        clearTimeout(timeout)
        setTimeout(() => {
          const core = (window as any).CORE
          const canvas = document.querySelector('canvas')
          if (core && canvas) {
            const bridge = new PlayCanvasGestureBridge(core, {
              enabled: true,
              sensitivity: options?.sensitivity ?? 1.0,
              smoothing: options?.smoothing ?? 0.85,
            })
            bridge.attach(canvas)
            bridgeRef.current = bridge
            setConnected(true)
          }
        }, 500)
      }
    }

    window.addEventListener('message', handler)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('message', handler)
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [options?.autoAttach, options?.sensitivity, options?.smoothing])

  useEffect(() => {
    if (!appRef.current || !canvasRef.current) return
    if (bridgeRef.current) bridgeRef.current.destroy()

    const bridge = new PlayCanvasGestureBridge(appRef.current, {
      enabled: true,
      sensitivity: options?.sensitivity ?? 1.0,
      smoothing: options?.smoothing ?? 0.85,
    })
    bridge.attach(canvasRef.current)
    bridgeRef.current = bridge
    setConnected(true)

    return () => {
      bridge.destroy()
      bridgeRef.current = null
      setConnected(false)
    }
  }, [appRef.current, canvasRef.current, options?.sensitivity, options?.smoothing])

  const toggle = useCallback((enabled: boolean) => {
    if (enabled) {
      bridgeRef.current?.enable()
    } else {
      bridgeRef.current?.disable()
    }
  }, [])

  const getLastEvent = useCallback(() => {
    return bridgeRef.current?.lastKnownEvent ?? null
  }, [])

  return { connected, toggle, getLastEvent, attachToCanvas, attachToApp }
}