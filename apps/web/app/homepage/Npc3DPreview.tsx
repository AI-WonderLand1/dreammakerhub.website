'use client';

import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  Component,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type NpcState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'wave';
type ChatRole = 'npc' | 'user';

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
};

interface Npc3DPreviewProps {
  iframeLabel?: string;
}

const QUICK_PROMPTS = [
  'What can you remember?',
  'Show me an action',
  'How do NPC personalities work?',
];

const FEATURE_CARDS = [
  { title: 'Personality', value: 'Traits + goals', icon: '◉' },
  { title: 'Voice', value: 'Realtime-ready', icon: '≋' },
  { title: 'Memory', value: 'Session context', icon: '◆' },
  { title: 'Behavior', value: 'State-driven', icon: '✦' },
] as const;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  return reduced;
}

function useElementVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '180px 0px', threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function stateAccent(state: NpcState) {
  if (state === 'thinking') return '#e879f9';
  if (state === 'speaking') return '#22d3ee';
  if (state === 'listening') return '#60a5fa';
  if (state === 'wave') return '#a78bfa';
  return '#67e8f9';
}

function blinkScale(t: number, reducedMotion: boolean) {
  if (reducedMotion) return 1;
  const phase = t % 4.6;
  if (phase > 0.14) return 1;
  return Math.max(0.08, Math.abs(phase - 0.07) / 0.07);
}

