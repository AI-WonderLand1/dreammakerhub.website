'use client';

import React, { useRef, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface WebGPUEngineProps {
  // You might pass configuration or state down from a parent
  config?: any;
  onInitializationSuccess?: () => void;
  onInitializationError?: (error: string) => void;
}

const WebGPUEngine: React.FC<WebGPUEngineProps> = ({
  config,
  onInitializationSuccess,
  onInitializationError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deviceRef = useRef<GPUDevice | null>(null);
  const [message, setMessage] = useState<string>('Initializing WebGPU...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeWebGPU = async () => {
      setMessage('Checking for WebGPU support...');
      if (!navigator.gpu) {
        const errorMsg = 'WebGPU is not supported in this browser.';
        setMessage(errorMsg);
        onInitializationError?.(errorMsg);
        return;
      }

      setMessage('Requesting adapter...');
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (cancelled) return;
        
        if (!adapter) {
          const errorMsg = 'No suitable GPU adapter found.';
          setMessage(errorMsg);
          onInitializationError?.(errorMsg);
          return;
        }

        setMessage('Requesting device...');
        const device = await adapter.requestDevice();
        if (cancelled) {
          device.destroy();
          return;
        }
        
        deviceRef.current = device;
        setIsReady(true);
        setMessage('WebGPU initialized successfully!');
        onInitializationSuccess?.();

        // --- Basic Rendering Setup ---
        if (canvasRef.current && device) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('webgpu');

          if (!context) {
            const errorMsg = 'Failed to get WebGPU context.';
            setMessage(errorMsg);
            onInitializationError?.(errorMsg);
            return;
          }

          const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
          context.configure({
            device: device,
            format: presentationFormat,
            alphaMode: 'opaque',
          });

          // Simple render pass example: clear the screen to a color
          const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
              {
                clearValue: { r: 0.1, g: 0.1, b: 0.3, a: 1.0 }, // Dark blue background
                loadOp: 'clear',
                storeOp: 'store',
                view: context.getCurrentTexture().createView(),
              },
            ],
          };

          const commandEncoder = device.createCommandEncoder();
          const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
          passEncoder.end(); // End the render pass

          // Submit the command buffer to the GPU
          device.queue.submit([commandEncoder.finish()]);
          logger.info('Basic WebGPU render pass executed.');
        }
        // --- End Basic Rendering Setup ---

      } catch (error: any) {
        if (cancelled) return;
        const errorMsg = `WebGPU initialization failed: ${error.message}`;
        setMessage(errorMsg);
        onInitializationError?.(errorMsg);
        logger.error('WebGPU Error:', error);
      }
    };

    initializeWebGPU();

    // Cleanup function - uses ref to avoid stale closure
    return () => {
      cancelled = true;
      if (deviceRef.current) {
        deviceRef.current.destroy(); // Release GPU resources
        deviceRef.current = null;
        logger.info('WebGPU device destroyed.');
      }
    };
  }, [onInitializationSuccess, onInitializationError]); // Dependencies for the effect

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">WebGPU Engine Integration</h2>
      <p className="text-lg mb-2">{message}</p>
      {isReady ? (
        <p className="text-green-400 mb-4">GPU Device Ready!</p>
      ) : (
        <p className="text-red-400 mb-4">Waiting for GPU device...</p>
      )}

      {/* The canvas where WebGPU will render */}
      <canvas
        ref={canvasRef}
        width={800} // Default width, could be responsive
        height={600} // Default height, could be responsive
        className="border-2 border-blue-500 bg-black"
        style={{ display: isReady ? 'block' : 'none' }} // Only show canvas if device is ready
      >
        Your browser does not support the canvas element or WebGPU.
      </canvas>

      {/* You might add controls or status indicators here */}
      {config && (
        <div className="mt-4 text-sm text-gray-300">
          Config: {JSON.stringify(config)}
        </div>
      )}
    </div>
  );
};

export default WebGPUEngine;
