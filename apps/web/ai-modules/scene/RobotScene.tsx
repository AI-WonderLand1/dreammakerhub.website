"use client";
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../utils';

interface RobotProps {
  position: [number, number, number];
  color: string;
  isActive: boolean; // Thinking/Processing
  isTalking: boolean; // Speaking/Nodding
  label: string;
  glowColor: string;
}

function RobotModel({ position, color, isActive, isTalking, label, glowColor }: RobotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Distinct floating frequencies for each robot
      const freq = label === 'Guard' ? 1.2 : 0.8;
      meshRef.current.position.y = Math.sin(time * freq) * 0.1;

      if (isActive) {
        meshRef.current.rotation.y += 0.05; // Fast spin when working
      } else {
        meshRef.current.rotation.y += 0.005; // Idle drift
      }
    }

    if (headRef.current && isTalking) {
      headRef.current.position.y = 0.8 + Math.sin(time * 15) * 0.02;
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[0.9, 1.1, 0.7]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />

          {/* Visor / Eye Strip */}
          <mesh position={[0, 0.25, 0.36]}>
            <planeGeometry args={[0.6, 0.12]} />
            <meshStandardMaterial 
              color={isActive ? glowColor : "#333"} 
              emissive={isActive ? glowColor : "#111"} 
              emissiveIntensity={isActive ? 3 : 0.5} 
            />
          </mesh>
        </mesh>

        <group ref={headRef} position={[0, 0.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.45, 0.45]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Top Antenna - Pulses when processing */}
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial 
              color={isActive ? glowColor : "#444"} 
              emissive={isActive ? glowColor : "#000"}
              emissiveIntensity={isActive ? 2 : 0}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

interface RobotSceneProps {
  isConverting: boolean;   // Assistant is working on Video/Image/Voice
  isVerifying: boolean;    // Guard is checking BYOK/Security
  hasKey: boolean;         // BYOK Status
  hasBucket: boolean;      // BYOC Status
  timeLeft?: string;       // "23:59" for Temp Bucket
  confession?: string;     // Truth Shower message
}

export function RobotScene({ 
  isConverting, 
  isVerifying, 
  hasKey, 
  hasBucket, 
  timeLeft, 
  confession 
}: RobotSceneProps) {
  return (
    <div className="w-full h-full min-h-[450px] relative bg-[#080808] rounded-2xl border border-[#1a1a1a] overflow-hidden group">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={35} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
        <Environment preset="night" />

        <group position={[0, -0.5, 0]}>
          {/* GUARD: Left - Handles BYOK/Security */}
          <RobotModel 
            label="Guard"
            position={[-1.5, 0, 0]} 
            color="#1a1a1a" 
            glowColor="#ff3333" // Red for security/verification
            isActive={isVerifying} 
            isTalking={false} 
          />

          {/* ASSISTANT: Right - Handles Real Egyptian/BYOC */}
          <RobotModel 
            label="Assistant"
            position={[1.5, 0, 0]} 
            color="#d1d1d1" 
            glowColor="#3399ff" // Blue for creation/conversion
            isActive={isConverting} 
            isTalking={isConverting} 
          />
        </group>

        <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={12} blur={3} far={2} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>

      {/* CONNECTION DASHBOARD (BYOK / BYOC Status) */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 px-3 rounded-lg border border-white/5">
          <div className={cn("w-2 h-2 rounded-full shadow-lg", hasKey ? "bg-cyan-400 shadow-cyan-500/50" : "bg-red-500")} />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">BYOK: {hasKey ? 'CONNECTED' : 'WAITING'}</span>
        </div>
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 px-3 rounded-lg border border-white/5">
          <div className={cn("w-2 h-2 rounded-full shadow-lg", hasBucket ? "bg-purple-400 shadow-purple-500/50" : "bg-amber-500")} />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">BYOC: {hasBucket ? 'LINKED' : 'TEMP_MODE'}</span>
        </div>
      </div>

      {/* TEMP BUCKET COUNTDOWN */}
      {timeLeft && (
        <div className="absolute top-6 right-6 text-right pointer-events-none">
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Bucket Expiry</p>
          <p className="text-xl font-mono text-amber-500/80 font-bold tabular-nums tracking-tighter">{timeLeft}</p>
        </div>
      )}

      {/* TRUTH SHOWER: REAL EGYPTIAN CONVERSION LOGS */}
      {confession && (
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-[#111]/90 backdrop-blur-xl border-l-4 border-cyan-500 p-5 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-[0.3em] font-bold">Egyptian Logic Stream</span>
              <span className="text-[9px] font-mono text-white/20 uppercase">Real-Time Conversion</span>
            </div>
            <p className="text-sm font-medium text-white/90 leading-relaxed font-serif italic">
              "{confession}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}