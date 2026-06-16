import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const sceneData = data.data || {}
  const workspaceName = data.name.replace(/[^a-zA-Z0-9_-]/g, '_')

  const standaloneHtml = generateStandaloneViewer(workspaceName, sceneData)

  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []

  const header = `--BOUNDARY\r\nContent-Type: application/json\r\nContent-Disposition: form-data; name="scene"\r\n\r\n${JSON.stringify(sceneData)}\r\n`
  parts.push(encoder.encode(header))

  const viewerPart = `--BOUNDARY\r\nContent-Type: text/html\r\nContent-Disposition: attachment; filename="index.html"\r\n\r\n${standaloneHtml}\r\n`
  parts.push(encoder.encode(viewerPart))

  const footer = encoder.encode('--BOUNDARY--\r\n')
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0)

  const zipBuffer = await buildSimpleZip([
    { name: 'index.html', content: standaloneHtml },
    { name: 'scene.json', content: JSON.stringify(sceneData, null, 2) },
    { name: 'README.txt', content: generateReadme(workspaceName) },
  ])

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${workspaceName}-workspace.zip"`,
      'Content-Length': zipBuffer.length.toString(),
    },
  })
}

async function buildSimpleZip(files: { name: string; content: string }[]): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const localHeaders: Uint8Array[] = []
  const centralHeaders: Uint8Array[] = []
  const fileContents: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const content = encoder.encode(file.content)
    const nameBytes = encoder.encode(file.name)
    const crc = crc32(content)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    localHeader.set([0x50, 0x4b, 0x03, 0x04], 0)
    const version = new Uint8Array(2); version[0] = 20; localHeader.set(version, 4)
    const gp = new Uint8Array(2); localHeader.set(gp, 6)
    const compMethod = new Uint8Array(2); localHeader.set(compMethod, 8)
    const crcArr = new Uint8Array(4)
    for (let i = 0; i < 4; i++) crcArr[i] = (crc >> (i * 8)) & 0xff
    localHeader.set(crcArr, 14)
    const sizeArr = new Uint8Array(4)
    for (let i = 0; i < 4; i++) sizeArr[i] = (content.length >> (i * 8)) & 0xff
    localHeader.set(sizeArr, 18)
    localHeader.set(sizeArr, 22)
    localHeader.set([nameBytes.length, 0], 26)
    localHeader.set(nameBytes, 30)

    localHeaders.push(localHeader)
    fileContents.push(content)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    centralHeader.set([0x50, 0x4b, 0x01, 0x02], 0)
    const verMade = new Uint8Array(2); verMade[0] = 20; centralHeader.set(verMade, 4)
    const verNeed = new Uint8Array(2); verNeed[0] = 20; centralHeader.set(verNeed, 6)
    centralHeader.set(gp, 8)
    centralHeader.set(compMethod, 10)
    centralHeader.set(crcArr, 14)
    centralHeader.set(sizeArr, 18)
    centralHeader.set(sizeArr, 22)
    centralHeader.set([nameBytes.length, 0], 28)
    const extraLen = new Uint8Array(2); centralHeader.set(extraLen, 30)
    const commentLen = new Uint8Array(2); centralHeader.set(commentLen, 32)
    const diskStart = new Uint8Array(2); centralHeader.set(diskStart, 34)
    const internalAttr = new Uint8Array(2); centralHeader.set(internalAttr, 36)
    const externalAttr = new Uint8Array(4); externalAttr[3] = 0x20; centralHeader.set(externalAttr, 38)
    const offsetArr = new Uint8Array(4)
    for (let i = 0; i < 4; i++) offsetArr[i] = (offset >> (i * 8)) & 0xff
    centralHeader.set(offsetArr, 42)
    centralHeader.set(nameBytes, 46)

    centralHeaders.push(centralHeader)
    offset += localHeader.length + content.length
  }

  const eocd = new Uint8Array(22)
  eocd.set([0x50, 0x4b, 0x05, 0x06], 0)
  const diskNum = new Uint8Array(2); eocd.set(diskNum, 4)
  const diskStart2 = new Uint8Array(2); eocd.set(diskStart2, 6)
  const numEntries = new Uint8Array(2)
  numEntries[0] = files.length; numEntries[1] = 0
  eocd.set(numEntries, 8)
  eocd.set(numEntries, 10)
  const centralSize = centralHeaders.reduce((s, h) => s + h.length, 0)
  const centralSizeArr = new Uint8Array(4)
  for (let i = 0; i < 4; i++) centralSizeArr[i] = (centralSize >> (i * 8)) & 0xff
  eocd.set(centralSizeArr, 12)
  const centralOffset = offset
  const centralOffsetArr = new Uint8Array(4)
  for (let i = 0; i < 4; i++) centralOffsetArr[i] = (centralOffset >> (i * 8)) & 0xff
  eocd.set(centralOffsetArr, 16)
  const commentLen2 = new Uint8Array(2); eocd.set(commentLen2, 20)

  const result = new Uint8Array(offset + centralSize + 22)
  let pos = 0
  for (let i = 0; i < files.length; i++) {
    result.set(localHeaders[i], pos); pos += localHeaders[i].length
    result.set(fileContents[i], pos); pos += fileContents[i].length
  }
  for (const ch of centralHeaders) {
    result.set(ch, pos); pos += ch.length
  }
  result.set(eocd, pos)

  return result
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffff2567) >>> 0
}