function NpcAvatar({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const rightShoulder = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);
  const leftShoulder = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const chestGlow = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const motion = reducedMotion ? 0 : 1;

    if (root.current) {
      root.current.position.y = Math.sin(t * 1.2) * 0.028 * motion;
      root.current.rotation.y = Math.sin(t * 0.34) * 0.045 * motion;
      root.current.rotation.z = Math.sin(t * 0.58) * 0.008 * motion;
    }

    if (head.current) {
      const targetTilt = state === 'thinking' ? -0.12 : state === 'listening' ? 0.07 : 0;
      const targetTurn = state === 'listening' ? -0.1 : Math.sin(t * 0.48) * 0.035 * motion;
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, targetTilt, 5, delta);
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, targetTurn, 4, delta);
      head.current.rotation.x = THREE.MathUtils.damp(
        head.current.rotation.x,
        state === 'thinking' ? 0.07 : Math.sin(t * 0.37) * 0.015 * motion,
        4,
        delta,
      );
    }

    const blink = blinkScale(t, reducedMotion);
    if (leftEye.current) leftEye.current.scale.y = THREE.MathUtils.damp(leftEye.current.scale.y, blink, 20, delta);
    if (rightEye.current) rightEye.current.scale.y = THREE.MathUtils.damp(rightEye.current.scale.y, blink, 20, delta);

    if (mouth.current) {
      const target = state === 'speaking' && !reducedMotion ? 0.7 + Math.abs(Math.sin(t * 8.5)) * 1.35 : 0.58;
      mouth.current.scale.y = THREE.MathUtils.damp(mouth.current.scale.y, target, 14, delta);
    }

    if (rightShoulder.current) {
      const waveZ = state === 'wave' ? -1.05 + Math.sin(t * 8.5) * 0.16 : -0.12;
      const waveX = state === 'wave' ? -0.52 : 0.02;
      rightShoulder.current.rotation.z = THREE.MathUtils.damp(rightShoulder.current.rotation.z, waveZ, 7, delta);
      rightShoulder.current.rotation.x = THREE.MathUtils.damp(rightShoulder.current.rotation.x, waveX, 7, delta);
    }

    if (rightForearm.current) {
      const target = state === 'wave' ? -0.9 + Math.sin(t * 10) * 0.25 : -0.06;
      rightForearm.current.rotation.z = THREE.MathUtils.damp(rightForearm.current.rotation.z, target, 8, delta);
    }

    if (leftShoulder.current) {
      const listenPose = state === 'listening' ? 0.3 : 0.12;
      leftShoulder.current.rotation.z = THREE.MathUtils.damp(leftShoulder.current.rotation.z, listenPose, 5, delta);
    }

    if (halo.current && !reducedMotion) {
      halo.current.rotation.z += delta * (state === 'thinking' ? 1.15 : 0.23);
    }

    if (chestGlow.current) {
      const target = state === 'speaking' ? 4 : state === 'thinking' ? 3 : state === 'listening' ? 2.4 : 1.75;
      chestGlow.current.emissiveIntensity = THREE.MathUtils.damp(
        chestGlow.current.emissiveIntensity,
        target,
        6,
        delta,
      );
      chestGlow.current.color.set(stateAccent(state));
      chestGlow.current.emissive.set(stateAccent(state));
    }
  });

  const accent = stateAccent(state);

  return (
    <group ref={root} position={[0, -0.02, 0]}>
      {/* Head / synthetic face */}
      <group position={[0, 1.72, 0]} ref={head}>
        <mesh position={[0, 0.08, -0.08]} scale={[0.82, 0.92, 0.72]}>
          <sphereGeometry args={[0.52, 48, 36]} />
          <meshStandardMaterial color="#101827" metalness={0.83} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.01, 0.11]} scale={[0.72, 0.86, 0.64]}>
          <sphereGeometry args={[0.5, 48, 36]} />
          <meshStandardMaterial color="#e7d8d4" metalness={0.08} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.26, 0.31]} scale={[0.74, 0.24, 0.3]}>
          <sphereGeometry args={[0.5, 36, 20]} />
          <meshStandardMaterial color="#cad8e6" metalness={0.45} roughness={0.22} />
        </mesh>

        <mesh ref={leftEye} position={[-0.16, 0.04, 0.435]} scale={[1.15, 0.72, 0.5]}>
          <sphereGeometry args={[0.064, 24, 20]} />
          <meshStandardMaterial color="#07131d" roughness={0.16} />
        </mesh>
        <mesh ref={rightEye} position={[0.16, 0.04, 0.435]} scale={[1.15, 0.72, 0.5]}>
          <sphereGeometry args={[0.064, 24, 20]} />
          <meshStandardMaterial color="#07131d" roughness={0.16} />
        </mesh>
        <mesh position={[-0.16, 0.04, 0.485]}>
          <sphereGeometry args={[0.025, 20, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={5} toneMapped={false} />
        </mesh>
        <mesh position={[0.16, 0.04, 0.485]}>
          <sphereGeometry args={[0.025, 20, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={5} toneMapped={false} />
        </mesh>

        <mesh position={[-0.16, 0.14, 0.44]} rotation={[0, 0, -0.08]} scale={[1.2, 0.22, 0.35]}>
          <boxGeometry args={[0.17, 0.025, 0.025]} />
          <meshStandardMaterial color="#40373d" roughness={0.55} />
        </mesh>
        <mesh position={[0.16, 0.14, 0.44]} rotation={[0, 0, 0.08]} scale={[1.2, 0.22, 0.35]}>
          <boxGeometry args={[0.17, 0.025, 0.025]} />
          <meshStandardMaterial color="#40373d" roughness={0.55} />
        </mesh>

        <mesh position={[0, -0.07, 0.505]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.035, 0.09, 16]} />
          <meshStandardMaterial color="#d5c4c3" roughness={0.42} />
        </mesh>
        <mesh ref={mouth} position={[0, -0.22, 0.49]} scale={[1.5, 0.58, 0.45]}>
          <sphereGeometry args={[0.055, 24, 16]} />
          <meshStandardMaterial color="#6f3347" roughness={0.34} />
        </mesh>

        <mesh position={[-0.5, 0.03, -0.02]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.025, 10, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.86} roughness={0.2} />
        </mesh>
        <mesh position={[0.5, 0.03, -0.02]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.025, 10, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.86} roughness={0.2} />
        </mesh>

        <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, -0.3]}>
          <torusGeometry args={[0.69, 0.012, 12, 96]} />
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2.8} toneMapped={false} />
        </mesh>
      </group>

      {/* Neck and torso */}
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.42, 24]} />
        <meshStandardMaterial color="#26354d" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.83, 0]} scale={[0.9, 1.03, 0.5]}>
        <sphereGeometry args={[0.66, 44, 32]} />
        <meshStandardMaterial color="#18243a" metalness={0.78} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.72, 0.5]} scale={[1, 1.25, 0.18]}>
        <sphereGeometry args={[0.39, 32, 24]} />
        <meshStandardMaterial color="#d9e4ee" metalness={0.5} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.96, 0.555]}>
        <circleGeometry args={[0.145, 40]} />
        <meshStandardMaterial
          ref={chestGlow}
          color={accent}
          emissive={accent}
          emissiveIntensity={1.75}
          metalness={0.3}
          roughness={0.16}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.96, 0.568]} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.17, 0.205, 4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.14, 0]} scale={[0.52, 0.7, 0.42]}>
        <sphereGeometry args={[0.56, 36, 24]} />
        <meshStandardMaterial color="#121b2d" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Shoulder armor */}
      <mesh position={[-0.76, 0.94, 0]} rotation={[0, 0, -0.22]} scale={[1.2, 0.72, 0.9]}>
        <sphereGeometry args={[0.31, 28, 20]} />
        <meshStandardMaterial color="#33445f" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.76, 0.94, 0]} rotation={[0, 0, 0.22]} scale={[1.2, 0.72, 0.9]}>
        <sphereGeometry args={[0.31, 28, 20]} />
        <meshStandardMaterial color="#33445f" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Left arm */}
      <group ref={leftShoulder} position={[-0.72, 0.88, 0]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.125, 0.15, 0.68, 20]} />
          <meshStandardMaterial color="#26344e" metalness={0.76} roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.145, 22, 18]} />
          <meshStandardMaterial color="#7a8fa8" metalness={0.62} roughness={0.24} />
        </mesh>
        <group position={[0, -0.7, 0]} rotation={[0, 0, 0.04]}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.095, 0.12, 0.55, 18]} />
            <meshStandardMaterial color="#d9e4ee" metalness={0.38} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.62, 0.03]} scale={[0.75, 1, 0.55]}>
            <sphereGeometry args={[0.14, 22, 16]} />
            <meshStandardMaterial color="#e3d5d2" metalness={0.08} roughness={0.36} />
          </mesh>
        </group>
      </group>

      {/* Right arm with articulated wave */}
      <group ref={rightShoulder} position={[0.72, 0.88, 0]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.125, 0.15, 0.68, 20]} />
          <meshStandardMaterial color="#26344e" metalness={0.76} roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <sphereGeometry args={[0.145, 22, 18]} />
          <meshStandardMaterial color="#7a8fa8" metalness={0.62} roughness={0.24} />
        </mesh>
        <group ref={rightForearm} position={[0, -0.7, 0]} rotation={[0, 0, -0.06]}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.095, 0.12, 0.55, 18]} />
            <meshStandardMaterial color="#d9e4ee" metalness={0.38} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.62, 0.03]} scale={[0.75, 1, 0.55]}>
            <sphereGeometry args={[0.14, 22, 16]} />
            <meshStandardMaterial color="#e3d5d2" metalness={0.08} roughness={0.36} />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <mesh position={[-0.27, -0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 1.12, 20]} />
        <meshStandardMaterial color="#1d2b42" metalness={0.8} roughness={0.29} />
      </mesh>
      <mesh position={[0.27, -0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 1.12, 20]} />
        <meshStandardMaterial color="#1d2b42" metalness={0.8} roughness={0.29} />
      </mesh>
      <mesh position={[-0.27, -1.04, 0.12]} scale={[1.18, 0.58, 1.7]}>
        <sphereGeometry args={[0.15, 22, 16]} />
        <meshStandardMaterial color="#111827" metalness={0.82} roughness={0.27} />
      </mesh>
      <mesh position={[0.27, -1.04, 0.12]} scale={[1.18, 0.58, 1.7]}>
        <sphereGeometry args={[0.15, 22, 16]} />
        <meshStandardMaterial color="#111827" metalness={0.82} roughness={0.27} />
      </mesh>
    </group>
  );
}

