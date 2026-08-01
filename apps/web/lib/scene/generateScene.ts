import type { SceneCamera, SceneLight, SceneSkybox } from "./schema";

export type ScenePrimitive = "box" | "sphere" | "cylinder" | "plane" | "capsule" | "cone";

export type GeneratedSceneMaterial = {
  id: string;
  color: [number, number, number];
  metalness: number;
  roughness: number;
  emissive?: [number, number, number];
};

export type GeneratedSceneObject = {
  id: string;
  name: string;
  type: ScenePrimitive;
  meshUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material?: string;
};

export type GeneratedScene = {
  name: string;
  description: string;
  objects: GeneratedSceneObject[];
  materials: GeneratedSceneMaterial[];
  lights: SceneLight[];
  camera: SceneCamera;
  sky: { type: "color" | "gradient"; color: [number, number, number] };
  skybox?: SceneSkybox;
};

type SceneTheme = {
  sky: [number, number, number];
  ground: [number, number, number];
  palette: [number, number, number][];
};

const THEMES: Record<string, SceneTheme> = {
  city: {
    sky: [0.05, 0.08, 0.16],
    ground: [0.12, 0.12, 0.15],
    palette: [
      [0.3, 0.5, 0.8],
      [0.6, 0.65, 0.75],
      [0.35, 0.4, 0.5],
      [0.9, 0.35, 0.2],
      [0.15, 0.2, 0.35],
    ],
  },
  mountain: {
    sky: [0.55, 0.7, 0.85],
    ground: [0.28, 0.42, 0.25],
    palette: [
      [0.55, 0.42, 0.3],
      [0.75, 0.75, 0.78],
      [0.25, 0.4, 0.28],
      [0.7, 0.62, 0.5],
    ],
  },
  forest: {
    sky: [0.45, 0.6, 0.5],
    ground: [0.18, 0.32, 0.16],
    palette: [
      [0.2, 0.42, 0.22],
      [0.15, 0.3, 0.2],
      [0.6, 0.5, 0.3],
      [0.4, 0.55, 0.3],
    ],
  },
  ocean: {
    sky: [0.1, 0.45, 0.6],
    ground: [0.05, 0.25, 0.4],
    palette: [
      [0.1, 0.35, 0.55],
      [0.6, 0.75, 0.8],
      [0.9, 0.75, 0.5],
      [0.15, 0.4, 0.55],
    ],
  },
  space: {
    sky: [0.02, 0.02, 0.06],
    ground: [0.05, 0.05, 0.08],
    palette: [
      [0.7, 0.4, 0.9],
      [0.9, 0.7, 0.3],
      [0.3, 0.6, 0.9],
      [0.9, 0.5, 0.5],
    ],
  },
  desert: {
    sky: [0.85, 0.7, 0.5],
    ground: [0.75, 0.6, 0.35],
    palette: [
      [0.8, 0.65, 0.4],
      [0.55, 0.4, 0.25],
      [0.9, 0.8, 0.55],
      [0.3, 0.45, 0.35],
    ],
  },
  abstract: {
    sky: [0.08, 0.06, 0.12],
    ground: [0.06, 0.06, 0.09],
    palette: [
      [0.9, 0.3, 0.6],
      [0.3, 0.9, 0.7],
      [0.5, 0.4, 0.95],
      [0.95, 0.7, 0.2],
    ],
  },
};

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], hash: number, offset: number): T {
  return items[(hash + offset) % items.length];
}

export function detectTheme(prompt: string): keyof typeof THEMES {
  const lower = prompt.toLowerCase();
  if (/(city|urban|building|skyscraper|neon|street|office)/.test(lower)) return "city";
  if (/(mountain|snow|peak|valley|hike)/.test(lower)) return "mountain";
  if (/(forest|jungle|tree|woods|nature)/.test(lower)) return "forest";
  if (/(ocean|sea|beach|water|underwater|wave|ship)/.test(lower)) return "ocean";
  if (/(space|planet|star|galaxy|solar|orbit|rocket|moon)/.test(lower)) return "space";
  if (/(desert|sand|dune|oasis|arid)/.test(lower)) return "desert";
  return "abstract";
}

