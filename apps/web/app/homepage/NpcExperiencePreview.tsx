'use client';

import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  Component,
  Suspense,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type NpcState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'wave' | 'thumbsup' | 'dance';
type ChatMessage = { id: number; role: 'npc' | 'user'; text: string };

type Props = { iframeLabel?: string };

const MODEL_URL = '/models/npc/RobotExpressive.glb';

const BEHAVIORS: ReadonlyArray<{ label: string; state: NpcState }> = [
  { label: 'Wave', state: 'wave' },
  { label: 'Thumbs up', state: 'thumbsup' },
  { label: 'Dance', state: 'dance' },
  { label: 'Listen', state: 'listening' },
];

const QUICK_PROMPTS = [
  'What can you remember?',
  'Show me an action',
  'How do NPC personalities work?',
] as const;

function stateAccent(state: NpcState) {
  if (state === 'thinking') return '#e879f9';
  if (state === 'speaking') return '#22d3ee';
  if (state === 'listening') return '#60a5fa';
  if (state === 'dance') return '#f472b6';
  if (state === 'thumbsup') return '#34d399';
  if (state === 'wave') return '#a78bfa';
  return '#67e8f9';
}

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

function clipForState(state: NpcState) {
  if (state === 'wave') return 'Wave';
  if (state === 'thumbsup') return 'ThumbsUp';
  if (state === 'dance') return 'Dance';
  if (state === 'listening') return 'Standing';
  return 'Idle';
}

function RiggedNpc({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const gltf = useGLTF(MODEL_URL);
  const model = gltf.scene;
  const { actions } = useAnimations(gltf.animations, model);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const face = useMemo(() => model.getObjectByName('Head_4') as THREE.Mesh | undefined, [model]);

  const normalized = useMemo(() => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? 3.25 / size.y : 1;
    return {
      scale,
      offset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
    };
  }, [model]);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true;
      }
    });
  }, [model]);

  useEffect(() => {
    const name = clipForState(state);
    const next = actions[name];
    if (!next) return;

    const previous = currentAction.current;
    if (previous && previous !== next) previous.fadeOut(0.22);

    next.reset().setEffectiveTimeScale(reducedMotion ? 0.55 : 1).setEffectiveWeight(1);
    const oneShot = state === 'wave' || state === 'thumbsup';
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
    next.clampWhenFinished = oneShot;
    next.fadeIn(0.22).play();
    currentAction.current = next;

    return () => {
      if (currentAction.current === next) next.fadeOut(0.18);
    };
  }, [actions, reducedMotion, state]);

  useEffect(() => {
    const influences = face?.morphTargetInfluences;
    const dictionary = face?.morphTargetDictionary;
    if (!influences || !dictionary) return;

    for (const [name, index] of Object.entries(dictionary)) {
      const key = name.toLowerCase();
      let value = 0;
      if (state === 'thinking' && key.includes('sad')) value = 0.16;
      if (state === 'speaking' && key.includes('surpr')) value = 0.22;
      if ((state === 'wave' || state === 'thumbsup') && key.includes('surpr')) value = 0.1;
      influences[index] = reducedMotion ? Math.min(value, 0.08) : value;
    }
  }, [face, reducedMotion, state]);

  return (
    <group position={[0, -1.18, 0]} scale={normalized.scale}>
      <primitive object={model} position={normalized.offset} />
    </group>
  );
}

