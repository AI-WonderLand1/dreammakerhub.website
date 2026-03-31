import { logger } from "@lib/logger";
export const PLATFORM_MAP = {
  web: "builder/canvas/WebCanvas.tsx",
  ios: "builder/canvas/IOSCanvas.tsx",
  android: "builder/canvas/AndroidCanvas.tsx",
  multi: "builder/canvas/MultiCanvas.tsx"
};

export class FileSystemManager {
  /**
   * Writes AI-generated content to the project structure.
   * Clean Coding: Paths are strictly mapped to prevent directory traversal.
   */
  static async saveToCanvas(platform: Platform, content: string) {
    const fileName = PLATFORM_MAP[platform];
    const path = `app/(builder)/wonder-build/${fileName}`;

    logger.info("Writing generated code to canvas", { platform, path });
    
    // This calls your existing fileworkers.ts logic
    return await fetch('/api/ide/apply', {
      method: 'POST',
      body: JSON.stringify({ path, content })
    });
  }
}
