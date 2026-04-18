/**
 * *burp* This is where we keep the shiny things so the AI doesn't 
 * have to guess what's in the 'robots' folder. 
 */
export const AVAILABLE_3D_ASSETS = [
  {
    id: "robot-1",
    name: "Robot 1",
    path: "/robots/robot1.glb",
    tags: ["robot", "character", "3d", "mechanical"],
    description: "A standard humanoid robot model for drag-and-drop builders."
  },
  {
    id: "robot-2",
    name: "Robot 2",
    path: "/robots/robot2.glb",
    tags: ["robot", "heavy", "3d", "android"],
    description: "A bulky, high-detail mechanical robot model."
  },
  {
    id: "robot-3",
    name: "Robot 3",
    path: "/robots/robot3.glb",
    tags: ["robot", "scout", "3d", "drone"],
    description: "A nimble scavenger robot model."
  }
];

export const getAiAssetContext = () => {
  return JSON.stringify(AVAILABLE_3D_ASSETS);
};

export async function uploadAiAssetEntry(entry: { id: string; name: string; path: string; tags: string[]; description: string }) {
  AVAILABLE_3D_ASSETS.push(entry);
  return { success: true, entry };
}
