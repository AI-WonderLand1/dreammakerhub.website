'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { BabylonGestureBridge } from '@dreammakerhub/gesture-engine'
import type { SceneManager } from '@spatial/engine-core'

const STORAGE_KEY = 'spatial_gesture_settings'

export interface GestureSettings {
  enabled: boolean
  sensitivity: number
  smoothing: number
}

export interface GestureState {
  connected: boolean
  active: boolean
  gesture: string | null
  confidence: number
}

export interface UseBabylonGestureOptions {
  autoAttach?: boolean
  targetType?: 'mesh' | 'camera'
}

function loadSettings(): GestureSettings {
  if (typeof window === 'undefined') {
    return { enabled: true, sensitivity: 1.0, smoothing: 0.85 }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { enabled: true, sensitivity: 1.0, smoothing: 0.85 }
}

function saveSettings(settings: GestureSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function useBabylonGesture(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  sceneManager: SceneManager | null,
  selectedMeshId?: string | null,
  options: UseBabylonGestureOptions = {}
) {
  const { autoAttach = true, targetType = 'camera' } = options

  const [settings, setSettings] = useState<GestureSettings>(loadSettings)
  const bridgeRef = useRef<BabylonGestureBridge | null>(null)
  const [gestureState, setGestureState] = useState<GestureState>({
    connected: false,
    active: false,
    gesture: null,
    confidence: 0,
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let destroyed = false

    const init = () => {
      const bridge = new BabylonGestureBridge(settings)

      if (canvasRef.current) {
        bridge.attach(canvasRef.current)
        setGestureState(prev => ({ ...prev, connected: true }))
      }

      bridgeRef.current = bridge

      pollRef.current = setInterval(() => {
        if (!bridge || destroyed) return
        const ev = bridge.lastKnownEvent
        setGestureState({
          connected: true,
          active: !!ev && ev.confidence > 0.3,
          gesture: ev?.gesture ?? null,
          confidence: ev?.confidence ?? 0,
        })
      }, 100)
    }

    if (autoAttach && canvasRef.current) {
      init()
    }

    return () => {
      destroyed = true
      if (pollRef.current) clearInterval(pollRef.current)
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [autoAttach, canvasRef])

  // Forward settings to the bridge when they change after init
  useEffect(() => {
    bridgeRef.current?.updateConfig(settings)
  }, [settings])

  useEffect(() => {
    const bridge = bridgeRef.current
    if (!bridge) return

    if (targetType === 'camera') {
      const scene = sceneManager?.scene
      const cam = scene?.activeCamera as any
      if (cam?.alpha !== undefined) {
        bridge.setTargetCamera(cam)
      }
    } else if (selectedMeshId && sceneManager) {
      const mesh = sceneManager.getMesh(selectedMeshId)
      if (mesh) {
        bridge.setTargetMesh(mesh)
      }
    }
  }, [selectedMeshId, sceneManager, targetType])

  const updateSettings = useCallback((partial: Partial<GestureSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  const setTargetMesh = useCallback((mesh: any) => {
    bridgeRef.current?.setTargetMesh(mesh)
  }, [])

  const setTargetCamera = useCallback((camera: any) => {
    bridgeRef.current?.setTargetCamera(camera)
  }, [])

  return {
    ...gestureState,
    settings,
    updateSettings,
    setTargetMesh,
    setTargetCamera,
  }
}
