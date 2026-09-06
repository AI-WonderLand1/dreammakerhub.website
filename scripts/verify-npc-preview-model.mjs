import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';

const MODEL_PATH = 'apps/web/public/models/npc/RobotExpressive.glb';
const EXPECTED_SHA256 = '047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319';
const REQUIRED_CLIPS = ['Idle', 'Standing', 'Wave', 'ThumbsUp', 'Dance'];

const bytes = await readFile(MODEL_PATH);
const digest = createHash('sha256').update(bytes).digest('hex');
if (digest !== EXPECTED_SHA256) {
  throw new Error(`NPC model SHA-256 mismatch: expected ${EXPECTED_SHA256}, received ${digest}`);
}

const io = new NodeIO();
const document = await io.read(MODEL_PATH);
const root = document.getRoot();
const clips = root.listAnimations().map((animation) => animation.getName());
const missing = REQUIRED_CLIPS.filter((name) => !clips.includes(name));

if (missing.length) {
  throw new Error(`NPC model is missing required animation clips: ${missing.join(', ')}. Available: ${clips.join(', ')}`);
}

const scenes = root.listScenes();
if (!scenes.length) {
  throw new Error('NPC model does not contain a renderable scene.');
}

console.log(`NPC model verified: ${bytes.byteLength} bytes; ${clips.length} animation clips; required runtime clips present.`);
