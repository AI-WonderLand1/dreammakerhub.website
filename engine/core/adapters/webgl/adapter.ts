import type { EngineAdapter, EngineConfig, EngineInstance } from '../types';

export class WebGLAdapter implements EngineAdapter {
  public name = 'webgl';

  public async create(config: EngineConfig): Promise<EngineInstance> {
    console.log('[WebGLAdapter] Creating engine instance...');
    
    const canvas = config.canvas;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    // Basic shader setup
    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);
      }
    `;

    const program = this.createProgram(gl, vsSource, fsSource);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return {
      name: this.name,
      canvas,
      context: gl as any,
      device: null,
      destroy: async () => {
        console.log('[WebGLAdapter] Destroying instance');
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
      },
    };
  }

  private createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
    const vs = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Could not compile WebGL program: ' + gl.getProgramInfoLog(program));
    }
    return program;
  }

  private loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Could not compile WebGL shader: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }
}
