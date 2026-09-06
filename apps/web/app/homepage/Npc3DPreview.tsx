'use client';

import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

function NpcAvatar({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const chestGlow = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const motion = reducedMotion ? 0 : 1;

    if (root.current) {
      root.current.position.y = Math.sin(t * 1.35) * 0.035 * motion;
      root.current.rotation.y = Math.sin(t * 0.42) * 0.06 * motion;
    }

    if (head.current) {
      const thinkingTilt = state === 'thinking' ? -0.12 : state === 'listening' ? 0.08 : 0;
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, thinkingTilt, 5, delta);
      head.current.rotation.y = THREE.MathUtils.damp(
        head.current.rotation.y,
        (state === 'listening' ? -0.12 : Math.sin(t * 0.55) * 0.04 * motion),
        4,
        delta,
      );
    }

    if (rightArm.current) {
      const wave = state === 'wave' ? -1.15 + Math.sin(t * 10) * 0.3 : -0.16;
      rightArm.current.rotation.z = THREE.MathUtils.damp(rightArm.current.rotation.z, wave, 7, delta);
      rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, state === 'wave' ? -0.45 : 0, 7, delta);
    }

    if (halo.current && !reducedMotion) {
      halo.current.rotation.z += delta * (state === 'thinking' ? 1.2 : 0.28);
    }

    if (chestGlow.current) {
      const target = state === 'speaking' ? 3.4 : state === 'thinking' ? 2.6 : 1.5;
      chestGlow.current.emissiveIntensity = THREE.MathUtils.damp(
        chestGlow.current.emissiveIntensity,
        target,
        5,
        delta,
      );
    }
  });

  const eyeColor = state === 'thinking' ? '#f0abfc' : state === 'speaking' ? '#67e8f9' : '#a5f3fc';

  return (
    <group ref={root} position={[0, 0.05, 0]}>
      <group position={[0, 1.75, 0]} ref={head}>
        <mesh>
          <sphereGeometry args={[0.44, 32, 24]} />
          <meshStandardMaterial color="#d7e7f3" metalness={0.58} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.01, 0.39]} scale={[1.05, 0.65, 0.18]}>
          <sphereGeometry args={[0.34, 32, 20]} />
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.16} />
        </mesh>
        <mesh position={[-0.13, 0.03, 0.445]}>
          <sphereGeometry args={[0.045, 18, 18]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={4} toneMapped={false} />
        </mesh>
        <mesh position={[0.13, 0.03, 0.445]}>
          <sphereGeometry args={[0.045, 18, 18]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={4} toneMapped={false} />
        </mesh>
        <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, -0.08]}>
          <torusGeometry args={[0.58, 0.012, 12, 72]} />
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>

      <mesh position={[0, 1.03, 0]} scale={[0.9, 1.18, 0.58]}>
        <sphereGeometry args={[0.62, 32, 24]} />
        <meshStandardMaterial color="#182033" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.1, 0.53]}>
        <circleGeometry args={[0.18, 32]} />
        <meshStandardMaterial
          ref={chestGlow}
          color="#67e8f9"
          emissive="#0891b2"
          emissiveIntensity={1.5}
          metalness={0.4}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      <group position={[-0.72, 1.15, 0]} rotation={[0, 0, 0.18]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.78, 18]} />
          <meshStandardMaterial color="#26344e" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#9bdce8" metalness={0.55} roughness={0.22} />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.72, 1.15, 0]} rotation={[0, 0, -0.16]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.78, 18]} />
          <meshStandardMaterial color="#26344e" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#9bdce8" metalness={0.55} roughness={0.22} />
        </mesh>
      </group>

      <mesh position={[-0.28, 0.27, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.95, 18]} />
        <meshStandardMaterial color="#1f2a40" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position={[0.28, 0.27, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.95, 18]} />
        <meshStandardMaterial color="#1f2a40" metalness={0.8} roughness={0.32} />
      </mesh>
    </group>
  );
}

