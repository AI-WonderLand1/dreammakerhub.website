'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { Model3DType, ViewportRenderMode, ViewportLighting } from '../types';
import { 
  RotateCw, 
  Maximize, 
  Eye, 
  Sun, 
  Camera, 
  Layers, 
  Sparkles, 
  Sliders, 
  RefreshCw,
  Box,
  Compass,
  Zap
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface ThreeViewportProps {
  modelType: Model3DType;
  primaryColor?: string;
  autoRotateDefault?: boolean;
  className?: string;
  showControlsBar?: boolean;
  glbUrl?: string;
  glbFilePath?: string;
  interactive?: boolean;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  modelType,
  primaryColor = '#00F0FF',
  autoRotateDefault = true,
  className = '',
  showControlsBar = true,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport State
  const [renderMode, setRenderMode] = useState<ViewportRenderMode>('textured');
  const [lighting, setLighting] = useState<ViewportLighting>('studio');
  const [autoRotate, setAutoRotate] = useState<boolean>(autoRotateDefault);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.5);
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  // Custom model state
  const [customModel, setCustomModel] = useState<THREE.Group | null>(null);
  const [isLoadingCustomModel, setIsLoadingCustomModel] = useState<boolean>(false);
  const [customModelError, setCustomModelError] = useState<string | null>(null);
  const [hasWebGlError, setHasWebGlError] = useState<boolean>(false);

  // References for Three.js internals
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const subMeshesRef = useRef<{ mesh: THREE.Mesh | THREE.Points; origPos: THREE.Vector3; explodeDir: THREE.Vector3 }[]>([]);

  // Orbit state simulation
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 6,
  });

  // Construct Procedural Model Mesh
  const createProceduralModel = (type: Model3DType, colorHex: string): THREE.Group => {
    const group = new THREE.Group();
    subMeshesRef.current = [];

    const baseColor = new THREE.Color(colorHex);
    const mainMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.3,
      metalness: 0.7,
      envMapIntensity: 1.0,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.5,
      metalness: 0.8,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const addSubMesh = (mesh: THREE.Mesh | THREE.Points, explodeDir: THREE.Vector3) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      subMeshesRef.current.push({
        mesh,
        origPos: mesh.position.clone(),
        explodeDir: explodeDir.normalize(),
      });
    };

    switch (type) {
      case 'mech': {
        // Torso Core
        const torsoGeo = new THREE.BoxGeometry(1.2, 1.6, 0.9);
        const torso = new THREE.Mesh(torsoGeo, darkMat);
        torso.position.set(0, 0.4, 0);
        addSubMesh(torso, new THREE.Vector3(0, 0.5, 0));

        // Reactor Core Orb
        const reactorGeo = new THREE.SphereGeometry(0.35, 24, 24);
        const reactor = new THREE.Mesh(reactorGeo, glowMat);
        reactor.position.set(0, 0.5, 0.3);
        addSubMesh(reactor, new THREE.Vector3(0, 0, 1));

        // Shoulders & Arms
        [-0.9, 0.9].forEach((x) => {
          const shoulderGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          const shoulder = new THREE.Mesh(shoulderGeo, mainMat);
          shoulder.position.set(x, 1.0, 0);
          addSubMesh(shoulder, new THREE.Vector3(x > 0 ? 1 : -1, 0.8, 0));

          const armGeo = new THREE.CylinderGeometry(0.18, 0.15, 1.2, 16);
          const arm = new THREE.Mesh(armGeo, darkMat);
          arm.position.set(x * 1.1, 0.3, 0);
          arm.rotation.z = x > 0 ? -0.2 : 0.2;
          addSubMesh(arm, new THREE.Vector3(x > 0 ? 1.5 : -1.5, 0.2, 0));

          // Cannons
          const cannonGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12);
          const cannon = new THREE.Mesh(cannonGeo, glowMat);
          cannon.rotation.x = Math.PI / 2;
          cannon.position.set(x * 1.1, 0.2, 0.5);
          addSubMesh(cannon, new THREE.Vector3(x > 0 ? 1.2 : -1.2, 0, 1));
        });

        // Legs
        [-0.5, 0.5].forEach((x) => {
          const legGeo = new THREE.BoxGeometry(0.4, 1.2, 0.5);
          const leg = new THREE.Mesh(legGeo, mainMat);
          leg.position.set(x, -0.8, 0);
          addSubMesh(leg, new THREE.Vector3(x > 0 ? 0.8 : -0.8, -1, 0));

          const footGeo = new THREE.BoxGeometry(0.5, 0.2, 0.8);
          const foot = new THREE.Mesh(footGeo, darkMat);
          foot.position.set(x, -1.4, 0.15);
          addSubMesh(foot, new THREE.Vector3(x > 0 ? 0.8 : -0.8, -1.2, 0.5));
        });

        // Head Unit
        const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
        const head = new THREE.Mesh(headGeo, mainMat);
        head.position.set(0, 1.4, 0);
        addSubMesh(head, new THREE.Vector3(0, 1.5, 0));
        break;
      }

      case 'crystal': {
        // Main Crystal
        const crystalGeo = new THREE.OctahedronGeometry(1.4, 2);
        const crystalMat = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.3,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.85,
          ior: 1.6,
          thickness: 1.2,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(0, 0.2, 0);
        addSubMesh(crystal, new THREE.Vector3(0, 1, 0));

        // Floating Orbital Rings
        [1.8, 2.2].forEach((radius, idx) => {
          const ringGeo = new THREE.TorusGeometry(radius, 0.04, 16, 64);
          const ring = new THREE.Mesh(ringGeo, glowMat);
          ring.rotation.x = Math.PI / (3 + idx);
          ring.rotation.y = Math.PI / (4 - idx);
          addSubMesh(ring, new THREE.Vector3(idx === 0 ? 1 : -1, 0, idx === 0 ? -1 : 1));
        });

        // Floating Runic Shards
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const shardGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
          const shard = new THREE.Mesh(shardGeo, mainMat);
          shard.position.set(Math.cos(angle) * 1.8, (i % 2 === 0 ? 0.5 : -0.3), Math.sin(angle) * 1.8);
          shard.rotation.z = Math.PI;
          addSubMesh(shard, new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
        }
        break;
      }

      case 'hoverbike': {
        // Body Chassis
        const bodyGeo = new THREE.ConeGeometry(0.6, 2.8, 8);
        const body = new THREE.Mesh(bodyGeo, mainMat);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 0, 0);
        addSubMesh(body, new THREE.Vector3(0, 0.5, 0));

        // Side Skis
        [-0.7, 0.7].forEach((x) => {
          const skiGeo = new THREE.BoxGeometry(0.1, 0.1, 2.2);
          const ski = new THREE.Mesh(skiGeo, glowMat);
          ski.position.set(x, -0.3, 0);
          addSubMesh(ski, new THREE.Vector3(x > 0 ? 1 : -1, -0.5, 0));
        });

        // Rear Plasma Thrusters
        [-0.3, 0.3].forEach((x) => {
          const thrusterGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 16);
          const thruster = new THREE.Mesh(thrusterGeo, darkMat);
          thruster.rotation.x = Math.PI / 2;
          thruster.position.set(x, 0.1, -1.2);
          addSubMesh(thruster, new THREE.Vector3(x > 0 ? 0.5 : -0.5, 0, -1));

          const flameGeo = new THREE.ConeGeometry(0.2, 0.7, 16);
          const flame = new THREE.Mesh(flameGeo, glowMat);
          flame.rotation.x = -Math.PI / 2;
          flame.position.set(x, 0.1, -1.8);
          addSubMesh(flame, new THREE.Vector3(x > 0 ? 0.5 : -0.5, 0, -1.5));
        });
        break;
      }

      case 'helmet': {
        // Main Helmet Dome
        const domeGeo = new THREE.SphereGeometry(1.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
        const dome = new THREE.Mesh(domeGeo, darkMat);
        dome.position.set(0, 0.2, 0);
        addSubMesh(dome, new THREE.Vector3(0, 1, 0));

        // Curved Visor
        const visorGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.6, 32, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
        const visorMat = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.9,
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.2, 0.2);
        addSubMesh(visor, new THREE.Vector3(0, 0.5, 1));

        // Ear Intake Filters
        [-1.0, 1.0].forEach((x) => {
          const filterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
          const filter = new THREE.Mesh(filterGeo, mainMat);
          filter.rotation.z = Math.PI / 2;
          filter.position.set(x, 0.1, 0);
          addSubMesh(filter, new THREE.Vector3(x > 0 ? 1 : -1, 0, 0));
        });
        break;
      }

      case 'pbr_sphere':
      case 'gold_material': {
        const isGold = type === 'gold_material';
        const sphereGeo = new THREE.IcosahedronGeometry(1.3, 5);
        const pbrMat = new THREE.MeshStandardMaterial({
          color: isGold ? new THREE.Color('#FFD700') : baseColor,
          metalness: isGold ? 0.95 : 0.8,
          roughness: isGold ? 0.15 : 0.25,
          wireframe: false,
        });
        const sphere = new THREE.Mesh(sphereGeo, pbrMat);
        sphere.position.set(0, 0, 0);
        addSubMesh(sphere, new THREE.Vector3(0, 1, 0));

        // Outer Ring Stand
        const standGeo = new THREE.TorusGeometry(1.8, 0.08, 16, 64);
        const stand = new THREE.Mesh(standGeo, darkMat);
        stand.rotation.x = Math.PI / 2;
        stand.position.set(0, -1.0, 0);
        addSubMesh(stand, new THREE.Vector3(0, -1, 0));
        break;
      }

      case 'portal_vfx': {
        // Swirling Torus Rings
        [1.6, 1.2, 0.8].forEach((r, idx) => {
          const torusGeo = new THREE.TorusGeometry(r, 0.08, 16, 64);
          const torus = new THREE.Mesh(torusGeo, glowMat);
          torus.rotation.z = (idx * Math.PI) / 3;
          torus.position.set(0, 0, 0);
          addSubMesh(torus, new THREE.Vector3(0, 0, idx === 0 ? 1 : idx === 1 ? -1 : 0));
        });

        // Center Vortex Core
        const coreGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const core = new THREE.Mesh(coreGeo, glowMat);
        addSubMesh(core, new THREE.Vector3(0, 0, 0));

        // Floating Particles
        const particleCount = 120;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const rad = 0.5 + Math.random() * 1.5;
          positions[i * 3] = Math.cos(theta) * rad;
          positions[i * 3 + 1] = Math.sin(theta) * rad;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({
          color: baseColor,
          size: 0.08,
          transparent: true,
          opacity: 0.8,
        });
        const particles = new THREE.Points(pGeo, pMat);
        group.add(particles);
        break;
      }

      case 'quantum_core': {
        // Central Plasma Core
        const coreGeo = new THREE.SphereGeometry(0.7, 32, 32);
        const core = new THREE.Mesh(coreGeo, glowMat);
        addSubMesh(core, new THREE.Vector3(0, 0, 0));

        // 3 Orbital Gimbal Rings
        [1.2, 1.5, 1.8].forEach((r, idx) => {
          const ringGeo = new THREE.TorusGeometry(r, 0.05, 16, 64);
          const ring = new THREE.Mesh(ringGeo, darkMat);
          ring.rotation.x = idx === 0 ? Math.PI / 2 : 0;
          ring.rotation.y = idx === 1 ? Math.PI / 2 : 0;
          ring.rotation.z = idx === 2 ? Math.PI / 4 : 0;
          addSubMesh(ring, new THREE.Vector3(idx === 0 ? 1 : 0, idx === 1 ? 1 : 0, idx === 2 ? 1 : 0));
        });
        break;
      }

      default: {
        // Fallback Complex Polyhedron
        const polyGeo = new THREE.DodecahedronGeometry(1.2, 1);
        const poly = new THREE.Mesh(polyGeo, mainMat);
        poly.position.set(0, 0, 0);
        addSubMesh(poly, new THREE.Vector3(0, 1, 0));

        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 16, 64), glowMat);
        outerRing.rotation.x = Math.PI / 3;
        addSubMesh(outerRing, new THREE.Vector3(0, -0.5, 0));
        break;
      }
    }

    return group;
  };

  // Setup Three.js Scene Lifecycle
  useEffect(() => {
    if (!mountRef.current || !canvasRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const height = mountRef.current.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07080c);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with WebGL error fallback
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    let isWebGlSupported = false;
    let renderer: THREE.WebGLRenderer | null = null;

    // Temporarily suppress internal Three.js console.error logs during driver capability check
    const originalConsoleError = console.error;
    try {
      console.error = (...args: any[]) => {
        const msg = args.map(a => String(a)).join(' ');
        if (msg.includes('WebGL') || msg.includes('THREE.WebGLRenderer')) {
          return; // Ignore WebGL driver failure errors in headless environments
        }
        originalConsoleError.apply(console, args);
      };

      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) loseContext.loseContext();

        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        setHasWebGlError(false);
        isWebGlSupported = true;
      }
    } catch (err) {
      isWebGlSupported = false;
      renderer = null;
    } finally {
      console.error = originalConsoleError;
    }

    if (!isWebGlSupported || !renderer) {
      console.warn("WebGL unavailable in environment, activating 3D Software Projection fallback.");
      setHasWebGlError(true);
      
      // 3D Software Projection Fallback Animation Loop
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let angleX = 0.2;
        let angleY = 0;
        const render3DFallback = () => {
          animFrameIdRef.current = requestAnimationFrame(render3DFallback);
          if (!mountRef.current || !canvas) return;
          
          const w = mountRef.current.clientWidth || 400;
          const h = mountRef.current.clientHeight || 300;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.fillStyle = '#07080c';
          ctx.fillRect(0, 0, w, h);

          // Render Grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          const gridY = h * 0.75;
          for (let x = -w; x < w * 2; x += 35) {
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo((x - w / 2) * 2 + w / 2, h);
            ctx.stroke();
          }

          // 3D Projected Polyhedron Geometry (Icosahedron / Crystal)
          angleY += 0.012;
          angleX += 0.003;

          const cx = w / 2;
          const cy = h / 2 - 20;
          const scale = Math.min(w, h) * 0.28;

          // 3D Mesh Vertices for Icosahedron Core
          const phiVal = (1 + Math.sqrt(5)) / 2;
          const rawVertices = [
            [-1, phiVal, 0], [1, phiVal, 0], [-1, -phiVal, 0], [1, -phiVal, 0],
            [0, -1, phiVal], [0, 1, phiVal], [0, -1, -phiVal], [0, 1, -phiVal],
            [phiVal, 0, -1], [phiVal, 0, 1], [-phiVal, 0, -1], [-phiVal, 0, 1]
          ];

          // Rotate & Project Vertices
          const projected = rawVertices.map(([vx, vy, vz]) => {
            const len = Math.sqrt(vx*vx + vy*vy + vz*vz);
            const x = (vx / len);
            const y = (vy / len);
            const z = (vz / len);

            const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
            const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);
            const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
            const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

            const fov = 3.5;
            const dist = fov / (fov + z2 * 0.5);
            return {
              px: cx + x1 * scale * dist,
              py: cy + y2 * scale * dist,
              pz: z2
            };
          });

          // Icosahedron Faces
          const faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
          ];

          faces.map(f => {
            const zAvg = (projected[f[0]].pz + projected[f[1]].pz + projected[f[2]].pz) / 3;
            return { face: f, zAvg };
          }).sort((a, b) => b.zAvg - a.zAvg).forEach(({ face, zAvg }) => {
            const p1 = projected[face[0]];
            const p2 = projected[face[1]];
            const p3 = projected[face[2]];

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.lineTo(p3.px, p3.py);
            ctx.closePath();

            const alpha = Math.max(0.15, Math.min(0.85, (zAvg + 1) / 2));
            ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.25})`;
            ctx.fill();

            ctx.strokeStyle = primaryColor || '#00F0FF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });

          projected.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.px, p.py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = primaryColor || '#00F0FF';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        };

        render3DFallback();
      }

      return () => {
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      };
    }

    // 4. Lighting Rig
    setupLighting(scene, lighting);

    // 5. Grid Helper
    const grid = new THREE.GridHelper(12, 24, new THREE.Color(primaryColor), new THREE.Color(0x222b3c));
    grid.position.y = -1.6;
    grid.name = 'gridHelper';
    scene.add(grid);

    // 6. Load Custom Model or Create Procedural Model
    const loadCustomModel = async () => {
      if (glbUrl || glbFilePath) {
        setIsLoadingCustomModel(true);
        setCustomModelError(null);
        try {
          const loader = new GLTFLoader();
          const url = glbUrl || (glbFilePath?.startsWith("/") ? glbFilePath : `/${glbFilePath}`);
          const gltf = await loader.loadAsync(url);
          const modelGroup = gltf.scene;
          modelGroup.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Ensure material is properly set up for PBR
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.needsUpdate = true;
              }
            }
          });
          // Apply primary color tint if needed
          if (primaryColor && primaryColor !== "#00F0FF") {
            modelGroup.traverse((child) => {
              if (child.isMesh && child.material instanceof THREE.MeshStandardMaterial) {
                // Blend with primary color as tint
                const color = new THREE.Color(primaryColor);
                child.material.color.lerp(color, 0.3);
              }
            });
          }
          setCustomModel(modelGroup);
          mainGroupRef.current = modelGroup;
          scene.add(modelGroup);
        } catch (error) {
          console.error("Failed to load GLTF model:", error);
          setCustomModelError(error.message);
          // Fallback to procedural model
          const modelGroup = createProceduralModel(modelType, primaryColor);
          mainGroupRef.current = modelGroup;
          scene.add(modelGroup);
        } finally {
          setIsLoadingCustomModel(false);
        }
      } else {
        // No custom model URL, create procedural model
        const modelGroup = createProceduralModel(modelType, primaryColor);
        mainGroupRef.current = modelGroup;
        scene.add(modelGroup);
      }
    };
    
    // Load the model
    loadCustomModel();

    // 7. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation
      if (autoRotate && mainGroupRef.current) {
        mainGroupRef.current.rotation.y += delta * rotationSpeed * 0.5;
      }

      // Model specific sub-mesh animation
      if (mainGroupRef.current) {
        if (modelType === 'quantum_core' || modelType === 'portal_vfx' || modelType === 'crystal') {
          mainGroupRef.current.children.forEach((child, idx) => {
            if (child instanceof THREE.Mesh) {
              child.rotation.z += delta * (idx % 2 === 0 ? 0.8 : -0.8);
            }
          });
        }
      }

      // Explode Factor mesh animation
      if (subMeshesRef.current.length > 0) {
        subMeshesRef.current.forEach(({ mesh, origPos, explodeDir }) => {
          mesh.position.copy(origPos).addScaledVector(explodeDir, explodeFactor * 1.5);
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!entry.contentRect) return;
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(mountRef.current);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [modelType, primaryColor]);

  // Update Camera position from orbit coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    cameraRef.current.position.x = radius * Math.sin(clampedPhi) * Math.cos(theta);
    cameraRef.current.position.y = radius * Math.cos(clampedPhi);
    cameraRef.current.position.z = radius * Math.sin(clampedPhi) * Math.sin(theta);
    cameraRef.current.lookAt(0, 0, 0);

    switch (type) {
      case 'cyberpunk': {
        scene.add(new THREE.AmbientLight(0x0a0a20, 1.5));
        const light1 = new THREE.DirectionalLight(0x00f0ff, 4.0);
        light1.position.set(3, 5, 2);
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0xff007f, 2.5);
        light2.position.set(-3, -1, -3);
        scene.add(light2);

        // Add rim light for separation
        const rimLight = new THREE.DirectionalLight(0x00ffff, 1.5);
        rimLight.position.set(0, 5, -5);
        scene.add(rimLight);
        break;
      }
      case 'sunset': {
        scene.add(new THREE.AmbientLight(0x221111, 1.2));
        const keyLight = new THREE.DirectionalLight(0xff7700, 4.0);
        keyLight.position.set(5, 3, 2);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x2266aa, 1.8);
        fillLight.position.set(-4, 1, -3);
        scene.add(fillLight);

        // Add rim light
        const rimLight = new THREE.DirectionalLight(0xff6b35, 1.2);
        rimLight.position.set(0, 4, -4);
        scene.add(rimLight);
        break;
      }
      case 'void': {
        scene.add(new THREE.AmbientLight(0x050505, 0.8));
        const spotLight = new THREE.SpotLight(0xffffff, 6.0, 25, Math.PI / 3, 0.3);
        spotLight.position.set(0, 10, 0);
        spotLight.target.position.set(0, 0, 0);
        scene.add(spotLight);
        break;
      }
      case 'studio':
      default: {
        // Enhanced studio lighting for PBR
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
        keyLight.position.set(3, 6, 2);
        keyLight.castShadow = true;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xaabbcc, 1.5);
        fillLight.position.set(-3, 2, -2);
        fillLight.castShadow = true;
        scene.add(fillLight);

        // Add rim/hair light for separation
        const rimLight = new THREE.DirectionalLight(0xfff9c0, 1.2);
        rimLight.position.set(-2, 4, 2);
        scene.add(rimLight);
        break;
      }
    }
  };

  // Update Lighting Rig

  // Re-apply Render Mode Shaders/Materials
  useEffect(() => {
    if (!mainGroupRef.current) return;

    mainGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        switch (renderMode) {
          case 'wireframe':
            child.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(primaryColor),
              wireframe: true,
            });
            break;
          case 'clay':
            child.material = new THREE.MeshStandardMaterial({
              color: 0xe2e8f0,
              roughness: 0.9,
              metalness: 0.05,
            });
            break;
          case 'normal':
            child.material = new THREE.MeshNormalMaterial();
            break;
          case 'xray':
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(primaryColor),
              transparent: true,
              opacity: 0.4,
              roughness: 0.1,
              transmission: 0.9,
              wireframe: false,
            });
            break;
          case 'textured':
          default:
            // Re-trigger procedural material rebuild
            break;
        }
      }
    });

    if (sceneRef.current) {
      setupLighting(sceneRef.current, lighting);
      const grid = sceneRef.current.getObjectByName('gridHelper');
      if (grid) grid.visible = showGrid;
    }
  }, [renderMode, lighting, showGrid, primaryColor]);

  // Orbit Mouse Drag Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    previousMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePosRef.current.x;
    const deltaY = e.clientY - previousMousePosRef.current.y;

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi -= deltaY * 0.008;

    updateCameraPosition();

    previousMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(2.5, Math.min(12, cameraAngleRef.current.radius + e.deltaY * 0.005));
    updateCameraPosition();
  };

  // High-Res Screenshot Capture
  const captureScreenshot = () => {
    if (!canvasRef.current) return;
    sounds.playClick();
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `dimension3d-${modelType}-render.png`;
    link.href = dataUrl;
    link.click();
  };

  // Fullscreen Viewport Toggle
  const toggleFullscreen = () => {
    sounds.playClick();
    if (!mountRef.current) return;
    if (!isFullscreen) {
      if (mountRef.current.requestFullscreen) {
        mountRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Reset Camera View
  const resetCamera = () => {
    sounds.playClick();
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 6 };
    if (mainGroupRef.current) mainGroupRef.current.rotation.set(0, 0, 0);
    setExplodeFactor(0);
    updateCameraPosition();
  };

  return (
    <div
      ref={mountRef}
      className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80 shadow-2xl group transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseUp();
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Left Viewport Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-900/80 backdrop-blur-md text-cyan-400 border border-cyan-500/30">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          {hasWebGlError ? '2D Viewport' : 'WebGL 3D'}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-900/60 backdrop-blur-md border border-slate-800">
          {renderMode.toUpperCase()}
        </span>
      </div>

      {/* Interactive Controls Overlay (Shown on Hover / Desktop) */}
      {showControlsBar && (
        <div
          className={`absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 transition-opacity duration-200 ${
            isHovered || interactive ? 'opacity-100' : 'opacity-80 sm:opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Render Mode Selectors */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'textured', label: 'Shaded', icon: Box },
              { id: 'wireframe', label: 'Wire', icon: Layers },
              { id: 'clay', label: 'Clay', icon: Eye },
              { id: 'normal', label: 'Normal', icon: Sparkles },
              { id: 'xray', label: 'X-Ray', icon: Zap },
            ].map((mode) => {
              const Icon = mode.icon;
              const isActive = renderMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    sounds.playModeChange();
                    setRenderMode(mode.id as ViewportRenderMode);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Switch to ${mode.label} render mode`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Explode Mesh Slider */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explode</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Turntable Auto Rotate Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                setAutoRotate(!autoRotate);
              }}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                autoRotate
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60'
              }`}
              title={autoRotate ? 'Pause Turntable' : 'Play Turntable'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>

            {/* Reset Camera Button */}
            <button
              onClick={resetCamera}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Screenshot PNG Button */}
            <button
              onClick={captureScreenshot}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              title="Capture 4K Render Screenshot"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              title="Toggle Fullscreen Viewport"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Drag Instruction Banner */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur-md border border-slate-800">
          <Compass className="w-3 h-3 text-cyan-400" />
          Drag to 360° Rotate
        </span>
      </div>
    </div>
  );
}
