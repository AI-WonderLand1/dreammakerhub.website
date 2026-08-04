import type { EngineAdapter, EngineConfig, EngineInstance, WebGLShader as WebGLShaderSource } from '../types';
import { logger } from '@lib/logger';

export class WebGLAdapter implements EngineAdapter {
  public name = 'webgl';

  public async create(config: EngineConfig): Promise<EngineInstance> {
    logger.info('[WebGLAdapter] Creating engine instance...');
    
    const canvas = config.canvas;
    if (!canvas) {
      throw new Error('[WebGLAdapter] No canvas provided');
    }
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    // Default shader for rendering a fullscreen gradient
    const defaultShader: WebGLShaderSource = {
      vertex: `
        attribute vec4 aVertexPosition;
        void main() {
          gl_Position = aVertexPosition;
        }
      `,
      fragment: `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;
        void main() {
          float r = sin(uTime * 0.001) * 0.5 + 0.5;
          float g = cos(uTime * 0.001) * 0.5 + 0.5;
          float b = sin(uTime * 0.0015) * 0.5 + 0.5;
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
    };

    const { program, uniforms } = this.createShaderProgram(gl, defaultShader);
    gl.useProgram(program);

    // Setup vertex buffer for fullscreen triangle
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
       0.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Setup uniforms
    const uniformLocations = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
    };

    // Setup time and resolution uniforms
    const startTime = Date.now();
    const render = (currentTime: number) => {
      if (!gl || gl.isContextLost()) return;
      
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const elapsed = (currentTime - startTime) / 1000.0;
      gl.uniform1f(uniformLocations.uTime, elapsed);
      gl.uniform2f(uniformLocations.uResolution, canvas.width, canvas.height);
      
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Animation loop
    let animationId: number;
    const startLoop = () => {
      const animate = (time: number) => {
        render(time);
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    };
    startLoop();

    return {
      name: this.name,
      canvas,
      context: gl as any,
      device: null,
      destroy: async () => {
        logger.info('[WebGLAdapter] Destroying instance');
        cancelAnimationFrame(animationId);
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
        const webglLost = gl.getExtension('WEBGL_lose_context');
        if (webglLost) {
          webglLost.loseContext();
        }
      },
    };
  }

  private createShaderProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, shader: WebGLShaderSource): {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
  } {
    const vs = this.loadShader(gl, gl.VERTEX_SHADER, shader.vertex);
    const fs = this.loadShader(gl, gl.FRAGMENT_SHADER, shader.fragment);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Could not compile WebGL program: ' + gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    
    const uniforms: Record<string, WebGLUniformLocation | null> = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
    };
    
    return { program, uniforms };
  }

  private loadShader(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Could not compile WebGL shader: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }
}
