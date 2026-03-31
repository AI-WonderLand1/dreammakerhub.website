export type GatewayExperience = "web-app" | "game";

export interface GatewayService {
  name: string;
  port: number;
  purpose: string;
}

export const GATEWAY_LAUNCH_MATRIX: Record<GatewayExperience, GatewayService[]> = {
  "web-app": [
    { name: "Theia IDE", port: 3000, purpose: "TypeScript/C++ editing" },
    { name: "Puck Editor", port: 3001, purpose: "Visual forge" },
  ],
  game: [
    { name: "Theia IDE", port: 3000, purpose: "C++ scripting" },
  ],
};

export function resolveGatewayExperience(mode: "wonderspace" | "component" | "website" | "game"): GatewayExperience {
  return mode === "game" ? "game" : "web-app";
}
