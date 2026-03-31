'use client';

import { useAccessibility, EngineType } from '@/lib/accessibility-context';
import { useEffect } from 'react';

/**
 * Hook for engine-specific accessibility integration
 * Allows each engine to register narration and offer context-aware descriptions
 */
export function useEngineAccessibility(engine: EngineType) {
  const { speak, addTranscript, setCurrentEngine, currentEngine } = useAccessibility();

  // Update current engine context
  useEffect(() => {
    setCurrentEngine(engine);
  }, [engine, setCurrentEngine]);

  /**
   * Narrate engine-specific actions
   * E.g., in Theia: "Code line 42 selected: const x = 5"
   * E.g., in PlayCanvas: "Selected: Red Cube at position (0, 5, 0)"
   */
  const narrate = (text: string) => {
    speak(text, engine);
  };

  /**
   * Add engine-specific narration to transcript
   */
  const addNarration = (text: string) => {
    addTranscript({
      text,
      type: 'engine-narration',
      engineContext: engine,
    });
  };

  return {
    narrate,
    addNarration,
    currentEngine: currentEngine === engine,
  };
}

/**
 * Theia IDE specific accessibility
 */
export function useTheiaAccessibility() {
  const { narrate, addNarration } = useEngineAccessibility('theia');

  const announceSelection = (lineNumber: number, selectedText: string, language: string) => {
    const message = `Line ${lineNumber}, ${language}: ${selectedText}`;
    narrate(message);
    addNarration(message);
  };

  const announceError = (message: string, line: number) => {
    const fullMessage = `Error on line ${line}: ${message}`;
    narrate(fullMessage);
    addNarration(fullMessage);
  };

  const announceFileOpen = (fileName: string) => {
    const message = `Opened file: ${fileName}`;
    narrate(message);
    addNarration(message);
  };

  const announceTerminalOutput = (output: string) => {
    narrate(`Terminal output: ${output}`);
    addNarration(`Terminal: ${output}`);
  };

  return {
    announceSelection,
    announceError,
    announceFileOpen,
    announceTerminalOutput,
  };
}

/**
 * PlayCanvas 3D specific accessibility
 */
export function usePlayCanvasAccessibility() {
  const { narrate, addNarration } = useEngineAccessibility('playcanvas');

  const announceSelection = (objectName: string, position?: { x: number; y: number; z: number }) => {
    const positionText = position ? ` at position ${position.x}, ${position.y}, ${position.z}` : '';
    const message = `Selected: ${objectName}${positionText}`;
    narrate(message);
    addNarration(message);
  };

  const announceLight = (lightType: string, intensity: number) => {
    const message = `${lightType} light added with intensity ${intensity}`;
    narrate(message);
    addNarration(message);
  };

  const announceAnimation = (animationName: string, duration: number) => {
    const message = `Animation: ${animationName}, duration ${duration} seconds`;
    narrate(message);
    addNarration(message);
  };

  const announceCamera = (position: { x: number; y: number; z: number }) => {
    const message = `Camera position: ${position.x}, ${position.y}, ${position.z}`;
    narrate(message);
    addNarration(message);
  };

  return {
    announceSelection,
    announceLight,
    announceAnimation,
    announceCamera,
  };
}

/**
 * WebGL Studio specific accessibility
 */
export function useWebGLAccessibility() {
  const { narrate, addNarration } = useEngineAccessibility('webgl');

  const announceShaderChange = (shaderName: string, type: 'fragment' | 'vertex') => {
    const message = `${type.charAt(0).toUpperCase() + type.slice(1)} shader: ${shaderName}`;
    narrate(message);
    addNarration(message);
  };

  const announceFilter = (filterName: string, parameters: Record<string, any>) => {
    const paramText = Object.entries(parameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    const message = `Filter applied: ${filterName}. Parameters: ${paramText}`;
    narrate(message);
    addNarration(message);
  };

  const announceCanvasDraw = (elementType: string, properties: string) => {
    const message = `Drawing ${elementType}: ${properties}`;
    narrate(message);
    addNarration(message);
  };

  return {
    announceShaderChange,
    announceFilter,
    announceCanvasDraw,
  };
}

/**
 * Puck UI specific accessibility
 */
export function usePuckAccessibility() {
  const { narrate, addNarration } = useEngineAccessibility('puck');

  const announceComponentAdd = (componentName: string, count: number) => {
    const message = `Added ${componentName}. Total components: ${count}`;
    narrate(message);
    addNarration(message);
  };

  const announceLayoutChange = (layoutType: string, columns?: number) => {
    const message = columns
      ? `Layout changed to ${layoutType} with ${columns} columns`
      : `Layout changed to ${layoutType}`;
    narrate(message);
    addNarration(message);
  };

  const announcePropertyChange = (componentName: string, property: string, value: any) => {
    const message = `${componentName}: ${property} set to ${value}`;
    narrate(message);
    addNarration(message);
  };

  return {
    announceComponentAdd,
    announceLayoutChange,
    announcePropertyChange,
  };
}
