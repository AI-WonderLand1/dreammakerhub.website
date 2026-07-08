"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type ThreeCanvasWrapperBlockProps = {
  label: string;
  height: "sm" | "md" | "lg" | "xl";
  sceneType: "webgl" | "3d-world" | "particle" | "custom";
  showControls: boolean;
  modelUrl?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
};

const heights = {
  sm: "h-48",
  md: "h-72",
  lg: "h-96",
  xl: "h-[32rem]",
};

function createScene(container: HTMLDivElement, sceneType: string, backgroundColor: string, modelUrl?: string) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor || "#0a0a1a");

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(5, 5, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;

  const ambientLight = new THREE.AmbientLight(0x404060);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x4488ff, 1, 20);
  pointLight.position.set(-5, 5, -5);
  scene.add(pointLight);

  let mesh: THREE.Mesh | null = null;
  let animationId: number | null = null;

  if (modelUrl) {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.position.set(center.x + 5, center.y + 5, center.z + 5);
        controls.update();
      },
      undefined,
      () => {
        addDefaultMesh();
      }
    );
  } else if (sceneType === "particle") {
    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x4488ff,
      size: 0.05,
      transparent: true,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
  } else {
    addDefaultMesh();
  }

  function addDefaultMesh() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(Math.random() * 0xffffff),
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 1,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const wireframeGeo = new THREE.EdgesGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.3 });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    mesh.add(wireframe);

    const gridHelper = new THREE.GridHelper(10, 10, 0x4488ff, 0x224488);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    if (mesh) {
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
  }

  animate();

  return {
    renderer,
    controls,
    scene,
    camera,
    cancelAnimation: () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    resize: () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
  };
}

export default function ThreeCanvasWrapperBlock({
  label = "3D Canvas",
  height = "md",
  sceneType = "webgl",
  showControls = true,
  modelUrl,
  backgroundColor = "#0a0a1a",
  autoRotate = true,
}: ThreeCanvasWrapperBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    sceneRef.current = createScene(container, sceneType, backgroundColor, modelUrl);
    sceneRef.current.controls.autoRotate = autoRotate;
    setReady(true);

    const handleResize = () => sceneRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      sceneRef.current?.cancelAnimation();
      sceneRef.current?.renderer.dispose();
      sceneRef.current = null;
    };
  }, [sceneType, backgroundColor, autoRotate, modelUrl]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div className="p-4" data-block="three-canvas-wrapper">
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">{label}</p>
      )}
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black ${heights[height]}`}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        )}
        {showControls && ready && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
            {["Orbit", "Zoom", "Pan"].map((ctrl) => (
              <span
                key={ctrl}
                className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] text-white/40 backdrop-blur-sm"
              >
                {ctrl}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