function generateStandaloneViewer(name: string, sceneData: Record<string, unknown>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} — 3D Workspace</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;color:#fff;font-family:system-ui,sans-serif;overflow:hidden}
#canvas-container{width:100vw;height:100vh;display:block}
#ui-overlay{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 16px;display:flex;gap:8px;align-items:center;z-index:10;font-size:13px}
#ui-overlay span{color:rgba(255,255,255,.5)}
#ui-overlay strong{color:#fff}
#help{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,.4);z-index:10}
.export-btn{background:#6366f1;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.export-btn:hover{background:#4f46e5}
</style>
</head>
<body>
<div id="ui-overlay"><strong>${escapeHtml(name)}</strong><span>·</span>3D Workspace <span>·</span><button class="export-btn" onclick="exportGLB()">⬇ Export GLB</button></div>
<div id="help">🖱 Drag to orbit · Scroll to zoom</div>
<div id="canvas-container"></div>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const sceneData = ${JSON.stringify(sceneData)};

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
const camPos = sceneData.camera?.position || [0, 3, 8];
camera.position.set(camPos[0], camPos[1], camPos[2]);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1;
controls.maxDistance = 50;

const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.StandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.2 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(20, 20, 0x333366, 0x222244);
gridHelper.position.y = -0.49;
scene.add(gridHelper);

const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0x4444aa, 0x222244, 0.6);
scene.add(hemiLight);

const primitives = {
  box: (p) => new THREE.BoxGeometry(p.width || 1, p.height || 1, p.depth || 1),
  sphere: (p) => new THREE.SphereGeometry(p.radius || 0.5, 32, 32),
  cylinder: (p) => new THREE.CylinderGeometry(p.radiusTop || 0.5, p.radiusBottom || 0.5, p.height || 1, 32),
  plane: (p) => new THREE.PlaneGeometry(p.width || 1, p.height || 1),
  torus: (p) => new THREE.TorusGeometry(p.radius || 0.5, p.tube || 0.2, 16, 32),
};

if (sceneData.objects && sceneData.objects.length > 0) {
  for (const obj of sceneData.objects) {
    try {
      let geo;
      if (obj.meshType && primitives[obj.meshType]) {
        geo = primitives[obj.meshType](obj.parameters || {});
      } else {
        geo = new THREE.BoxGeometry(1, 1, 1);
      }
      const mat = new THREE.StandardMaterial({
        color: obj.color ? new THREE.Color(obj.color[0], obj.color[1], obj.color[2]) : 0x4488ff,
        metalness: obj.metalness ?? 0.3,
        roughness: obj.roughness ?? 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obj.position?.[0] || 0, obj.position?.[1] || 0, obj.position?.[2] || 0);
      mesh.rotation.set(obj.rotation?.[0] || 0, obj.rotation?.[1] || 0, obj.rotation?.[2] || 0);
      mesh.scale.set(obj.scale?.[0] || 1, obj.scale?.[1] || 1, obj.scale?.[2] || 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.name = obj.name || 'Object';
      scene.add(mesh);
    } catch(e) { console.warn('Failed to load object:', obj.name, e); }
  }
}

window.exportGLB = async function() {
  const exporter = new GLTFExporter();
  const exportScene = scene.clone();
  exportScene.remove(exportScene.children.find(c => c.isGridHelper));
  exportScene.remove(exportScene.children.find(c => c.userData?.isGround));
  try {
    const glb = await exporter.parseAsync(exportScene, { binary: true });
    const blob = new Blob([glb], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '${escapeHtml(name)}.glb';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { alert('Export failed: ' + e.message); }
};

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const w = container.clientWidth, h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
</script>
</body>
</html>`
}

function generateReadme(name: string): string {
  return `=== ${name} — 3D Workspace ===

This is your exported 3D workspace from AI Wonderland.

Files:
  index.html   — Standalone 3D viewer (open in browser)
  scene.json   — Raw scene data (edit and re-import)
  README.txt   — This file

To use:
  1. Open index.html in any modern browser
  2. Drag to orbit, scroll to zoom
  3. Click "Export GLB" to download a 3D model file

To run locally:
  No server required — just double-click index.html.
  All 3D rendering is done client-side via Three.js (loaded from CDN).

To re-import into AI Wonderland:
  Upload scene.json to your workspace editor.
`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
