/**
 * Custom Runner Factory
 * Generates specialized code for each engine type
 * PlayCanvas 3D, WebGL Shaders, Puck UI, Theia IDE
 */

export type EngineType = 'playcanvas' | 'webgl' | 'puck' | 'theia';

export interface RunnerContext {
  projectId: string;
  engineType: EngineType;
  projectName: string;
  config?: Record<string, any>;
}

export interface RunnerResult {
  code: string;
  language: string;
  imports: string[];
  errors: string[];
  warnings: string[];
}

// PlayCanvas 3D Scene Runner
export function createPlayCanvasScene(context: RunnerContext): RunnerResult {
  const { projectName } = context;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!projectName) {
    errors.push('Project name is required');
  }

  const code = `
import * as pc from 'playcanvas';

// Initialize PlayCanvas Engine
const canvas = document.getElementById('canvas');
const app = new pc.Application(canvas, {
  mouse: new pc.Mouse(canvas),
  touch: new pc.TouchDevice(canvas),
  graphicsDevice: pc.GraphicsDevice.create(canvas),
});

// Create scene hierarchy
const root = new pc.Entity('${projectName}');
app.root.addChild(root);

// Add camera
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
  clearColor: new pc.Color(0, 0, 0),
  fov: 45,
});
camera.setLocalPosition(0, 5, 10);
camera.lookAt(0, 0, 0);
root.addChild(camera);
app.scene.setActiveCamera(camera.camera);

// Add lighting
const light = new pc.Entity('light');
light.addComponent('light', {
  type: 'directional',
  castShadows: true,
  intensity: 1,
});
light.setLocalEulerAngles(45, 45, 0);
root.addChild(light);

// Add model/mesh
const mesh = new pc.Entity('mesh');
mesh.addComponent('model', {
  type: 'box',
});
mesh.addComponent('render', {
  meshInstances: [mesh.model.meshInstances[0]],
});
root.addChild(mesh);

// Update loop
app.on('update', (dt) => {
  mesh.rotate(2 * dt, 1 * dt, 0.5 * dt);
});

// Start rendering
app.start();

export { app, root };
`;

  return {
    code,
    language: 'typescript',
    imports: [
      "import * as pc from 'playcanvas';",
      "import PlayCanvasEngine from '@/components/engines/PlayCanvasEngine';",
    ],
    errors,
    warnings,
  };
}