const STRUCTURES: Record<string, ScenePrimitive[][]> = {
  city: [["box"], ["box", "box"], ["box"], ["cylinder"], ["box", "box", "box"]],
  mountain: [["cone"], ["cone", "cone"], ["cone"], ["box"], ["sphere"]],
  forest: [["cylinder", "cone"], ["cylinder", "cone"], ["box"], ["sphere"], ["cylinder"]],
  ocean: [["plane"], ["box"], ["sphere"], ["cone"], ["box", "box"]],
  space: [["sphere"], ["box"], ["box", "box"], ["sphere", "sphere"], ["cone"]],
  desert: [["cone"], ["box"], ["sphere"], ["cone", "box"], ["box", "box"]],
  abstract: [["box"], ["sphere"], ["cone"], ["box", "sphere"], ["cylinder"]],
};

export function generateScene(prompt: string, opts?: { meshQuality?: string; polyCount?: string; textureRes?: string }): GeneratedScene {
  const theme = detectTheme(prompt);
  const hash = stableHash(prompt.trim().toLowerCase());
  const palette = THEMES[theme].palette;
  const objects: GeneratedSceneObject[] = [];
  const materials: GeneratedSceneMaterial[] = [];

  const detail = opts?.meshQuality === "High" ? 3 : opts?.meshQuality === "Low" ? 1 : 2;

  const groundMaterial: GeneratedSceneMaterial = {
    id: "mat-ground",
    color: THEMES[theme].ground,
    metalness: 0,
    roughness: 0.9,
  };
  materials.push(groundMaterial);

  objects.push({
    id: "ground",
    name: "Ground Plane",
    type: "plane",
    meshUrl: "",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [20, 20, 1],
    material: "mat-ground",
  });

  const structures = STRUCTURES[theme];
  const objectCount = (4 + (hash % 4)) * detail;

  for (let i = 0; i < objectCount; i++) {
    const kit = pick(structures, hash, i * 3);
    const baseColor = pick(palette, hash, i * 5 + 2);
    const matId = `mat-${i}`;
    materials.push({
      id: matId,
      color: baseColor,
      metalness: theme === "city" || theme === "space" ? 0.6 : 0.1,
      roughness: theme === "city" || theme === "space" ? 0.4 : 0.75,
      emissive: theme === "city" || theme === "space" ? [baseColor[0] * 0.5, baseColor[1] * 0.5, baseColor[2] * 0.5] : undefined,
    });

    const x = (hash % 9) - 4 + (i % 3) * 2.4;
    const z = (Math.floor(hash / 3) % 9) - 4 + (Math.floor(i / 3) % 3) * 2.4;
    let yOffset = 0.5;

    kit.forEach((primitiveType, j) => {
      const height = 1 + ((hash + i * 7 + j * 11) % 3);
      const scale: [number, number, number] =
        primitiveType === "cone" || primitiveType === "sphere"
          ? [0.8 + ((hash + j) % 2), 1 + ((hash + i + j) % 3), 0.8 + ((hash + j * 3) % 2)]
          : [1 + ((hash + j * 2) % 2), height, 1 + ((hash + j) % 2)];

      objects.push({
        id: `obj-${i}-${j}`,
        name: `${theme}-${primitiveType}-${i}-${j}`,
        type: primitiveType,
        meshUrl: "",
        position: [x + j * 0.6, yOffset + (j === 0 ? 0 : height * 0.5), z + (j % 2 === 0 ? 0 : 0.9)],
        rotation: [0, ((hash + i + j) * 45) % 360, 0],
        scale,
        material: matId,
      });
      yOffset += height;
    });
  }

  const lights: SceneLight[] = [
    {
      id: "light-key",
      type: "directional",
      color: [1, 1, 1],
      intensity: 1.2,
      direction: [-1, -1, -0.3],
    },
    {
      id: "light-rim",
      type: "point",
      color: pick(palette, hash, 17),
      intensity: theme === "space" || theme === "abstract" ? 2.5 : 0.8,
      position: [4, 6, -4],
    },
  ];

  const camera: SceneCamera = {
    position: [0, 5, 10],
    target: [0, 1, 0],
    fov: 60,
  };

  return {
    name: `AI Scene — ${theme}`,
    description: `Procedurally generated ${theme} scene from prompt: "${prompt.slice(0, 80)}"`,
    objects,
    materials,
    lights,
    camera,
    sky: { type: "color", color: THEMES[theme].sky },
    skybox: undefined,
  };
}