function Stage({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const accent = stateAccent(state);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (ringA.current) ringA.current.rotation.z += delta * 0.1;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.07;
  });

  return (
    <>
      <color attach="background" args={['#040711']} />
      <fog attach="fog" args={['#040711', 5, 12]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#dbeafe', '#090b15', 1.2]} />
      <directionalLight position={[3.5, 5, 4]} intensity={2.8} color="#fff7ed" />
      <pointLight position={[-3, 2.5, 2]} intensity={28} distance={7} color="#7c3aed" />
      <pointLight position={[3.1, 1.4, 1.8]} intensity={22} distance={6} color="#06b6d4" />
      <pointLight position={[0, 1.2, -2]} intensity={15} distance={5} color={accent} />

      {!reducedMotion && (
        <Sparkles count={55} scale={[6, 4.3, 4.5]} size={1.4} speed={0.16} color="#67e8f9" opacity={0.45} />
      )}

      <group position={[0, -1.12, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.3, 2.62, 0.18, 64]} />
          <meshStandardMaterial color="#0a1120" metalness={0.76} roughness={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
          <torusGeometry args={[1.72, 0.026, 12, 96]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3.4} toneMapped={false} />
        </mesh>
        <gridHelper args={[8, 24, '#334155', '#141c2c']} position={[0, 0.04, 0]} />
      </group>

      <mesh ref={ringA} position={[0, 0.68, -1.45]} rotation={[0, 0, 0.35]}>
        <torusGeometry args={[1.88, 0.012, 8, 96]} />
        <meshBasicMaterial color="#6d28d9" transparent opacity={0.66} />
      </mesh>
      <mesh ref={ringB} position={[0, 0.68, -1.38]} rotation={[0.2, 0.45, -0.62]}>
        <torusGeometry args={[2.15, 0.009, 8, 96]} />
        <meshBasicMaterial color="#0e7490" transparent opacity={0.58} />
      </mesh>

      <NpcAvatar state={state} reducedMotion={reducedMotion} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={3.65}
        maxDistance={6.15}
        minPolarAngle={0.78}
        maxPolarAngle={1.68}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
        target={[0, 0.62, 0]}
      />
    </>
  );
}

class ThreePreviewBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function WebGLFallback() {
  return (
    <div className="flex h-full min-h-[520px] items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(76,29,149,0.32),transparent_42%),#050814] p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl">🤖</div>
        <h3 className="text-xl font-bold text-white">3D preview unavailable</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">
          This browser or device could not start WebGL. You can still open the full NPC editor.
        </p>
        <Link
          href="/wonder-build/playcanvas"
          className="mt-5 inline-flex rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
        >
          Open NPC AI SIM →
        </Link>
      </div>
    </div>
  );
}

function extractMemoryFacts(message: string): string[] {
  const compact = message.trim().replace(/\s+/g, ' ');
  const facts: string[] = [];
  const nameMatch = compact.match(/\bmy name is\s+([a-z][a-z '-]{0,30})/i);
  if (nameMatch?.[1]) facts.push(`Name: ${nameMatch[1].trim()}`);

  const likeMatch = compact.match(/\bi (?:like|love|prefer)\s+(.{2,50})/i);
  if (likeMatch?.[1]) facts.push(`Preference: ${likeMatch[1].replace(/[.!?]+$/, '').trim()}`);

  return facts;
}

function demoReply(message: string, memory: string[]) {
  const text = message.toLowerCase();
  const name = memory.find((fact) => fact.startsWith('Name:'))?.replace(/^Name:\s*/, '');

  if (/\bmy name is\b/i.test(message) && name) {
    return `Nice to meet you, ${name}. I stored your name in this browser session so the preview can demonstrate NPC memory without sending it to an AI provider.`;
  }
  if (text.includes('remember') || text.includes('memory')) {
    return memory.length
      ? `I currently remember ${memory.length} session detail${memory.length === 1 ? '' : 's'}: ${memory.slice(-3).join(' · ')}`
      : 'My memory layer can retain facts, choices, and relationship context. Try saying “my name is …” or “I like …” and I’ll remember it for this preview session.';
  }
  if (text.includes('action') || text.includes('move') || text.includes('wave')) {
    return 'Dialogue can drive animation and world events. Use the behavior controls beside me to see the character state machine change in real time.';
  }
  if (text.includes('personality') || text.includes('trait')) {
    return 'Personality controls tone, goals, boundaries, backstory, and behavioral tendencies so an NPC can stay consistent instead of acting like a generic chatbot.';
  }
  if (text.includes('voice') || text.includes('speak')) {
    return 'The production NPC stack can connect speech and realtime expression. This homepage preview stays local and silent so it never spends API credits behind your back.';
  }
  if (text.includes('build') || text.includes('create')) {
    return 'Open NPC AI SIM to build the full character: define personality, place the NPC in a 3D scene, connect memory and behavior, then test the interaction live.';
  }
  if (text.includes('hello') || text.includes('hi')) {
    return `Hey${name ? `, ${name}` : ''}. I’m Lyria — a live WebGL NPC preview. Orbit the view, trigger a behavior, or ask about memory, voice, and personality.`;
  }
  return `I’m Lyria, a local preview of the NPC runtime${name ? `, ${name}` : ''}. Ask about memory, personality, voice, actions, or how to build a character.`;
}

export default function Npc3DPreview({ iframeLabel = 'Interactive 3D AI NPC preview' }: Npc3DPreviewProps) {
  const reducedMotion = useReducedMotion();
  const { ref: previewRef, visible } = useElementVisible<HTMLDivElement>();
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [npcState, setNpcState] = useState<NpcState>('idle');
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState<string[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'npc', text: 'Hi — I’m Lyria. Orbit the 3D view, trigger a behavior, or ask me how NPC memory works.' },
  ]);
  const timerIds = useRef<number[]>([]);
  const nextMessageId = useRef(2);
  const chatScroll = useRef<HTMLDivElement>(null);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timerIds.current = timerIds.current.filter((timerId) => timerId !== id);
      callback();
    }, delay);
    timerIds.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const supported = Boolean(
        (window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'),
      );
      setWebglSupported(supported);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      timerIds.current.forEach((id) => window.clearTimeout(id));
      timerIds.current = [];
    };
  }, []);

  useEffect(() => {
    const node = chatScroll.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  const queueNpcReply = useCallback(
    (userText: string, memoryForReply: string[]) => {
      setChatBusy(true);
      setNpcState('listening');

      schedule(() => setNpcState('thinking'), reducedMotion ? 40 : 220);
      schedule(
        () => {
          setMessages((current) => [
            ...current.slice(-6),
            { id: nextMessageId.current++, role: 'npc', text: demoReply(userText, memoryForReply) },
          ]);
          setNpcState('speaking');
          setChatBusy(false);
          schedule(() => setNpcState('idle'), reducedMotion ? 260 : 1550);
        },
        reducedMotion ? 120 : 720,
      );
    },
    [reducedMotion, schedule],
  );

  const sendMessage = useCallback(
    (raw: string) => {
      if (chatBusy) return;
      const message = raw.trim().slice(0, 240);
      if (!message) return;

      const newFacts = extractMemoryFacts(message);
      const nextMemory = [...memory];
      for (const fact of newFacts) {
        if (!nextMemory.includes(fact)) nextMemory.push(fact);
      }
      const boundedMemory = nextMemory.slice(-6);
      if (newFacts.length) setMemory(boundedMemory);

      setMessages((current) => [
        ...current.slice(-6),
        { id: nextMessageId.current++, role: 'user', text: message },
      ]);
      setInput('');
      queueNpcReply(message, boundedMemory);
    },
    [chatBusy, memory, queueNpcReply],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  const triggerState = useCallback(
    (state: NpcState) => {
      if (chatBusy) return;
      setNpcState(state);
      if (state !== 'idle') schedule(() => setNpcState('idle'), reducedMotion ? 320 : 1650);
    },
    [chatBusy, reducedMotion, schedule],
  );

  const stateLabel = useMemo(() => {
    if (npcState === 'wave') return 'Performing action';
    return npcState.charAt(0).toUpperCase() + npcState.slice(1);
  }, [npcState]);

  const memoryLabel = memory.length ? `${memory.length} session fact${memory.length === 1 ? '' : 's'}` : 'No facts yet';

  return (
    <div
      ref={previewRef}
      className="relative overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[#040711] shadow-[0_36px_120px_rgba(8,47,73,0.32)]"
      aria-label={iframeLabel}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.13),transparent_31%),radial-gradient(circle_at_90%_22%,rgba(126,34,206,0.21),transparent_39%)]" />

      <div className="relative border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">NPC AI SIM · Product Preview</p>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Meet Lyria — a realtime 3D AI NPC.</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            NPC Runtime Online
          </div>
        </div>
      </div>

      <div className="relative grid min-h-[720px] lg:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.65fr)]">
        <section className="relative min-h-[540px] overflow-hidden border-b border-white/10 lg:min-h-[720px] lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65 backdrop-blur-xl">
            <span className="text-cyan-300">◉</span> WebGL Character
          </div>

          <div className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl" aria-live="polite">
            {stateLabel}
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-col gap-3 sm:right-auto sm:max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-black/58 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Lyria · Synthetic Companion</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Drag to orbit the character. Scroll to zoom. Her face, eyes, core, head pose, and arm rig react to the NPC state machine.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['Wave', 'wave' as NpcState],
                ['Listen', 'listening' as NpcState],
                ['Think', 'thinking' as NpcState],
                ['Speak', 'speaking' as NpcState],
              ].map(([label, state]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => triggerState(state)}
                  disabled={chatBusy}
                  className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-bold text-white/65 backdrop-blur-xl transition hover:border-cyan-400/35 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {webglSupported === null ? (
            <div className="flex h-full min-h-[540px] items-center justify-center text-sm text-white/45">Starting 3D renderer…</div>
          ) : webglSupported ? (
            <ThreePreviewBoundary fallback={<WebGLFallback />}>
              <Canvas
                camera={{ position: [0, 0.95, 5.25], fov: 36, near: 0.1, far: 30 }}
                dpr={[1, 1.6]}
                frameloop={visible && !reducedMotion ? 'always' : 'demand'}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.12;
                }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Stage state={npcState} reducedMotion={reducedMotion} />
              </Canvas>
            </ThreePreviewBoundary>
          ) : (
            <WebGLFallback />
          )}
        </section>

        <aside className="relative flex min-h-[640px] flex-col p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURE_CARDS.map((feature) => {
              const value = feature.title === 'Memory' ? memoryLabel : feature.title === 'Behavior' ? stateLabel : feature.value;
              return (
                <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-300">
                    <span aria-hidden="true">{feature.icon}</span>{feature.title}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-white/65">{value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Conversation preview</p>
              <p className="mt-1 text-xs text-white/40">Local demo brain · zero API credits</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/40">
              {chatBusy ? 'Processing' : 'Ready'}
            </span>
          </div>

          <div
            ref={chatScroll}
            className="mt-4 flex min-h-[245px] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3"
            aria-live="polite"
            aria-label="NPC demo conversation"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${
                  message.role === 'npc'
                    ? 'self-start border border-cyan-400/10 bg-cyan-400/[0.07] text-cyan-50/85'
                    : 'self-end bg-purple-500/15 text-purple-50/90'
                }`}
              >
                {message.text}
              </div>
            ))}
            {chatBusy && (
              <div className="self-start rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-2 text-[10px] text-cyan-100/50">
                Lyria is {npcState === 'listening' ? 'listening' : 'thinking'}…
              </div>
            )}
          </div>

          {memory.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Session memory">
              {memory.slice(-3).map((fact) => (
                <span key={fact} className="rounded-full border border-purple-400/15 bg-purple-500/[0.07] px-2.5 py-1 text-[9px] font-semibold text-purple-100/60">
                  {fact}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={chatBusy}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <label htmlFor="npc-demo-message" className="sr-only">Message Lyria</label>
            <input
              id="npc-demo-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={240}
              placeholder="Ask Lyria something…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatBusy}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Send
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-3 text-[10px] leading-5 text-amber-100/45">
            This homepage demo runs locally. The full NPC AI SIM can connect real model, memory, voice, animation, and scene-runtime services after the user explicitly enters the product.
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/wonder-build/playcanvas"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              Open NPC AI SIM →
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-bold text-white/65 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              NPC Docs
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