function LoadingNpc() {
  return (
    <group position={[0, 0.35, 0]}>
      <mesh>
        <capsuleGeometry args={[0.62, 1.55, 10, 24]} />
        <meshStandardMaterial color="#18243a" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.48, 32, 24]} />
        <meshStandardMaterial color="#dbeafe" metalness={0.42} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.3, 0.62]}>
        <sphereGeometry args={[0.13, 28, 20]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Scene({ state, reducedMotion }: { state: NpcState; reducedMotion: boolean }) {
  const accent = stateAccent(state);
  return (
    <>
      <color attach="background" args={['#030611']} />
      <fog attach="fog" args={['#030611', 5.5, 12]} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#dbeafe', '#070b16', 1.35]} />
      <directionalLight position={[3.5, 5, 4]} intensity={3.1} color="#fff7ed" />
      <pointLight position={[-3.1, 2.4, 2.1]} intensity={28} distance={7} color="#7c3aed" />
      <pointLight position={[3.2, 1.3, 2]} intensity={22} distance={6} color="#06b6d4" />
      <pointLight position={[0, 1.2, -2]} intensity={18} distance={5} color={accent} />

      {!reducedMotion && (
        <Sparkles count={52} scale={[6, 4.3, 4.5]} size={1.3} speed={0.14} color="#67e8f9" opacity={0.42} />
      )}

      <group position={[0, -1.2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.35, 2.68, 0.18, 64]} />
          <meshStandardMaterial color="#09111f" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
          <torusGeometry args={[1.72, 0.026, 12, 96]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3.7} toneMapped={false} />
        </mesh>
        <gridHelper args={[8, 24, '#334155', '#111827']} position={[0, 0.04, 0]} />
      </group>

      <mesh position={[0, 0.75, -1.62]} rotation={[0, 0, 0.34]}>
        <torusGeometry args={[2.04, 0.012, 8, 96]} />
        <meshBasicMaterial color="#6d28d9" transparent opacity={0.58} />
      </mesh>
      <mesh position={[0, 0.75, -1.54]} rotation={[0.2, 0.45, -0.62]}>
        <torusGeometry args={[2.28, 0.009, 8, 96]} />
        <meshBasicMaterial color="#0e7490" transparent opacity={0.5} />
      </mesh>

      <Suspense fallback={<LoadingNpc />}>
        <RiggedNpc state={state} reducedMotion={reducedMotion} />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={3.7}
        maxDistance={6.1}
        minPolarAngle={0.7}
        maxPolarAngle={1.68}
        minAzimuthAngle={-0.95}
        maxAzimuthAngle={0.95}
        target={[0, 0.55, 0]}
      />
    </>
  );
}

class PreviewBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Fallback() {
  return (
    <div className="flex h-full min-h-[570px] items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(76,29,149,0.32),transparent_42%),#050814] p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl">🤖</div>
        <h3 className="text-xl font-bold text-white">3D preview unavailable</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">WebGL could not start on this device. The full NPC editor is still available.</p>
        <Link href="/wonder-build/playcanvas" className="mt-5 inline-flex rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950">Open NPC AI SIM →</Link>
      </div>
    </div>
  );
}

function learnFacts(message: string) {
  const compact = message.trim().replace(/\s+/g, ' ');
  const facts: string[] = [];
  const name = compact.match(/\bmy name is\s+([a-z][a-z '-]{0,30})/i)?.[1]?.trim();
  const preference = compact.match(/\bi (?:like|love|prefer)\s+(.{2,50})/i)?.[1]?.replace(/[.!?]+$/, '').trim();
  if (name) facts.push(`Name: ${name}`);
  if (preference) facts.push(`Preference: ${preference}`);
  return facts;
}

function replyFor(message: string, memory: string[]) {
  const lower = message.toLowerCase();
  const name = memory.find((fact) => fact.startsWith('Name:'))?.slice(5).trim();
  if (/\bmy name is\b/i.test(message) && name) return `Nice to meet you, ${name}. I remembered that locally for this preview session.`;
  if (lower.includes('remember') || lower.includes('memory')) {
    return memory.length
      ? `I remember ${memory.slice(-3).join(' · ')}. This demo memory stays in the page session.`
      : 'Try saying “my name is …” or “I like …”. I’ll remember it locally so you can see the memory behavior.';
  }
  if (lower.includes('action') || lower.includes('move') || lower.includes('wave')) return 'My behavior state can trigger real skeletal animation. Try Wave, Thumbs up, or Dance beside the 3D viewport.';
  if (lower.includes('personality')) return 'Personality can hold traits, goals, boundaries, backstory, and relationship style so an NPC stays consistent across interactions.';
  if (lower.includes('voice') || lower.includes('speak')) return 'The production stack can connect voice and realtime expression. This public preview stays local so it never burns API credits.';
  if (lower.includes('hello') || lower.includes('hi')) return `Hey${name ? `, ${name}` : ''}. I’m Lyria. I’m a real rigged 3D character preview — try an animation or ask about memory.`;
  return `I’m Lyria${name ? `, ${name}` : ''}. Ask about memory, personality, voice, actions, or how the full NPC system works.`;
}

export default function NpcExperiencePreview({ iframeLabel = 'Interactive 3D AI NPC preview' }: Props) {
  const reducedMotion = useReducedMotion();
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [state, setState] = useState<NpcState>('idle');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'npc', text: 'Hi — I’m Lyria. Drag to orbit me, trigger a real animation, or ask how NPC memory works.' },
  ]);
  const nextId = useRef(2);
  const sequence = useRef(0);
  const timers = useRef<number[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const schedule = useCallback((token: number, fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((value) => value !== id);
      if (sequence.current === token) fn();
    }, delay);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebgl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, busy]);

  const trigger = useCallback((nextState: NpcState) => {
    if (busy) return;
    const token = ++sequence.current;
    setState(nextState);
    const duration = nextState === 'dance' ? 3400 : nextState === 'listening' ? 2100 : 1800;
    schedule(token, () => setState('idle'), reducedMotion ? 450 : duration);
  }, [busy, reducedMotion, schedule]);

  const send = useCallback((raw: string) => {
    if (busy) return;
    const message = raw.trim().slice(0, 240);
    if (!message) return;

    const learned = learnFacts(message);
    const nextMemory = [...memory];
    for (const fact of learned) if (!nextMemory.includes(fact)) nextMemory.push(fact);
    const boundedMemory = nextMemory.slice(-6);
    if (learned.length) setMemory(boundedMemory);

    setMessages((current) => [...current.slice(-7), { id: nextId.current++, role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    const token = ++sequence.current;
    setState('listening');
    schedule(token, () => setState('thinking'), reducedMotion ? 60 : 260);
    schedule(token, () => {
      setMessages((current) => [...current.slice(-7), { id: nextId.current++, role: 'npc', text: replyFor(message, boundedMemory) }]);
      setState('speaking');
      setBusy(false);
      schedule(token, () => setState('idle'), reducedMotion ? 300 : 1500);
    }, reducedMotion ? 160 : 760);
  }, [busy, memory, reducedMotion, schedule]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  const stateLabel = state === 'thumbsup' ? 'Thumbs up' : state.charAt(0).toUpperCase() + state.slice(1);
  const accent = stateAccent(state);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[#040711] shadow-[0_36px_120px_rgba(8,47,73,0.32)]" aria-label={iframeLabel}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.13),transparent_31%),radial-gradient(circle_at_90%_22%,rgba(126,34,206,0.2),transparent_39%)]" />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">NPC AI SIM · Live Product Preview</p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Meet Lyria — rigged, animated, state-aware.</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" /> Runtime online
        </div>
      </header>

      <div className="relative grid min-h-[720px] lg:grid-cols-[minmax(0,1.42fr)_minmax(350px,0.58fr)]">
        <section className="relative min-h-[570px] overflow-hidden border-b border-white/10 lg:min-h-[720px] lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-20 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/65 backdrop-blur-xl">Rigged GLB · skeletal animation</div>
          <div className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-xl" style={{ color: accent }} aria-live="polite">{stateLabel}</div>

          <div className="absolute bottom-5 left-5 right-5 z-20 space-y-3 sm:right-auto sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Interactive character viewport</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Drag to orbit. Scroll to zoom. The behavior controls drive actual animation clips in the rig, not a fake video or background image.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BEHAVIORS.map(({ label, state: behaviorState }) => (
                <button key={label} type="button" onClick={() => trigger(behaviorState)} disabled={busy} className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-bold text-white/65 backdrop-blur-xl transition hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  {label}
                </button>
              ))}
            </div>
          </div>

          {webgl === null ? (
            <div className="flex min-h-[570px] items-center justify-center text-sm text-white/45">Starting 3D renderer…</div>
          ) : webgl ? (
            <PreviewBoundary fallback={<Fallback />}>
              <Canvas camera={{ position: [0, 0.95, 5.1], fov: 35, near: 0.1, far: 30 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }} style={{ position: 'absolute', inset: 0 }}>
                <Scene state={state} reducedMotion={reducedMotion} />
              </Canvas>
            </PreviewBoundary>
          ) : <Fallback />}
        </section>

        <aside className="relative flex min-h-[640px] flex-col p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Personality', 'Traits + goals'],
              ['Voice', 'Realtime-ready'],
              ['Memory', memory.length ? `${memory.length} fact${memory.length === 1 ? '' : 's'} stored` : 'Session context'],
              ['Behavior', stateLabel],
            ].map(([title, value]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-cyan-300">{title}</p>
                <p className="mt-1.5 text-xs font-semibold text-white/65">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Conversation preview</p>
              <p className="mt-1 text-xs text-white/40">Local demo brain · zero API credits</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/40">{busy ? stateLabel : 'Ready'}</span>
          </div>

          <div ref={chatRef} className="mt-4 flex min-h-[245px] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3" aria-live="polite" aria-label="NPC demo conversation">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.role === 'npc' ? 'self-start border border-cyan-400/10 bg-cyan-400/[0.07] text-cyan-50/85' : 'self-end bg-purple-500/15 text-purple-50/90'}`}>
                {message.text}
              </div>
            ))}
            {busy && <div className="self-start rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-2 text-[10px] text-cyan-100/50">Lyria is {state === 'listening' ? 'listening' : 'thinking'}…</div>}
          </div>

          {memory.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Session memory">
              {memory.slice(-3).map((fact) => <span key={fact} className="rounded-full border border-purple-400/15 bg-purple-500/[0.07] px-2.5 py-1 text-[9px] font-semibold text-purple-100/60">{fact}</span>)}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} disabled={busy} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{prompt}</button>)}
          </div>

          <form onSubmit={submit} className="mt-3 flex gap-2">
            <label htmlFor="npc-preview-message" className="sr-only">Message Lyria</label>
            <input id="npc-preview-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={240} placeholder="Ask Lyria something…" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15" />
            <button type="submit" disabled={!input.trim() || busy} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Send</button>
          </form>

          <div className="mt-5 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-3 text-[10px] leading-5 text-amber-100/45">The homepage conversation is intentionally local. Enter NPC AI SIM to connect real AI, memory, voice, and scene-runtime services.</div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/wonder-build/playcanvas" className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Open NPC AI SIM →</Link>
            <Link href="/docs" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-bold text-white/65 transition hover:bg-white/[0.07] hover:text-white">NPC Docs</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