function Stage({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (ringA.current) ringA.current.rotation.z += delta * 0.12;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.08;
  });

  return (
    <>
      <color attach="background" args={['#050814']} />
      <fog attach="fog" args={['#050814', 5, 11]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#dbeafe" />
      <pointLight position={[-3, 2.4, 2]} intensity={24} distance={7} color="#7c3aed" />
      <pointLight position={[3, 1.3, 1.5]} intensity={18} distance={6} color="#06b6d4" />

      <group position={[0, -1.15, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.25, 2.6, 0.18, 64]} />
          <meshStandardMaterial color="#0b1222" metalness={0.74} roughness={0.32} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <torusGeometry args={[1.65, 0.025, 10, 96]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <gridHelper args={[8, 22, '#334155', '#172033']} position={[0, 0.04, 0]} />
      </group>

      <mesh ref={ringA} position={[0, 0.65, -1.35]} rotation={[0, 0, 0.35]}>
        <torusGeometry args={[1.75, 0.012, 8, 96]} />
        <meshBasicMaterial color="#4c1d95" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ringB} position={[0, 0.65, -1.3]} rotation={[0.2, 0.4, -0.6]}>
        <torusGeometry args={[2.05, 0.008, 8, 96]} />
        <meshBasicMaterial color="#155e75" transparent opacity={0.62} />
      </mesh>

      <NpcAvatar state={state} reducedMotion={reducedMotion} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3.7}
        maxDistance={6.3}
        minPolarAngle={0.8}
        maxPolarAngle={1.75}
        target={[0, 0.75, 0]}
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
    <div className="flex h-full min-h-[420px] items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(76,29,149,0.32),transparent_42%),#050814] p-8 text-center">
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

function demoReply(message: string, memory: string[]) {
  const text = message.toLowerCase();
  if (text.includes('remember') || text.includes('memory')) {
    return memory.length
      ? `In this preview I remember ${memory.length} detail${memory.length === 1 ? '' : 's'} from our session: ${memory.slice(-2).join(' · ')}`
      : 'My memory layer can retain facts, choices, and relationship context. Tell me “my name is …” or “I like …” and I’ll remember it for this demo session.';
  }
  if (text.includes('action') || text.includes('move') || text.includes('wave')) {
    return 'Actions connect dialogue to animation and world events. I can wave here now; production NPCs can trigger scene behaviors, emotes, tools, and game logic.';
  }
  if (text.includes('personality') || text.includes('trait')) {
    return 'A personality profile controls tone, goals, boundaries, backstory, and behavioral tendencies so each NPC can respond consistently instead of feeling like a generic chatbot.';
  }
  if (text.includes('voice') || text.includes('speak')) {
    return 'The NPC stack supports voice and realtime expression hooks. This public homepage preview stays silent so it does not spend API credits without your permission.';
  }
  if (text.includes('build') || text.includes('create')) {
    return 'Open NPC AI SIM to build the real version: define a character, place it in a 3D scene, connect behavior and memory, then test the interaction live.';
  }
  if (text.includes('hello') || text.includes('hi')) {
    return 'Hey. I’m Nova — the interactive NPC preview. Drag the 3D view, ask about memory or personality, or trigger an action.';
  }
  return 'I’m a safe local demo of the NPC experience. Try asking about memory, personality, voice, actions, or how to build a character.';
}

function extractMemory(message: string): string | null {
  const compact = message.trim().replace(/\s+/g, ' ');
  const nameMatch = compact.match(/\bmy name is\s+([a-z][a-z '-]{0,30})/i);
  if (nameMatch?.[1]) return `Name: ${nameMatch[1].trim()}`;

  const likeMatch = compact.match(/\bi (?:like|love|prefer)\s+(.{2,50})/i);
  if (likeMatch?.[1]) return `Preference: ${likeMatch[1].replace(/[.!?]+$/, '').trim()}`;

  return null;
}

export default function Npc3DPreview({ iframeLabel = 'Interactive 3D AI NPC preview' }: Npc3DPreviewProps) {
  const reducedMotion = useReducedMotion();
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [npcState, setNpcState] = useState<NpcState>('idle');
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'npc', text: 'Hi — I’m Nova. Drag the 3D view or ask me how NPC memory and behavior work.' },
  ]);
  const timerIds = useRef<number[]>([]);
  const nextMessageId = useRef(2);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const supported = Boolean(
      window.WebGL2RenderingContext && canvas.getContext('webgl2')
        ? true
        : canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
    );
    setWebglSupported(supported);
  }, []);

  useEffect(() => {
    return () => {
      timerIds.current.forEach((id) => window.clearTimeout(id));
      timerIds.current = [];
    };
  }, []);

  const remember = useCallback((message: string) => {
    const fact = extractMemory(message);
    if (!fact) return;
    setMemory((current) => (current.includes(fact) ? current : [...current, fact].slice(-5)));
  }, []);

  const queueNpcReply = useCallback(
    (userText: string) => {
      setNpcState('thinking');
      const delay = reducedMotion ? 100 : 480;
      const replyTimer = window.setTimeout(() => {
        setMessages((current) => [
          ...current.slice(-5),
          { id: nextMessageId.current++, role: 'npc', text: demoReply(userText, memory) },
        ]);
        setNpcState('speaking');

        const idleTimer = window.setTimeout(() => setNpcState('idle'), reducedMotion ? 300 : 1700);
        timerIds.current.push(idleTimer);
      }, delay);
      timerIds.current.push(replyTimer);
    },
    [memory, reducedMotion],
  );

  const sendMessage = useCallback(
    (raw: string) => {
      const message = raw.trim().slice(0, 240);
      if (!message) return;
      remember(message);
      setMessages((current) => [...current.slice(-5), { id: nextMessageId.current++, role: 'user', text: message }]);
      setInput('');
      setNpcState('listening');
      queueNpcReply(message);
    },
    [queueNpcReply, remember],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  const triggerWave = () => {
    setNpcState('wave');
    const id = window.setTimeout(() => setNpcState('idle'), reducedMotion ? 350 : 1700);
    timerIds.current.push(id);
  };

  const stateLabel = useMemo(() => {
    if (npcState === 'wave') return 'Performing action';
    return npcState.charAt(0).toUpperCase() + npcState.slice(1);
  }, [npcState]);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#050814] shadow-[0_30px_100px_rgba(8,47,73,0.28)]"
      aria-label={iframeLabel}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_88%_24%,rgba(126,34,206,0.2),transparent_38%)]" />

      <div className="relative grid min-h-[680px] lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="relative min-h-[520px] overflow-hidden border-b border-white/10 lg:min-h-[680px] lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            Live 3D Preview
          </div>

          <div className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 backdrop-blur-xl" aria-live="polite">
            {stateLabel}
          </div>

          <div className="absolute bottom-5 left-5 z-20 max-w-xs rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Nova · AI NPC</p>
            <h2 className="mt-2 text-2xl font-black text-white">A real 3D character preview.</h2>
            <p className="mt-2 text-xs leading-5 text-white/55">Drag to orbit. Scroll to zoom. Trigger a behavior or talk to the demo personality.</p>
          </div>

          {webglSupported === null ? (
            <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-white/45">Starting 3D renderer…</div>
          ) : webglSupported ? (
            <ThreePreviewBoundary fallback={<WebGLFallback />}>
              <Canvas
                camera={{ position: [0, 1.25, 5.1], fov: 38, near: 0.1, far: 30 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Stage state={npcState} reducedMotion={reducedMotion} />
              </Canvas>
            </ThreePreviewBoundary>
          ) : (
            <WebGLFallback />
          )}
        </section>

        <aside className="relative flex flex-col p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Personality', 'Traits + goals', '◉'],
              ['Memory', `${memory.length} session facts`, '◆'],
              ['Voice', 'Realtime-ready', '≋'],
              ['Behavior', stateLabel, '✦'],
            ].map(([title, value, icon]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-300">
                  <span aria-hidden="true">{icon}</span>{title}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-white/65">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Conversation demo</p>
              <p className="mt-1 text-xs text-white/40">Local preview · no API credits used</p>
            </div>
            <button
              type="button"
              onClick={triggerWave}
              className="rounded-xl border border-purple-400/25 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              Wave 👋
            </button>
          </div>

          <div className="mt-4 flex min-h-[230px] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3" aria-live="polite" aria-label="NPC demo conversation">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${
                  message.role === 'npc'
                    ? 'self-start border border-cyan-400/10 bg-cyan-400/[0.07] text-cyan-50/85'
                    : 'self-end bg-purple-500/15 text-purple-50/90'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-cyan-400/30 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <label htmlFor="npc-demo-message" className="sr-only">Message Nova</label>
            <input
              id="npc-demo-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={240}
              placeholder="Ask Nova something…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Send
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
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
              Docs
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
