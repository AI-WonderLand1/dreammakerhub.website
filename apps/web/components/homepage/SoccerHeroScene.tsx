"use client";

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { speak } from './heroVoice';

interface SceneTiltProps {
  children: React.ReactNode;
}

function SceneTilt({ children }: SceneTiltProps) {
  const tiltRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!tiltRef.current) return;
    const p = state.pointer;
    tiltRef.current.rotation.x = THREE.MathUtils.lerp(tiltRef.current.rotation.x, p.y * 0.12, 0.05);
    tiltRef.current.rotation.y = THREE.MathUtils.lerp(tiltRef.current.rotation.y, p.x * 0.2, 0.05);
  });

  return <group ref={tiltRef}>{children}</group>;
}

function SoccerBall() {
  const spinRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const [kicking, setKicking] = useState(false);
  const lastHoverVoiceAt = useRef(0);

  const pentagonDirs = useMemo(() => {
    const g = (1 + Math.sqrt(5)) / 2;
    const raw: [number, number, number][] = [
      [0, 1, g],
      [0, -1, g],
      [0, 1, -g],
      [0, -1, -g],
      [1, g, 0],
      [-1, g, 0],
      [1, -g, 0],
      [-1, -g, 0],
      [g, 0, 1],
      [-g, 0, 1],
      [g, 0, -1],
      [-g, 0, -1],
    ];
    return raw.map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  }, []);

  const quaternions = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return pentagonDirs.map((d) => new THREE.Quaternion().setFromUnitVectors(up, d));
  }, [pentagonDirs]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (spinRef.current) {
      const speed = hovered ? 2.6 : 0.4;
      spinRef.current.rotation.x += delta * speed * 0.35;
      spinRef.current.rotation.y += delta * speed;
    }
    if (ballRef.current) {
      ballRef.current.position.y = Math.sin(t * 1.4) * 0.12;
      const kick = kicking ? Math.max(0, Math.sin(t * 8)) : 0;
      const target = 1 + kick * 0.08;
      const s = THREE.MathUtils.lerp(ballRef.current.scale.x, target, 0.15);
      ballRef.current.scale.setScalar(s);
    }
    if (matRef.current) {
      const target = hovered ? 0.6 : 0.12;
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        target,
        0.08
      );
    }
  });

  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        const now = Date.now();
        if (now - lastHoverVoiceAt.current > 4000) {
          lastHoverVoiceAt.current = now;
          speak('Welcome to AI Wonderland. Where imagination meets innovation.');
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onPointerDown={() => setKicking(true)}
      onPointerUp={() => setKicking(false)}
    >
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.8}>
        <group ref={spinRef}>
          <group>
            {pentagonDirs.map((d, i) => (
              <mesh key={i} position={[d.x * 1.02, d.y * 1.02, d.z * 1.02]} quaternion={quaternions[i]}>
                <cylinderGeometry args={[0.4, 0.4, 0.05, 5]} />
                <meshStandardMaterial color="#09090d" metalness={0.6} roughness={0.2} />
              </mesh>
            ))}
          </group>
          <mesh ref={ballRef}>
            <sphereGeometry args={[1.06, 64, 64]} />
            <meshStandardMaterial
              ref={matRef}
              color="#f4f4f5"
              metalness={0.25}
              roughness={0.35}
              emissive="#3b82f6"
              emissiveIntensity={0.12}
            />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[1.1, 0]} />
            <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.35} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function OrbitRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
      ringRef.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[1.75, 0.012, 16, 140]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
    </mesh>
  );
}

function Satellites() {
  const gRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gRef.current) {
      gRef.current.rotation.y += delta * 0.7;
      gRef.current.rotation.z += delta * 0.12;
    }
  });

  return (
    <group ref={gRef}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const r = 2.15;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a * 2) * 0.3, Math.sin(a) * r]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#22d3ee' : '#a855f7'} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function SoccerHeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.4, 4.6], fov: 42 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 4]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-6, -2, -4]} intensity={60} color="#22d3ee" />
      <pointLight position={[4, -3, 5]} intensity={40} color="#a855f7" />

      <SceneTilt>
        <group position={[0, 0.55, 0]}>
          <SoccerBall />
          <OrbitRing />
          <Satellites />
        </group>
      </SceneTilt>

      <Sparkles count={150} scale={[12, 6, 8]} size={2.2} speed={0.4} opacity={0.5} color="#7dd3fc" />
      <ContactShadows position={[0, -2.4, 0]} opacity={0.65} scale={16} blur={2.6} far={4} />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        minDistance={2.6}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.55}
        minPolarAngle={Math.PI * 0.25}
      />
    </Canvas>
  );
}