// WebGL Shader Runner
export function createWebGLShader(context: RunnerContext): RunnerResult {
  const { projectName } = context;
  const errors: string[] = [];
  const warnings: string[] = [];

  const code = `
// WebGL Fragment Shader - ${projectName}
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

// Noise function
float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  // Time-based animation
  uv += sin(uTime) * 0.1;
  
  // Color variation
  vec3 color = vec3(
    sin(uv.x * 5.0 + uTime) * 0.5 + 0.5,
    cos(uv.y * 5.0 + uTime) * 0.5 + 0.5,
    noise(uv + uTime) * 0.5 + 0.5
  );
  
  // Apply texture if available
  color *= texture2D(uTexture, uv).rgb;
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
}
`;

  const vertexCode = `
// WebGL Vertex Shader - ${projectName}
precision mediump float;

uniform mat4 uMatrix;
uniform float uTime;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vUv;

void main() {
  vUv = aTexCoord;
  
  vec3 pos = aPosition;
  pos.y += sin(uTime + aPosition.x) * 0.1;
  
  gl_Position = uMatrix * vec4(pos, 1.0);
}
`;

  warnings.push('Remember to compile and link both vertex and fragment shaders');
  warnings.push('Test with WebGL Inspector for debugging');

  return {
    code: \`Fragment Shader:\n\${code}\n\nVertex Shader:\n\${vertexCode}\`,
    language: 'glsl',
    imports: [
      'import WebGLStudioEngine from "@/components/engines/WebGLStudioEngine";',
      'import { WebGLRenderer } from "three";',
    ],
    errors,
    warnings,
  };
}

// Puck UI Builder Runner
export function createPuckUILayout(context: RunnerContext): RunnerResult {
  const { projectName } = context;
  const errors: string[] = [];
  const warnings: string[] = [];

  const code = `
import { Puck } from '@measured/puck';
import '@measured/puck/puck.css';

// Define component library
const config = {
  components: {
    HeadingBlock: {
      fields: {
        title: { type: 'text' },
        level: { type: 'select', options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
        ]},
      },
      defaultProps: {
        title: 'Welcome to ${projectName}',
        level: 'h1',
      },
      render: ({ title, level }) => {
        const Tag = level;
        return <Tag>{title}</Tag>;
      },
    },
    ButtonBlock: {
      fields: {
        text: { type: 'text' },
        variant: { type: 'select', options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Danger', value: 'danger' },
        ]},
      },
      render: ({ text, variant }) => (
        <button className={\`btn-\${variant}\`}>{text}</button>
      ),
    },
    GridBlock: {
      fields: {
        columns: { type: 'number' },
      },
      render: ({ columns }) => (
        <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${columns}, 1fr)\` }}>
          {/* Grid content */}
        </div>
      ),
    },
  },
};

// Initial page structure
const initialData = {
  root: {
    type: 'HeadingBlock',
    props: { title: '${projectName}', level: 'h1' },
  },
};

export default function Editor() {
  return (
    <Puck config={config} data={initialData} />
  );
}
`;

  return {
    code,
    language: 'typescript',
    imports: [
      "import { Puck } from '@measured/puck';",
      "import PuckUIEngine from '@/components/engines/PuckUIEngine';",
    ],
    errors,
    warnings,
  };
}

// Theia IDE Bridge Runner
export function createTheiaAPIBridge(context: RunnerContext): RunnerResult {
  const { projectName } = context;
  const errors: string[] = [];
  const warnings: string[] = [];

  const code = `
import { injectable } from 'inversify';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import * as rpc from 'vscode-jsonrpc/node';

/**
 * Theia API Bridge for ${projectName}
 * Connect to Theia IDE for code editing and execution
 */

@injectable()
export class TheiaAPIBridge {
  private client: LanguageClient;
  private serverProcess: any;

  async initialize(): Promise<void> {
    // Server options for Theia language server
    const serverOptions: ServerOptions = {
      run: { command: 'node', args: ['./server/index.js'] },
      debug: { command: 'node', args: ['--nolazy', '--inspect=6009', './server/index.js'] },
    };

    // Client options
    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascript' },
      ],
    };

    this.client = new LanguageClient(
      'theiabridge',
      'Theia Bridge - ${projectName}',
      serverOptions,
      clientOptions
    );

    await this.client.start();
  }

  // Open file in Theia
  async openFile(filePath: string): Promise<void> {
    const request = new rpc.RequestType('textDocument/open');
    await this.client.sendRequest(request, { uri: filePath });
  }

  // Execute code in Theia terminal
  async executeCommand(command: string): Promise<string> {
    const request = new rpc.RequestType('workspace/executeCommand');
    return this.client.sendRequest(request, {
      command: 'terminal.run',
      args: [command],
    });
  }

  // Get diagnostics (errors/warnings)
  async getDiagnostics(): Promise<any[]> {
    const request = new rpc.RequestType('textDocument/publishDiagnostics');
    return this.client.sendRequest(request, {});
  }

  // Format document
  async formatDocument(filePath: string): Promise<void> {
    const request = new rpc.RequestType('textDocument/formatting');
    await this.client.sendRequest(request, { textDocument: { uri: filePath } });
  }
}

// Export singleton
export const theiaAPIBridge = new TheiaAPIBridge();
`;

  warnings.push('Ensure Theia server is running before initializing');
  warnings.push('Configure LSP settings in Theia workspace preferences');

  return {
    code,
    language: 'typescript',
    imports: [
      "import { injectable } from 'inversify';",
      "import { LanguageClient } from 'vscode-languageclient/node';",
      "import TheiaIDEEngine from '@/components/engines/TheiaIDEEngine';",
    ],
    errors,
    warnings,
  };
}

// Main Runner Factory
export function runnerFactory(context: RunnerContext): RunnerResult {
  switch (context.engineType) {
    case 'playcanvas':
      return createPlayCanvasScene(context);
    case 'webgl':
      return createWebGLShader(context);
    case 'puck':
      return createPuckUILayout(context);
    case 'theia':
      return createTheiaAPIBridge(context);
    default:
      return {
        code: '',
        language: 'typescript',
        imports: [],
        errors: ['Unknown engine type'],
        warnings: [],
      };
  }
}
